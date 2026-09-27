class Table:

    def __init__(self):
        self.name = ''
        self.columns = []
        self.data = []

    def get_col(self):
        return [c[1] for c in self.columns]