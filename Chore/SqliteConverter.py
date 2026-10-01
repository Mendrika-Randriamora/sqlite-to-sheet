from Enity.Db import Db
from Enity.Table import Table
import pandas as pd

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