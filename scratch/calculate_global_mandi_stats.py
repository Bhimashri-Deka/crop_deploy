import pandas as pd
import glob
import os

mandi_files = glob.glob("mandi_data_2001to2014/*.csv")

total_count = 0
min_sum = 0.0
max_sum = 0.0

# First pass: compute mean
for f in mandi_files:
    print(f"Reading {f} for mean...")
    df = pd.read_csv(f, usecols=["Min_Price", "Max_Price"])
    # Drop NaNs
    df = df.dropna()
    total_count += len(df)
    min_sum += df["Min_Price"].sum()
    max_sum += df["Max_Price"].sum()

global_mean_min = min_sum / total_count
global_mean_max = max_sum / total_count

print(f"\nGlobal Mean Min_Price: {global_mean_min:.6f}")
print(f"Global Mean Max_Price: {global_mean_max:.6f}")

# Second pass: compute std
min_sq_diff_sum = 0.0
max_sq_diff_sum = 0.0

for f in mandi_files:
    print(f"Reading {f} for std...")
    df = pd.read_csv(f, usecols=["Min_Price", "Max_Price"]).dropna()
    min_sq_diff_sum += ((df["Min_Price"] - global_mean_min) ** 2).sum()
    max_sq_diff_sum += ((df["Max_Price"] - global_mean_max) ** 2).sum()

global_std_min = (min_sq_diff_sum / (total_count - 1)) ** 0.5
global_std_max = (max_sq_diff_sum / (total_count - 1)) ** 0.5

print(f"\nGlobal Std Min_Price: {global_std_min:.6f}")
print(f"Global Std Max_Price: {global_std_max:.6f}")
