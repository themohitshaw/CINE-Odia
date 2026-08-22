# Importing pandas
import pandas as pd

# Excel file path 
xlsx_file_path = "database/DB_demo.xlsx"

# Dataframe
df = pd.read_excel(xlsx_file_path)

# Data loaded or not
print(df.head(3))

# Size of the datafrme
print(df.shape)

# Total columns in the data frame
print(df.columns)

# Viewing the datatype
print(df.dtypes)

# Is there any null value ?
print(df.isnull().sum())

# Is  there any duplicate value
print(df.duplicated().sum())