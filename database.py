import sqlite3
import hashlib
import os
from datetime import datetime

DB_PATH = os.environ.get("DB_PATH", "crop_app.db")

# Ensure directory exists for volume mounts
db_dir = os.path.dirname(DB_PATH)
if db_dir:
    os.makedirs(db_dir, exist_ok=True)

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    )
    """)
    
    # Create prediction logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS prediction_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        crop TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        season TEXT NOT NULL,
        area REAL NOT NULL,
        rainfall REAL NOT NULL,
        predicted_yield REAL NOT NULL,
        predicted_price REAL NOT NULL,
        total_value REAL NOT NULL,
        latency_ms REAL NOT NULL,
        status TEXT NOT NULL
    )
    """)
    
    # Create auth events table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS auth_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        action TEXT NOT NULL, -- e.g., 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'REGISTER'
        ip_address TEXT,
        timestamp TEXT NOT NULL
    )
    """)
    
    # Check if a default user exists, if not create 'admin' with password 'admin123'
    cursor.execute("SELECT id FROM users WHERE username = ?", ("admin",))
    if not cursor.fetchone():
        salt = os.urandom(16).hex()
        # PBKDF2 HMAC SHA-256
        key = hashlib.pbkdf2_hmac('sha256', b"admin123", salt.encode('utf-8'), 100000)
        password_hash = f"{salt}${key.hex()}"
        cursor.execute(
            "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
            ("admin", password_hash, datetime.utcnow().isoformat())
        )
        
    conn.commit()
    conn.close()

def hash_password(password: str, salt: str = None) -> str:
    if salt is None:
        salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, key_hex = stored_hash.split("$")
        computed_hash = hash_password(password, salt)
        return computed_hash == stored_hash
    except Exception:
        return False

def register_user(username: str, password: str) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        if cursor.fetchone():
            return False
        password_hash = hash_password(password)
        cursor.execute(
            "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
            (username, password_hash, datetime.utcnow().isoformat())
        )
        conn.commit()
        return True
    except Exception:
        return False
    finally:
        conn.close()

def authenticate_user(username: str, password: str, ip_address: str = None) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT password_hash FROM users WHERE username = ?", (username,))
        row = cursor.fetchone()
        if not row:
            log_auth_event(username, "LOGIN_FAILURE", ip_address)
            return False
        
        stored_hash = row["password_hash"]
        if verify_password(password, stored_hash):
            log_auth_event(username, "LOGIN_SUCCESS", ip_address)
            return True
        else:
            log_auth_event(username, "LOGIN_FAILURE", ip_address)
            return False
    finally:
        conn.close()

def log_auth_event(username: str, action: str, ip_address: str = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO auth_events (username, action, ip_address, timestamp) VALUES (?, ?, ?, ?)",
            (username, action, ip_address, datetime.utcnow().isoformat())
        )
        conn.commit()
    finally:
        conn.close()

def log_prediction(username: str, crop: str, state: str, district: str, season: str, 
                   area: float, rainfall: float, yield_val: float, price_val: float, 
                   total: float, latency: float, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO prediction_logs 
            (username, timestamp, crop, state, district, season, area, rainfall, predicted_yield, predicted_price, total_value, latency_ms, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (username, datetime.utcnow().isoformat(), crop, state, district, season, area, rainfall, yield_val, price_val, total, latency, status))
        conn.commit()
    finally:
        conn.close()

def get_monitoring_stats():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # 1. Total Predictions
        cursor.execute("SELECT COUNT(*) FROM prediction_logs")
        total_predictions = cursor.fetchone()[0]
        
        # 2. Average Latency (Success only)
        cursor.execute("SELECT AVG(latency_ms) FROM prediction_logs WHERE status = 'SUCCESS'")
        row = cursor.fetchone()
        avg_latency = row[0] if row[0] is not None else 0.0
        
        # 3. Error Rate
        cursor.execute("SELECT COUNT(*) FROM prediction_logs WHERE status = 'ERROR'")
        error_count = cursor.fetchone()[0]
        error_rate = (error_count / total_predictions * 100) if total_predictions > 0 else 0.0
        
        # 4. Latency trends (last 20 successful predictions)
        cursor.execute("SELECT timestamp, latency_ms FROM prediction_logs WHERE status = 'SUCCESS' ORDER BY id DESC LIMIT 20")
        latency_history = [{"timestamp": r["timestamp"], "latency": r["latency_ms"]} for r in cursor.fetchall()]
        latency_history.reverse()
        
        # 5. Recent Predictions
        cursor.execute("SELECT * FROM prediction_logs ORDER BY id DESC LIMIT 10")
        recent_predictions = [dict(r) for r in cursor.fetchall()]
        
        # 6. Auth Audit logs
        cursor.execute("SELECT * FROM auth_events ORDER BY id DESC LIMIT 10")
        recent_auth_events = [dict(r) for r in cursor.fetchall()]
        
        return {
            "total_predictions": total_predictions,
            "avg_latency_ms": round(avg_latency, 2),
            "error_rate_pct": round(error_rate, 2),
            "latency_history": latency_history,
            "recent_predictions": recent_predictions,
            "recent_auth_events": recent_auth_events
        }
    finally:
        conn.close()
