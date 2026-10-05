from  Chore.SqliteConverter import SqliteConverter

def main():
    # SqliteConverter.to_excel("db.sqlite", "output/data.xlsx")
    SqliteConverter.from_excel("output/example.xlsx", "output/db.sqlite")  

if __name__ == "__main__":
    main()
