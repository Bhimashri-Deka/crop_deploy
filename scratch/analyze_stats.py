import pandas as pd

df = pd.read_csv("FINAL_CLEAN_AGRI_DATASET.csv")

for col in ["Rainfall", "Min_Price", "Max_Price", "Modal_Price"]:
    if col in df.columns:
        print(f"Col: {col}")
        print(f"  Mean: {df[col].mean()}")
        print(f"  Std:  {df[col].std()}")
        print(f"  Min:  {df[col].min()}")
        print(f"  Max:  {df[col].max()}")
