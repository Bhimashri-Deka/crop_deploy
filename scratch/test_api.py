import requests

BASE_URL = "http://localhost:8080"

def test_api():
    # 1. Register a temporary user
    reg_payload = {"username": "testuser_ver", "password": "password123"}
    try:
        r = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
        print("Register response:", r.status_code, r.json())
    except Exception as e:
        print("Register failed (might already exist):", e)
    
    # 2. Login
    session = requests.Session()
    r = session.post(f"{BASE_URL}/api/auth/login", json=reg_payload)
    print("Login response:", r.status_code, r.json())
    
    # 3. Predict defaults
    state = "KERALA"
    district = "ALAPPUZHA"
    crop = "Pump Kin"
    r = session.get(f"{BASE_URL}/api/metadata/defaults?state={state}&district={district}&crop={crop}")
    print("Defaults response:", r.status_code, r.json())
    defaults = r.json()
    
    # 4. Predict
    predict_payload = {
        "state": state,
        "district": district,
        "crop": crop,
        "season": "Kharif",
        "area": 10.0,
        "rainfall": defaults["rainfall"],
        "min_price": defaults["min_price"],
        "max_price": defaults["max_price"]
    }
    r = session.post(f"{BASE_URL}/api/predict", json=predict_payload)
    print("Predict response:", r.status_code)
    pred_res = r.json()
    print("Predicted yield tonnes:", pred_res.get("predicted_yield_tonnes"))
    print("Predicted price quintal:", pred_res.get("predicted_price_inr_quintal"))
    print("Total estimated value inr:", pred_res.get("total_estimated_value_inr"))
    print("Inputs used in model:", pred_res.get("inputs_used"))

if __name__ == "__main__":
    test_api()
