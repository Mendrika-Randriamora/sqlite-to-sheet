from Db import Db
from Table import Table
import pandas as pd

def print_table(table: Table):
    print(f"table name: {table.name}")
    cols = [c[1] for c in table.columns]
    print(cols)
    data = [list(d) for d in table.data]
    print(data)
    print("-----------------------------------")

def main():
    db = Db("db.sqlite")
    tables = db.get_tables()
    results = []

    for tname in tables:
        table = Table()
        table.name = tname
        table.columns = db.describe_table(tname)
        table.data = db.get_data_in_table(tname)

        results.append(table)
        
    
    for r in results:
        print_table(r)

    dfs = []

    for r in results:
        print("##########################")
        df = pd.DataFrame(r.data, columns=r.get_col())
        df.attrs['name'] = r.name
        print(df)
        dfs.append(df)

    with pd.ExcelWriter('output/data.xlsx', engine='openpyxl') as writer:
        for df in dfs:
            df.to_excel(writer, sheet_name=df.attrs['name'], index=False)
    

if __name__ == "__main__":
    main()
