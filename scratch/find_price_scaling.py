import pandas as pd
import numpy as np
import glob
import os

# 1. Load all mandi data and group by State, District, Year
mandi_dfs = []
for f in glob.glob("mandi_data_2001to2014/*.csv"):
    year = int(os.path.basename(f).split(".")[0])
    df = pd.read_csv(f, usecols=["State", "District", "Min_Price", "Max_Price"])
    df["Year"] = year
    # Clean up strings
    df["State"] = df["State"].str.strip().str.upper()
    df["District"] = df["District"].str.strip().str.upper()
    mandi_dfs.append(df)

df_mandi = pd.concat(mandi_dfs, ignore_index=True)
print("Loaded mandi shape:", df_mandi.shape)

# Compute mean per state, district, year
mandi_grouped = df_mandi.groupby(["State", "District", "Year"]).mean().reset_index()
print("Grouped mandi shape:", mandi_grouped.shape)

# 2. Load agri dataset
df_agri = pd.read_csv("FINAL_CLEAN_AGRI_DATASET.csv")
df_agri["State"] = df_agri["State"].str.strip().str.upper()
df_agri["District"] = df_agri["District"].str.strip().str.upper()

# Merge
merged = pd.merge(df_agri, mandi_grouped, on=["State", "District", "Year"])
print("Merged shape:", merged.shape)

if len(merged) > 10:
    # We want to find the linear fit: Raw = a * Scaled + b
    # where a = Std, b = Mean
    # Let's do it for Min_Price
    x_min = merged["Min_Price_x"].values # scaled from agri
    y_min = merged["Min_Price_y"].values # raw from mandi
    mask_min = ~np.isnan(x_min) & ~np.isnan(y_min)
    x_min = x_min[mask_min]
    y_min = y_min[mask_min]
    
    slope_min, intercept_min = np.polyfit(x_min, y_min, 1)
    print(f"\nMin_Price fit: Raw_Min = {slope_min:.4f} * Scaled_Min + {intercept_min:.4f}")
    y_pred_min = slope_min * x_min + intercept_min
    r2_min = 1 - np.sum((y_min - y_pred_min)**2) / np.sum((y_min - np.mean(y_min))**2)
    print(f"Min_Price R^2: {r2_min:.6f}")
    
    # Let's do it for Max_Price
    x_max = merged["Max_Price_x"].values # scaled from agri
    y_max = merged["Max_Price_y"].values # raw from mandi
    mask_max = ~np.isnan(x_max) & ~np.isnan(y_max)
    x_max = x_max[mask_max]
    y_max = y_max[mask_max]
    
    slope_max, intercept_max = np.polyfit(x_max, y_max, 1)
    print(f"\nMax_Price fit: Raw_Max = {slope_max:.4f} * Scaled_Max + {intercept_max:.4f}")
    y_pred_max = slope_max * x_max + intercept_max
    r2_max = 1 - np.sum((y_max - y_pred_max)**2) / np.sum((y_max - np.mean(y_max))**2)
    print(f"Max_Price R^2: {r2_max:.6f}")
else:
    print("Not enough merged rows to fit prices.")
