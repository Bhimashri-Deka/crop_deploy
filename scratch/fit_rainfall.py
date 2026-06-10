import pandas as pd
import numpy as np

df_agri = pd.read_csv("FINAL_CLEAN_AGRI_DATASET.csv")
df_imd = pd.read_csv("Sub_Division_IMD_2017.csv")

df_agri["sub_clean"] = df_agri["SUBDIVISION"].str.strip().str.upper()
df_imd["sub_clean"] = df_imd["SUBDIVISION"].str.strip().str.upper()

# Let's inspect the different seasons
seasons = df_agri["Season"].str.strip().unique()
print(f"Seasons: {seasons}")

merged = pd.merge(df_agri, df_imd, left_on=["sub_clean", "Year"], right_on=["sub_clean", "YEAR"])

for col in ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "ANNUAL", "JF", "MAM", "JJAS", "OND"]:
    merged[col] = pd.to_numeric(merged[col], errors='coerce')

for season in seasons:
    sub = merged[merged["Season"].str.strip() == season]
    if len(sub) == 0:
        continue
    print(f"\n--- Season: {season} ---")
    
    # Check correlation with IMD seasonal columns
    corrs = {}
    for c in ["JF", "MAM", "JJAS", "OND", "ANNUAL"]:
        corrs[c] = sub["Rainfall"].corr(sub[c])
    best_col = max(corrs, key=lambda k: abs(corrs[k]) if not np.isnan(corrs[k]) else 0)
    print(f"  Correlations: {corrs}")
    print(f"  Best column: {best_col} (correlation: {corrs[best_col]:.6f})")
    
    # Let's print unique mappings for a few rows to see if it's exact
    sample_rows = sub.drop_duplicates(subset=["Year", "sub_clean"]).head(5)
    for idx, row in sample_rows.iterrows():
        print(f"    Year {row['Year']}, {row['SUBDIVISION_x']}: Scaled Rainfall = {row['Rainfall']:.6f}, {best_col} = {row[best_col]}")
        
    # Let's see if we can find standard scaling parameters (mean and std) of the best column
    # computed on the IMD dataset for that season
    # Let's fit: Scaled = (Raw - Mean) / Std  ==> Raw = Scaled * Std + Mean
    # So we do linear regression: Raw = a * Scaled + b
    # where a is Std and b is Mean
    x = sub["Rainfall"].values
    y = sub[best_col].values
    mask = ~np.isnan(x) & ~np.isnan(y)
    x = x[mask]
    y = y[mask]
    if len(x) > 5:
        slope, intercept = np.polyfit(x, y, 1)
        print(f"  Linear fit: {best_col} = {slope:.4f} * Scaled + {intercept:.4f}")
        # Let's calculate R^2
        y_pred = slope * x + intercept
        r2 = 1 - np.sum((y - y_pred)**2) / np.sum((y - np.mean(y))**2)
        print(f"  R^2 of fit: {r2:.6f}")
