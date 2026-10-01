from  Chore.SqliteConverter import SqliteConverter

def main():
    SqliteConverter.to_excel("db.sqlite", "output/data.xlsx")  

if __name__ == "__main__":
    main()
