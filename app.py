import streamlit as st
import pickle
import numpy as np
import pandas as pd
import os

# --- Configuration --- #
st.set_page_config(page_title="Crop Prediction App", layout="wide")

# --- Define paths to models and encoders ---
# Ensure these paths are correct relative to where your Streamlit app will be run
MODEL_DIR = 'trained_models'
PRODUCTION_MODEL_PATH = os.path.join(MODEL_DIR, 'xgboost_production_model.pkl')
PRICE_MODEL_PATH = os.path.join(MODEL_DIR, 'xgboost_modal_price_model.pkl')
PRODUCTION_ENCODER_PATH = os.path.join(MODEL_DIR, 'ordinal_encoder_production_features.pkl')
PRICE_ENCODER_PATH = os.path.join(MODEL_DIR, 'ordinal_encoder_price_features.pkl')

# --- Helper function to load models/encoders ---
@st.cache_resource
def load_object(filepath):
    try:
        with open(filepath, 'rb') as file:
            obj = pickle.load(file)
        return obj
    except FileNotFoundError:
        st.error(f"Error: Model file not found at {filepath}. Please ensure the models are in the '{MODEL_DIR}' directory.")
        st.stop()
    except Exception as e:
        st.error(f"Error loading {filepath}: {e}")
        st.stop()

# --- Load Models and Encoders ---
production_model = load_object(PRODUCTION_MODEL_PATH)
price_model = load_object(PRICE_MODEL_PATH)
production_encoder = load_object(PRODUCTION_ENCODER_PATH)
price_encoder = load_object(PRICE_ENCODER_PATH)

st.title("🌾 Crop and Market Price Prediction App")
st.markdown("--- ---")

# --- Sidebar for Navigation (Optional, for future expansion) ---
# st.sidebar.header("Navigation")
# page = st.sidebar.radio("Go to", ["Production Prediction", "Price Prediction"])

# --- Production Prediction Section ---
st.header("1. Crop Production Prediction (Yield Engine)")

st.subheader("Input Features for Production Prediction")

col1, col2, col3 = st.columns(3)

with col1:
    state_prod = st.selectbox("State (Production)", options=production_encoder.categories_[0])
    crop_type_prod = st.selectbox("Crop (Production)", options=production_encoder.categories_[1])
with col2:
    season_prod = st.selectbox("Season (Production)", options=production_encoder.categories_[2])
    area_prod = st.number_input("Area", min_value=1.0, value=1000.0)
with col3:
    rainfall_prod = st.number_input("Rainfall (Scaled)", value=0.0)
    # Note: Rainfall was scaled, so input here should ideally be scaled or converted internally
    # For simplicity, we assume a scaled input for now, but in a real app, you'd un-scale user input.

if st.button("Predict Production"):
    try:
        # Encode categorical inputs
        encoded_state_prod = production_encoder.transform([[state_prod, crop_type_prod, season_prod]])[0, 0]
        encoded_crop_prod = production_encoder.transform([[state_prod, crop_type_prod, season_prod]])[0, 1]
        encoded_season_prod = production_encoder.transform([[state_prod, crop_type_prod, season_prod]])[0, 2]

        # Create feature array for prediction
        features_prod = np.array([[encoded_state_prod, encoded_crop_prod, encoded_season_prod, area_prod, rainfall_prod]])

        # Predict
        production_prediction = production_model.predict(features_prod)[0]
        st.success(f"Predicted Production: {production_prediction:,.2f} units")
    except Exception as e:
        st.error(f"Error predicting production: {e}")

st.markdown("--- ---")

# --- Price Prediction Section ---
st.header("2. Crop Modal Price Prediction (Price Engine)")

st.subheader("Input Features for Price Prediction")

col4, col5, col6 = st.columns(3)

with col4:
    state_price = st.selectbox("State (Price)", options=price_encoder.categories_[0])
    district_price = st.selectbox("District (Price)", options=price_encoder.categories_[1])
    market_price = st.selectbox("Market (Price)", options=price_encoder.categories_[2])
with col5:
    commodity_price = st.selectbox("Commodity (Price)", options=price_encoder.categories_[3])
    variety_price = st.selectbox("Variety (Price)", options=price_encoder.categories_[4])
    grade_price = st.selectbox("Grade (Price)", options=price_encoder.categories_[5])
with col6:
    year_price = st.number_input("Year (Price)", min_value=2000, max_value=2025, value=2023)
    month_price = st.number_input("Month (Price)", min_value=1, max_value=12, value=1)
    min_price_input = st.number_input("Min Price", value=500.0)
    max_price_input = st.number_input("Max Price", value=1000.0)

if st.button("Predict Modal Price"):
    try:
        # Encode categorical inputs (for price model)
        encoded_state_price = price_encoder.transform([[state_price, district_price, market_price, commodity_price, variety_price, grade_price]])[0, 0]
        encoded_district_price = price_encoder.transform([[state_price, district_price, market_price, commodity_price, variety_price, grade_price]])[0, 1]
        encoded_market_price = price_encoder.transform([[state_price, district_price, market_price, commodity_price, variety_price, grade_price]])[0, 2]
        encoded_commodity_price = price_encoder.transform([[state_price, district_price, market_price, commodity_price, variety_price, grade_price]])[0, 3]
        encoded_variety_price = price_encoder.transform([[state_price, district_price, market_price, commodity_price, variety_price, grade_price]])[0, 4]
        encoded_grade_price = price_encoder.transform([[state_price, district_price, market_price, commodity_price, variety_price, grade_price]])[0, 5]

        # Create feature array for prediction
        features_price = np.array([[encoded_state_price, encoded_district_price, encoded_market_price,
                                      encoded_commodity_price, encoded_variety_price, encoded_grade_price,
                                      year_price, month_price, min_price_input, max_price_input]])

        # Predict
        price_prediction = price_model.predict(features_price)[0]
        st.success(f"Predicted Modal Price: {price_prediction:,.2f} INR")
    except Exception as e:
        st.error(f"Error predicting modal price: {e}")

st.markdown("--- ---")
st.info("Note: Rainfall input for Production Prediction is expected in its scaled form. For a production app, you would include the StandardScaler for inverse transformation or accept raw rainfall and scale it internally.")
