import sqlite3

from pandas.core.strings.object_array import re

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

    def create_table(self, tablename: str, cols: dict):
        cols = ",".join([f"{k} {v}" for k, v in cols.items()])
        req = f"CREATE TABLE IF NOT EXISTS {tablename} ({cols})"
        print(req)
        self.cursor.execute(req)

    def insert(self, tablename: str, cols: dict, data: list):
        cols = ",".join([f"{k}" for k in cols.keys()])
        vls = ""
        
        for d in data:
            vls = vls + f" {tuple(d)},"
        vls = vls[:-1]
        req = f"INSERT INTO {tablename}({cols}) VALUES {vls} "
        print(req)
        self.cursor.execute(req)
        self.conn.commit()
            
    