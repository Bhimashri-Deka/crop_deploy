import pandas as pd
import numpy as np

# Load 2003 mandi data
df_2003 = pd.read_csv("mandi_data_2001to2014/2003.csv")
sub_2003 = df_2003[
    (df_2003["State"].str.upper().str.contains("ANDHRA")) &
    (df_2003["District"].str.upper().str.contains("ANANTAPUR"))
]

print("2003 Anantapur Mandi Averages:")
print("  Average Min_Price:", sub_2003["Min_Price"].mean())
print("  Average Max_Price:", sub_2003["Max_Price"].mean())
print("  Average Modal_Price:", sub_2003["Modal_Price"].mean())

# Load 2005 mandi data
df_2005 = pd.read_csv("mandi_data_2001to2014/2005.csv")
sub_2005 = df_2005[
    (df_2005["State"].str.upper().str.contains("ANDHRA")) &
    (df_2005["District"].str.upper().str.contains("ANANTAPUR"))
]

print("\n2005 Anantapur Mandi Averages:")
print("  Average Min_Price:", sub_2005["Min_Price"].mean())
print("  Average Max_Price:", sub_2005["Max_Price"].mean())
print("  Average Modal_Price:", sub_2005["Modal_Price"].mean())
