import pandas as pd
import numpy as np

df = pd.read_csv("FINAL_CLEAN_AGRI_DATASET.csv")

# Let's inspect rows where Min_Price is not NaN and check if there's a relationship.
# In the CSV:
# Row 2: Modal_Price = 657.0570571, Min_Price = -1.364624513, Max_Price = -1.402751655
# Row 100: Modal_Price = 1621.850789, Min_Price = 0.00619836, Max_Price = -0.048399435
# Row 140: Modal_Price = 1615.921569, Min_Price = 0.020123454, Max_Price = -0.089598506
# Row 179: Modal_Price = 1888.594595, Min_Price = 0.214033785, Max_Price = 0.136481557
# Row 199: Modal_Price = 2060.809935, Min_Price = 0.3965723, Max_Price = 0.278497845
# Row 235: Modal_Price = 2454.607843, Min_Price = 0.688519644, Max_Price = 0.630850917
# Row 275: Modal_Price = 2501.700441, Min_Price = 0.77625316, Max_Price = 0.637511106
# Row 315: Modal_Price = 2850.833333, Min_Price = 1.076022253, Max_Price = 0.918379923

# Let's check if there is a linear relationship between Modal_Price and Min_Price (scaled)
# If Min_Price_scaled = (Min_Price_raw - Mean) / Std
# And Max_Price_scaled = (Max_Price_raw - Mean) / Std
# Is it possible that Min_Price_raw and Max_Price_raw are just proportional to Modal_Price?
# Let's see if we can find a linear relationship between Min_Price (scaled) and Modal_Price,
# or if we can see if they are standard-scaled from actual raw minimum/maximum prices.
# Let's read some raw data from Mandi if possible, or see if we can estimate the scaling parameters.

# Let's check correlation between Modal_Price and Min_Price, Max_Price
print("Correlations:")
print(f"  Modal_Price & Min_Price: {df['Modal_Price'].corr(df['Min_Price']):.6f}")
print(f"  Modal_Price & Max_Price: {df['Modal_Price'].corr(df['Max_Price']):.6f}")
print(f"  Min_Price & Max_Price:   {df['Min_Price'].corr(df['Max_Price']):.6f}")

# Let's run a regression of Min_Price on Modal_Price. If it is standard scaled,
# and min_price_raw is usually close to modal_price (e.g. min_price_raw = modal_price * 0.9 or similar),
# we might find a very high correlation.
# Let's see if we fit:
# Min_Price_scaled = a * Modal_Price + b
# Let's print some sample rows and compute (Modal_Price - mean) / std for comparison.
modal_mean = df["Modal_Price"].mean()
modal_std = df["Modal_Price"].std()
print(f"Modal Mean: {modal_mean}, Std: {modal_std}")

df["Modal_Price_scaled"] = (df["Modal_Price"] - modal_mean) / modal_std
print("Difference between Min_Price and Modal_Price_scaled:")
print((df["Min_Price"] - df["Modal_Price_scaled"]).describe())
print("Difference between Max_Price and Modal_Price_scaled:")
print((df["Max_Price"] - df["Modal_Price_scaled"]).describe())
