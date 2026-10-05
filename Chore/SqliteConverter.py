from jedi.inference.helpers import values_from_qualified_names
from Enity.Db import Db
from Enity.Table import Table
import pandas as pd
import re

class SqliteConverter:

    def to_excel(inputFile: str, outputFile: str = "output/data.xlsx"):
        db = Db(inputFile)
        tables = db.get_tables()
        results = []
    
        for tname in tables:
            table = Table()
            table.name = tname
            table.columns = db.describe_table(tname)
            table.data = db.get_data_in_table(tname)
    
            results.append(table)          
        
        # for r in results:
        #     print_table(r)
    
        dfs = []
    
        for r in results:
            print("##########################")
            df = pd.DataFrame(r.data, columns=r.get_col())
            df.attrs['name'] = r.name
            print(df)
            dfs.append(df)
    
        with pd.ExcelWriter(outputFile, engine='openpyxl') as writer:
            for df in dfs:
                df.to_excel(writer, sheet_name=df.attrs['name'], index=False)

    def from_excel(inputFile: str, outputFile: str):
        db = Db(outputFile)
        all_sheets_dict = pd.read_excel(inputFile, sheet_name=None)

        for tablename, df in all_sheets_dict.items():
            cols = type_col(df)
            # print(tablename)
            db.create_table(tablename, cols)
            db.insert(tablename, cols, list(df.values))


    
def type_col(df):
    result = {}
    for item in df.columns:
        match = re.match(r"(\w+)\[(\w+)\]", item)
        if match:
            key = match.group(1)  
            value = match.group(2) 
            match value:
                case 'id':
                    value = 'INTEGER PRIMARY KEY AUTOINCREMENT'
                case 'str':
                    value = 'TEXT NOT NULL'
                case 'int':
                    value = 'INTEGER NOT NULL'
                case 'real':
                    value = 'REAL NOT NULL'
            result[key] = value
    return result