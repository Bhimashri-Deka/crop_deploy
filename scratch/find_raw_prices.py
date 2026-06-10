import pandas as pd
import glob
import os

# Let's inspect some files in mandi_data_2001to2014
mandi_files = glob.glob("mandi_data_2001to2014/*.csv")
print("Mandi files:", mandi_files)

# Let's see the columns of one mandi file
if mandi_files:
    sample_mandi = pd.read_csv(mandi_files[0], nrows=5)
    print("Mandi columns:", sample_mandi.columns.tolist())

# Let's write a finder
# We want to match:
# State = ANDHRA PRADESH, District = ANANTAPUR, Year = 2003, Crop = Arhar/Tur
# Let's search in mandi_data_2001to2014/2003.csv
csv_2003_path = "mandi_data_2001to2014/2003.csv"
if os.path.exists(csv_2003_path):
    print("Reading 2003.csv...")
    df_2003 = pd.read_csv(csv_2003_path)
    print("2003.csv unique states:", df_2003["State"].unique()[:5] if "State" in df_2003.columns else "No State col")
    
    # Let's find columns
    state_col = [c for c in df_2003.columns if "state" in c.lower()]
    district_col = [c for c in df_2003.columns if "district" in c.lower()]
    commodity_col = [c for c in df_2003.columns if "commodity" in c.lower() or "crop" in c.lower()]
    min_col = [c for c in df_2003.columns if "min" in c.lower()]
    max_col = [c for c in df_2003.columns if "max" in c.lower()]
    modal_col = [c for c in df_2003.columns if "modal" in c.lower()]
    
    print("Identified columns:", state_col, district_col, commodity_col, min_col, max_col, modal_col)
    
    # Filter
    if state_col and district_col and commodity_col:
        s_col, d_col, c_col = state_col[0], district_col[0], commodity_col[0]
        # Match ANANTAPUR and Arhar/Tur (or Pigeon Pea)
        # Note: Arhar/Tur is often called Arhar (Tur/Red Gram) or similar
        sub = df_2003[
            (df_2003[s_col].str.upper().str.contains("ANDHRA")) & 
            (df_2003[d_col].str.upper().str.contains("ANANTAPUR"))
        ]
        print(f"Found {len(sub)} rows for Andhra Pradesh / Anantapur in 2003.csv")
        if len(sub) > 0:
            print(sub[[s_col, d_col, c_col] + min_col + max_col + modal_col].head(10))
            
            # Let's compute average min, max, modal price for Arhar/Tur
            # Wait, in the main dataset row 2 has Modal_Price = 657.0570571
            # Let's see if we can find any crop that has this modal price or a similar average.
            print("Average prices by commodity:")
            for name, group in sub.groupby(c_col):
                avg_modal = group[modal_col[0]].mean()
                avg_min = group[min_col[0]].mean()
                avg_max = group[max_col[0]].mean()
                print(f"  {name}: Min={avg_min:.2f}, Max={avg_max:.2f}, Modal={avg_modal:.2f}")
