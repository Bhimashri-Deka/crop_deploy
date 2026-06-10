import pandas as pd
import numpy as np

# Load datasets
df_agri = pd.read_csv("FINAL_CLEAN_AGRI_DATASET.csv")
df_imd = pd.read_csv("Sub_Division_IMD_2017.csv")

print("Agri subdivisions:", df_agri["SUBDIVISION"].unique()[:5])
print("IMD subdivisions:", df_imd["SUBDIVISION"].unique()[:5])

# Find a common subdivision and year to compare
common_sub = "COASTAL ANDHRA PRADESH"
# Let's find what it is called in IMD
matched_imd_subs = [s for s in df_imd["SUBDIVISION"].unique() if "ANDHRA" in s.upper()]
print(f"Matched IMD subdivisions for ANDHRA: {matched_imd_subs}")

# Let's merge on Subdivision and Year and see if we can find a linear relationship
# First normalize spelling
df_agri["sub_clean"] = df_agri["SUBDIVISION"].str.strip().str.upper()
df_imd["sub_clean"] = df_imd["SUBDIVISION"].str.strip().str.upper()

merged = pd.merge(df_agri, df_imd, left_on=["sub_clean", "Year"], right_on=["sub_clean", "YEAR"])
print(f"Merged shape: {merged.shape}")

if len(merged) > 0:
    sample = merged.iloc[0]
    print("Sample row:")
    print(f"  Agri Subdivision: {sample['SUBDIVISION_x']}")
    print(f"  IMD Subdivision: {sample['SUBDIVISION_y']}")
    print(f"  Year: {sample['Year']}")
    print(f"  Season: {sample['Season']}")
    print(f"  Agri Scaled Rainfall: {sample['Rainfall']}")
    print(f"  IMD Annual: {sample['ANNUAL']}")
    print(f"  IMD JJAS: {sample['JJAS']}")
    print(f"  IMD Jan-Dec: {sample['JAN']}, {sample['FEB']}, {sample['MAR']}, {sample['APR']}, {sample['MAY']}, {sample['JUN']}, {sample['JUL']}, {sample['AUG']}, {sample['SEP']}, {sample['OCT']}, {sample['NOV']}, {sample['DEC']}")

    # Let's check correlation of Agri Scaled Rainfall with IMD columns
    imd_cols = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANNUAL", "JF", "MAM", "JJAS", "OND"]
    for c in imd_cols:
        merged[c] = pd.to_numeric(merged[c], errors='coerce')
    
    corrs = {c: merged["Rainfall"].corr(merged[c]) for c in imd_cols}
    print("Correlations with IMD columns:")
    for c, r in sorted(corrs.items(), key=lambda x: abs(x[1]) if not np.isnan(x[1]) else 0, reverse=True):
        print(f"  {c}: {r:.4f}")
