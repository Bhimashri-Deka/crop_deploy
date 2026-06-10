import subprocess
import time
import requests
import sqlite3
import os
import sys

def run_tests():
    print("Starting FastAPI app in background...")
    # Run the server on port 8080 using the current python executable
    env = os.environ.copy()
    env["PORT"] = "8080"
    env["DB_PATH"] = "test_crop_app.db"
    env["SECRET_KEY"] = "verification_test_secret_key"
    
    # Delete test DB if it exists to start fresh
    if os.path.exists("test_crop_app.db"):
        try:
            os.remove("test_crop_app.db")
        except Exception:
            pass

    server_process = subprocess.Popen(
        [sys.executable, "main.py"],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    # Wait for the server to boot
    time.sleep(5)
    
    BASE_URL = "http://localhost:8080"
    session = requests.Session()
    
    try:
        # 1. Health check
        print("Checking health endpoint...")
        r = session.get(f"{BASE_URL}/health")
        print("Health check response:", r.status_code, r.json())
        assert r.status_code == 200, "Health check failed"
        
        # 2. Register user
        print("\nRegistering test user...")
        reg_payload = {"username": "prod_tester", "password": "password_secure_123"}
        r = session.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
        print("Register response:", r.status_code, r.json())
        assert r.status_code in [200, 201], "Registration failed"
        
        # 3. Login user
        print("\nLogging in test user...")
        r = session.post(f"{BASE_URL}/api/auth/login", json=reg_payload)
        print("Login response:", r.status_code, r.json())
        assert r.status_code == 200, "Login failed"
        
        # 4. Fetch metadata defaults for Assam
        print("\nFetching defaults for ASSAM...")
        state = "ASSAM"
        district = "CACHAR"
        crop = "Rice"
        r = session.get(f"{BASE_URL}/api/metadata/defaults?state={state}&district={district}&crop={crop}")
        print("Assam defaults response:", r.status_code, r.json())
        assert r.status_code == 200, "Failed to get defaults for Assam"
        defaults = r.json()
        
        # 5. Predict yield and price for Assam (triggers fallback yield prediction)
        print("\nTesting prediction fallback for ASSAM...")
        predict_payload = {
            "state": state,
            "district": district,
            "crop": crop,
            "season": "Autumn",
            "area": 10.0,
            "rainfall": defaults["rainfall"],
            "min_price": defaults["min_price"],
            "max_price": defaults["max_price"]
        }
        r = session.post(f"{BASE_URL}/api/predict", json=predict_payload)
        print("Assam prediction response:", r.status_code, r.json())
        assert r.status_code == 200, "Assam prediction failed"
        assam_pred = r.json()
        assert assam_pred.get("predicted_yield_tonnes") is not None, "Yield prediction is missing"
        assert assam_pred.get("predicted_price_inr_quintal") is not None, "Price prediction is missing"
        
        # 6. Verify database persistence
        print("\nChecking test database for log persistence...")
        conn = sqlite3.connect("test_crop_app.db")
        cursor = conn.cursor()
        cursor.execute("SELECT username, crop, state, predicted_yield, predicted_price FROM prediction_logs")
        rows = cursor.fetchall()
        print("Database logged predictions:", rows)
        assert len(rows) > 0, "No prediction logs found in database"
        assert rows[0][0] == "prod_tester", "Username log mismatched"
        assert rows[0][1] == "Rice", "Crop log mismatched"
        assert rows[0][2] == "ASSAM", "State log mismatched"
        conn.close()
        
        print("\nAll production checks passed successfully!")
        
    except Exception as e:
        print("\nVerification ERROR:", e)
        # Get server process stdout/stderr if possible
        server_process.kill()
        stdout, stderr = server_process.communicate()
        print("Server stdout:", stdout.decode("utf-8", errors="ignore"))
        print("Server stderr:", stderr.decode("utf-8", errors="ignore"))
        sys.exit(1)
    finally:
        print("\nStopping FastAPI server...")
        server_process.kill()
        server_process.wait()
        
        # Clean up test DB
        if os.path.exists("test_crop_app.db"):
            try:
                os.remove("test_crop_app.db")
            except Exception:
                pass

if __name__ == "__main__":
    run_tests()
