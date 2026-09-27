import sqlite3 as sq

conn = sq.connect("db.sqlite")

cursor = conn.cursor()

# Query
# req = "SELECT name FROM sqlite_master WHERE type='table'";
# req = "pragma table_info('users')"
req = "select * from products"

cursor.execute(req)

data = cursor.fetchall()

#result = [x for t in data for x in t]
print(data)
#print(result)

conn.close()
