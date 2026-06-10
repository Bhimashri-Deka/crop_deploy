import pandas as pd
import numpy as np
import glob
import os

print("--- Starting Assam Data Alignment ---")

# 1. Load crop production data for Assam
print("Loading crop_production.csv...")
df_prod = pd.read_csv("crop_production.csv")
df_assam_prod = df_prod[df_prod["State_Name"].str.strip().str.upper() == "ASSAM"].copy()
print(f"Loaded {len(df_assam_prod)} crop production rows for Assam.")

# Normalize strings
df_assam_prod["State_Name"] = "ASSAM"
df_assam_prod["District_Name"] = df_assam_prod["District_Name"].str.strip().str.upper()
df_assam_prod["Crop"] = df_assam_prod["Crop"].str.strip()
df_assam_prod["Season"] = df_assam_prod["Season"].str.strip()

# 2. Load and aggregate Mandi price data for Assam
mandi_files = glob.glob("mandi_data_2001to2014/*.csv")
mandi_list = []
print("Loading Mandi price files for Assam...")
for f in mandi_files:
    filename = os.path.basename(f)
    year = int(filename.split(".")[0])
    
    # Read only required columns to save memory and speed up
    df_m = pd.read_csv(f, usecols=["State", "District", "Commodity", "Min_Price", "Max_Price", "Modal_Price"])
    df_m_assam = df_m[df_m["State"].str.strip().str.upper() == "ASSAM"].copy()
    
    if len(df_m_assam) > 0:
        df_m_assam["Year"] = year
        mandi_list.append(df_m_assam)

if mandi_list:
    df_mandi_all = pd.concat(mandi_list, ignore_index=True)
    df_mandi_all["District"] = df_mandi_all["District"].str.strip().str.upper()
    df_mandi_all["Commodity"] = df_mandi_all["Commodity"].str.strip().str.lower()
    print(f"Loaded {len(df_mandi_all)} raw Mandi rows for Assam.")
else:
    df_mandi_all = pd.DataFrame(columns=["State", "District", "Commodity", "Min_Price", "Max_Price", "Modal_Price", "Year"])
    print("WARNING: No Mandi rows found for Assam!")

# Group Mandi data by District, Year, and Commodity
mandi_group = df_mandi_all.groupby(["District", "Year", "Commodity"]).agg({
    "Min_Price": "mean",
    "Max_Price": "mean",
    "Modal_Price": "mean"
}).reset_index()

# Group Mandi data state-wide by Year and Commodity
mandi_state_group = df_mandi_all.groupby(["Year", "Commodity"]).agg({
    "Min_Price": "mean",
    "Max_Price": "mean",
    "Modal_Price": "mean"
}).reset_index()

# Group Mandi data globally by Commodity (average across all years)
mandi_global_group = df_mandi_all.groupby(["Commodity"]).agg({
    "Min_Price": "mean",
    "Max_Price": "mean",
    "Modal_Price": "mean"
}).reset_index()

# Crop to Commodity mapping dictionary
crop_to_commodities = {
    "rice": ["paddy", "rice"],
    "paddy": ["paddy", "rice"],
    "wheat": ["wheat", "atta", "maida"],
    "potato": ["potato"],
    "jute": ["jute"],
    "maize": ["maize"],
    "onion": ["onion"],
    "turmeric": ["turmeric"],
    "ginger": ["ginger", "dry ginger"],
    "dry ginger": ["dry ginger", "ginger"],
    "dry chillies": ["dry chillies", "red chillies", "chilli"],
    "coconut": ["coconut"],
    "garlic": ["garlic"],
    "gram": ["gram", "bengal gram", "kabuli gram"],
    "blackgram": ["black gram", "urad", "blackgram"],
    "urad": ["urad", "black gram"],
    "moong(green gram)": ["green gram", "moong"],
    "masoor": ["masur", "lentil", "masoor"],
    "arhar/tur": ["arhar", "pigeon pea", "red gram"],
    "rapeseed &mustard": ["mustard", "rape & mustard"],
    "sesamum": ["sesamum", "til"],
    "sugarcane": ["sugarcane", "gur"]
}

# Helper to find Mandi prices
def get_mandi_prices(district, year, crop):
    crop_lower = crop.lower()
    commodities = crop_to_commodities.get(crop_lower, [crop_lower])
    
    # 1. Try matching District, Year, Commodity
    for comm in commodities:
        matched = mandi_group[
            (mandi_group["District"] == district) & 
            (mandi_group["Year"] == year) & 
            (mandi_group["Commodity"].str.contains(comm))
        ]
        if not matched.empty:
            return matched.iloc[0]["Min_Price"], matched.iloc[0]["Max_Price"], matched.iloc[0]["Modal_Price"]
            
    # 2. Try matching Year, Commodity (state-wide)
    for comm in commodities:
        matched = mandi_state_group[
            (mandi_state_group["Year"] == year) & 
            (mandi_state_group["Commodity"].str.contains(comm))
        ]
        if not matched.empty:
            return matched.iloc[0]["Min_Price"], matched.iloc[0]["Max_Price"], matched.iloc[0]["Modal_Price"]
            
    # 3. Try matching Commodity (overall years average)
    for comm in commodities:
        matched = mandi_global_group[
            (mandi_global_group["Commodity"].str.contains(comm))
        ]
        if not matched.empty:
            return matched.iloc[0]["Min_Price"], matched.iloc[0]["Max_Price"], matched.iloc[0]["Modal_Price"]
            
    # 4. Global fallback defaults (2000 INR average)
    return 1800.0, 2200.0, 2000.0


# 3. Load IMD Rainfall data for Assam & Meghalaya
print("Loading Sub_Division_IMD_2017.csv...")
df_imd = pd.read_csv("Sub_Division_IMD_2017.csv")
df_assam_imd = df_imd[df_imd["SUBDIVISION"].str.strip().str.upper() == "ASSAM & MEGHALAYA"].copy()

# Index by Year for fast lookup
df_assam_imd.set_index("YEAR", inplace=True)
print(f"Loaded {len(df_assam_imd)} rainfall rows for Assam & Meghalaya.")

# Season to IMD columns map
season_to_imd_col = {
    "Kharif": "JJAS",
    "Rabi": "OND",
    "Whole Year": "ANNUAL",
    "Autumn": "OND",
    "Summer": "MAM",
    "Winter": "JF"
}

# Calculate average rainfalls across all years in Assam & Meghalaya for fallback
avg_rainfalls = {
    "JJAS": df_assam_imd["JJAS"].mean(),
    "OND": df_assam_imd["OND"].mean(),
    "ANNUAL": df_assam_imd["ANNUAL"].mean(),
    "MAM": df_assam_imd["MAM"].mean(),
    "JF": df_assam_imd["JF"].mean()
}

# Helper to find Rainfall
def get_rainfall(year, season):
    col = season_to_imd_col.get(season, "ANNUAL")
    if year in df_assam_imd.index:
        val = df_assam_imd.loc[year, col]
        if not np.isnan(val):
            return val
    # Fallback to mean
    return avg_rainfalls.get(col, 1000.0)


# 4. Construct Aligned Rows for Assam
print("Aligning Assam rows...")
assam_rows = []
for idx, row in df_assam_prod.iterrows():
    year = int(row["Crop_Year"])
    season = row["Season"]
    crop = row["Crop"]
    district = row["District_Name"]
    area = row["Area"]
    production = row["Production"]
    
    # Get rainfall (raw) and scale it
    raw_rain = get_rainfall(year, season)
    scaled_rain = (raw_rain - 782.7453) / 925.3081
    
    # Get mandi prices (raw) and scale min/max
    min_p, max_p, modal_p = get_mandi_prices(district, year, crop)
    scaled_min = (min_p - 1563.7877) / 1029.2886
    scaled_max = (max_p - 1865.0167) / 1194.8210
    
    assam_rows.append({
        "State": "ASSAM",
        "District": district,
        "Year": year,
        "Season": season,
        "Crop": crop,
        "Area": area,
        "Production": production,
        "SUBDIVISION": "ASSAM & MEGHALAYA",
        "Rainfall": scaled_rain,
        "Modal_Price": modal_p,
        "Min_Price": scaled_min,
        "Max_Price": scaled_max
    })

df_assam_aligned = pd.DataFrame(assam_rows)
print(f"Created {len(df_assam_aligned)} aligned rows for Assam.")

# 5. Append to FINAL_CLEAN_AGRI_DATASET.csv
print("Reading original FINAL_CLEAN_AGRI_DATASET.csv...")
df_orig = pd.read_csv("FINAL_CLEAN_AGRI_DATASET.csv")
print(f"Original shape: {df_orig.shape}")

# Filter out any pre-existing Assam rows just in case, then append
df_orig_clean = df_orig[df_orig["State"].str.upper() != "ASSAM"]
df_final = pd.concat([df_orig_clean, df_assam_aligned], ignore_index=True)
print(f"New shape after appending Assam: {df_final.shape}")

# Save back
print("Saving merged dataset...")
df_final.to_csv("FINAL_CLEAN_AGRI_DATASET.csv", index=False)
print("--- Assam Data Alignment Completed Successfully! ---")
