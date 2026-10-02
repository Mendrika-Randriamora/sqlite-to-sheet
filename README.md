# Convert your sqlite database into excel

### Introduction 
This is small project for one use case: Transform your database into excel for no dev person

### How to work
1 - take your sqlite to input file
2 - Read your database with `sqlite3`
3 - Create a dataframe for every table (`pandas` dataframe)
4 - Create single excel file (one table -> one sheet)

### Usage
import `SqliteConverter` from `Chore.SqliteConverter`

```python
SqliteConverter.to_excel(
    "db.sqlite", 
    "output/data.xlsx"
)
```

*UI interface is not avalaible*