# AgroPredict: Crop Yield & Price Prediction Platform

🚀 **Live Demo:** [https://agropredict-bac9.onrender.com](https://agropredict-bac9.onrender.com)

AgroPredict is a production-ready web application built with FastAPI and SQLite. It provides crop yield predictions (using pre-trained XGBoost models and historical fallbacks for newer regions like Assam) and commodity price forecasts to help farmers, researchers, and administrators make data-driven agricultural decisions.

---

## Features

- **Yield Prediction:** Powered by XGBoost regression, with fallback calculations to historical averages when pre-trained category mappings (like the newly added state of Assam) are unavailable.
- **Price Forecasting:** Machine learning-based modal price predictions.
- **Interactive SPA Frontend:** A premium, responsive dashboard displaying analytics, projections, and logs.
- **Audit & Analytics Logging:** Tracks user predictions and authentication history in a persistent SQLite database.
- **Production-Ready Deployment:** Formatted for easy Container/Docker execution and automated Render deployments.

---

## Getting Started Locally

### Prerequisites
- Python 3.11+ (if running bare-metal)
- Docker (recommended)

### Default Admin Credentials
- **Username:** `admin`
- **Password:** `admin123`

---

## Running Locally with Docker

You can package and run the application inside a clean Docker container to avoid local dependency configuration.

1. **Build the Docker Image:**
   ```bash
   docker build -t agropredict .
   ```

2. **Run the Container:**
   ```bash
   docker run -p 8080:8080 -e SECRET_KEY="your_secure_random_key_here" agropredict
   ```
   Open your browser and navigate to `http://localhost:8080` to access the application.

3. **Running with a Local Volume (for database persistence):**
   ```bash
   docker run -p 8080:8080 \
     -e SECRET_KEY="your_secure_random_key_here" \
     -e DB_PATH="/data/crop_app.db" \
     -v "$(pwd)/data:/data" \
     agropredict
   ```

---

## Deploying to Render

### Option 1: Using the Render Blueprint (Recommended)
This repository contains a `render.yaml` Blueprint definition file. Render can read this file to automatically spin up the Web Service, mount a persistent disk, and inject the environment variables.

1. Push this project repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Log in to your [Render Dashboard](https://dashboard.render.com).
3. Navigate to **Blueprints** and click **New Blueprint Instance**.
4. Connect the repository containing this project.
5. Render will automatically read the `render.yaml` file, provision a standard Web Service, configure a 1GB persistent disk at `/data`, and deploy the service.

### Option 2: Manual Render Deployment

If you prefer to configure the service manually on Render:

1. Create a new **Web Service** on Render and connect your repository.
2. Select **Docker** as the Runtime environment.
3. Choose your instance type:
   - **Free Plan (No Card Required):** Database will run inside the container. It is completely free, but any database logs/new user registrations will reset whenever Render restarts your server (at least once daily).
   - **Paid Plans (Requires Card):** For production persistence, use a paid tier.
4. (Optional) In the **Advanced** section, add the following Environment Variables:
   - `SECRET_KEY`: A secure key for session token signing (e.g., `my_secure_random_key_here`).
   - `DB_PATH`: Set to `/data/crop_app.db` **only** if you are using a persistent disk. If you are on the Free Plan, do not set this variable.
5. **For Paid Plans only (Disk Mount):** Under the **Disks** section, click **Add Disk**:
   - **Name:** `agropredict-data`
   - **Mount Path:** `/data`
   - **Size:** `1 GiB`
6. Click **Create Web Service**. Render will automatically build the `Dockerfile` and start the application on port `8080`.
