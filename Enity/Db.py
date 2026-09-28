import sqlite3

class Db:
    def __init__(self, filename):
        self.conn = sqlite3.connect(filename)
        self.cursor = self.conn.cursor()

    def get_tables(self):
        req = "SELECT name FROM sqlite_master WHERE type='table'"
        self.cursor.execute(req)
        data = self.cursor.fetchall()
        res = [x for t in data for x in t]

        return res

    def describe_table(self, tablename):
        req = f"pragma table_info('{tablename}')"
        self.cursor.execute(req)

        return self.cursor.fetchall()


    def get_data_in_table(self, tablename):
        req = f"SELECT * from {tablename}"
        self.cursor.execute(req)

        return self.cursor.fetchall()

    