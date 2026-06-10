# Use a slim Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (libgomp1 is required by xgboost)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only necessary files
COPY main.py .
COPY database.py .
COPY xgboost_production_model.pkl .
COPY xgboost_modal_price_model.pkl .
COPY ordinal_encoder_production_features.pkl .
COPY ordinal_encoder_price_features.pkl .
COPY FINAL_CLEAN_AGRI_DATASET.csv .
COPY static ./static

# Expose port 8080
EXPOSE 8080

# Run uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
