import sqlite3
import os
import csv
import base64

illegalChars = [ 34, 60, 62, 124, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 58, 42, 63, 92, 47 ]
def replaceIllegalChars(s):
    for c in illegalChars:
        s = s.replace(chr(c), '_')
    return s

os.remove("itempanel.db")
db=sqlite3.connect("itempanel.db")
cur = db.cursor()
cur.execute("""
create table if not exists item_panel (
    id integer primary key,
    item_name string,
    item_id string,
    item_meta string,
    has_nbt string,
    dname string,
    icon string
);
""")
cur.execute(
"""
create table if not exists fluid_container (
    id integer primary key,
    fluid_name string,
    item string,
    meta string,
    container_display_name string,
    amount integer);
""")
cur.execute("create index idx_item_name on item_panel(item_name)")
cur.execute("create index idx_item_id on item_panel(item_id)")
cur.execute("create index idx_item_meta on item_panel(item_meta)")

with open("itempanel.csv") as csvf:
    reader = csv.DictReader(csvf)
    data = []
    i = 0
    for row in reader:
        d = {'id':i}
        dname = row['Display Name']
        d['dname'] = dname
        d['item_name'] = row['Item Name']
        d['item_id'] = row['Item ID']
        d['item_meta'] = row['Item meta']
        d['has_nbt'] = row['Has NBT']
        filename = replaceIllegalChars(dname) + '.png'
        try:
            with open('itempanel_icons/' + filename, 'rb') as f:
                d['icon'] = base64.b64encode(f.read())
        except:
            print(d)
            print(filename)
        i = i + 1
        data.append(d)
    cur.executemany("insert into item_panel values(:id, :item_name, :item_id, :item_meta, :has_nbt, :dname, :icon)", data)
    db.commit()


with open("fluidcontainer.csv") as csvf:
    reader = csv.DictReader(csvf)
    data = []
    i = 0
    f = {}
    for row in reader:
        d = {'id':i}
        c = row['Fluid']
        if c not in f:
            f[c] = [row['Filled Container Display Name'], row['Amount'], row['Filled Container'][2:],row['Filled Container Item']]
        elif 'bartworks' in f[c][3] and '胶囊' in f[c][0]:
            print(f[c][0])
            f[c] = [row['Filled Container Display Name'], row['Amount'], row['Filled Container'][2:],row['Filled Container Item']]
    for fluid in f.keys():
        data.append({'id':i, 'fluid_name':fluid, 'item':f[fluid][3], 'meta':f[fluid][2].split("@")[1], 'dname':f[fluid][0], 'amount':f[fluid][1]})
        i = i +1
    cur.executemany("insert into fluid_container values(:id, :fluid_name, :item, :meta, :dname, :amount)", data)
    db.commit()  
