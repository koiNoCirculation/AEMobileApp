import sqlite3
import csv
import base64
con = sqlite3.connect('itempanel.db')
cur = con.cursor()
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
cur.execute("create index idx_item_name on item_panel(item_name);")
cur.execute("create index idx_item_id on item_panel(item_id);")
cur.execute("create index idx_item_dname on item_panel(dname);")
cur.execute("create index idx_item_meta on item_panel(item_meta);")
illegalchars = list(map(lambda x: chr(x), [34, 60, 62, 124, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
            18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 58, 42, 63, 92, 47]))
import os
with open('itempanel.csv','r') as csvf:
    reader = csv.DictReader(csvf)
    data = []
    i = 0
    for row in reader:
        item_name = row['Item Name']
        item_id = row['Item ID']
        item_meta = row['Item meta']
        has_nbt = row['Has NBT']
        dname = row['Display Name']
        fname = dname
        for ill in illegalchars:
            fname = fname.replace(ill, '_')
        path = f'itempanel_icons/{fname}.png'
        if not os.path.exists(path):
            path = f'itempanel_icons/_{fname}_.png'
        if os.path.exists(path):
            with open(path, 'rb') as icon:
                data.append({'id':i, 'item_name': item_name, 'item_id':item_id, 'item_meta':item_meta, 'has_nbt': has_nbt, 'dname': dname, 'icon': base64.b64encode(icon.read())})
        else:
            print(f'file not found:{fname}')
            data.append({'id':i, 'item_name': item_name, 'item_id':item_id, 'item_meta':item_meta, 'has_nbt': has_nbt, 'dname': dname, 'icon': None})
        i = i + 1
    cur.executemany("insert into item_panel values(:id, :item_name, :item_id, :item_meta, :has_nbt, :dname, :icon)", data)
print(data[0])
con.commit()
cur.close()
con.close()
            
