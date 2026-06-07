"""
generate_ventas_retail.py
Genera ventas_retail.db con datos sintéticos de una tienda en línea.

Tablas:
  customers    (~2 000 filas)
  categories   (~10 filas)
  products     (~500 filas)
  orders       (~10 000 filas, Jan 2024 – Apr 2026)
  order_items  (~25 000 filas)
"""

import os
import random
import sqlite3
from datetime import date, datetime, timedelta

import numpy as np
from faker import Faker

# ── Reproducibilidad ────────────────────────────────────────────────────────
random.seed(42)
np.random.seed(42)
fake = Faker(["es_MX", "en_US"])
Faker.seed(42)

# ── Destino del archivo ─────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "analyst-service", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)
DB_PATH = os.path.join(OUTPUT_DIR, "ventas_retail.db")

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# ════════════════════════════════════════════════════════════════════════════
# DDL
# ════════════════════════════════════════════════════════════════════════════
cur.executescript("""
CREATE TABLE categories (
    category_id   INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    parent_category TEXT
);

CREATE TABLE customers (
    customer_id      INTEGER PRIMARY KEY,
    name             TEXT NOT NULL,
    email            TEXT NOT NULL UNIQUE,
    country          TEXT NOT NULL,
    signup_date      DATE NOT NULL,
    customer_segment TEXT NOT NULL,
    lifetime_value   REAL DEFAULT 0
);

CREATE TABLE products (
    product_id   INTEGER PRIMARY KEY,
    name         TEXT NOT NULL,
    category_id  INTEGER NOT NULL REFERENCES categories(category_id),
    price        REAL NOT NULL,
    cost         REAL NOT NULL,
    stock_level  INTEGER NOT NULL,
    launch_date  DATE NOT NULL
);

CREATE TABLE orders (
    order_id         INTEGER PRIMARY KEY,
    customer_id      INTEGER NOT NULL REFERENCES customers(customer_id),
    order_date       DATETIME NOT NULL,
    status           TEXT NOT NULL,
    total_amount     REAL DEFAULT 0,
    shipping_country TEXT NOT NULL
);

CREATE TABLE order_items (
    item_id      INTEGER PRIMARY KEY,
    order_id     INTEGER NOT NULL REFERENCES orders(order_id),
    product_id   INTEGER NOT NULL REFERENCES products(product_id),
    quantity     INTEGER NOT NULL,
    unit_price   REAL NOT NULL,
    discount_pct REAL NOT NULL DEFAULT 0
);
""")


# ════════════════════════════════════════════════════════════════════════════
# CATEGORIES (hardcoded)
# ════════════════════════════════════════════════════════════════════════════
CATEGORIES = [
    (1, "Electrónica",  None),
    (2, "Hogar",        None),
    (3, "Ropa",         None),
    (4, "Deportes",     None),
    (5, "Belleza",      None),
    (6, "Juguetes",     None),
    (7, "Libros",       None),
    (8, "Comida",       None),
    (9, "Tecnología",   "Electrónica"),
    (10, "Oficina",     None),
]
cur.executemany("INSERT INTO categories VALUES (?,?,?)", CATEGORIES)
print(f"  categories: {len(CATEGORIES)} filas")


# ════════════════════════════════════════════════════════════════════════════
# PRODUCTS (~500)
# ════════════════════════════════════════════════════════════════════════════
CAT_WORDS = {
    1:  (["Audífonos", "Televisor", "Cámara", "Bocina", "Drone", "Robot"],           [100, 800]),
    2:  (["Lámpara", "Silla", "Mesa", "Almohada", "Cobija", "Tapete"],               [20, 400]),
    3:  (["Playera", "Pantalón", "Vestido", "Chamarra", "Tenis", "Calcetines"],      [10, 150]),
    4:  (["Pesas", "Bicicleta", "Cuerda", "Tapete Yoga", "Guantes Box", "Pelota"],  [15, 500]),
    5:  (["Crema", "Sérum", "Shampoo", "Perfume", "Delineador", "Bronzer"],          [8, 120]),
    6:  (["Muñeca", "Lego", "Rompecabezas", "Carrito", "Peluche", "Juego Mesa"],    [10, 250]),
    7:  (["Novela", "Libro Cocina", "Manual Python", "Atlas", "Comic", "Agenda"],   [5, 60]),
    8:  (["Café Gourmet", "Proteína", "Snack Saludable", "Té", "Aceite Oliva", "Granola"], [5, 80]),
    9:  (["Laptop", "Monitor", "Teclado", "Mouse", "Hub USB", "SSD"],               [50, 2000]),
    10: (["Impresora", "Escritorio", "Silla Oficina", "Archivero", "Pluma Set", "Folder"], [15, 600]),
}
ADJECTIVES = ["Pro", "Elite", "Plus", "Basic", "Ultra", "Slim", "Mini", "Max", "Eco", "Smart"]

products = []
for pid in range(1, 501):
    cat_id = random.randint(1, 10)
    nouns, price_range = CAT_WORDS[cat_id]
    noun = random.choice(nouns)
    adj  = random.choice(ADJECTIVES)
    name = f"{noun} {adj}"
    price = round(random.uniform(*price_range), 2)
    cost  = round(price * random.uniform(0.45, 0.65), 2)
    stock = random.randint(0, 500)
    launch = fake.date_between(start_date=date(2023, 1, 1), end_date=date(2025, 1, 1))
    products.append((pid, name, cat_id, price, cost, stock, str(launch)))

cur.executemany("INSERT INTO products VALUES (?,?,?,?,?,?,?)", products)
print(f"  products: {len(products)} filas")


# ════════════════════════════════════════════════════════════════════════════
# CUSTOMERS (~2 000)
# ════════════════════════════════════════════════════════════════════════════
COUNTRIES = (
    ["Mexico"] * 50 + ["USA"] * 25 +
    ["Colombia"] * 8 + ["España"] * 7 + ["Argentina"] * 5 +
    ["Chile"] * 2 + ["Peru"] * 2 + ["Venezuela"] * 1
)
SEGMENTS = random.choices(["premium", "standard", "budget"], weights=[20, 55, 25], k=2000)

customers = []
emails_seen = set()
for i in range(1, 2001):
    name  = fake.name()
    email = fake.unique.email()
    emails_seen.add(email)
    country = random.choice(COUNTRIES)
    signup  = fake.date_between(start_date=date(2023, 1, 1), end_date=date(2025, 4, 1))
    segment = SEGMENTS[i - 1]
    customers.append((i, name, email, country, str(signup), segment, 0.0))

cur.executemany("INSERT INTO customers VALUES (?,?,?,?,?,?,?)", customers)
print(f"  customers: {len(customers)} filas")


# ════════════════════════════════════════════════════════════════════════════
# ORDERS (~10 000) con distribución temporal
# ════════════════════════════════════════════════════════════════════════════
# Multiplicadores mensuales: Q4 alto, marzo (regreso clases) también
MONTH_WEIGHTS = {
    1: 0.80, 2: 0.70, 3: 1.20, 4: 0.80, 5: 0.70, 6: 0.80,
    7: 0.75, 8: 0.90, 9: 0.85, 10: 0.95, 11: 2.50, 12: 2.20,
}

START_DATE = datetime(2024, 1, 1)
END_DATE   = datetime(2026, 4, 30)
TOTAL_DAYS = (END_DATE - START_DATE).days

# Genera un pool de fechas con distribución no-uniforme
def random_order_date():
    while True:
        d = START_DATE + timedelta(days=random.randint(0, TOTAL_DAYS))
        w = MONTH_WEIGHTS.get(d.month, 1.0)
        if random.random() < w / 2.5:  # normaliza al pico máximo
            hour   = random.randint(7, 23)
            minute = random.randint(0, 59)
            return d.replace(hour=hour, minute=minute, second=0)

STATUS_WEIGHTS = ["completed"] * 85 + ["cancelled"] * 8 + ["returned"] * 7

orders = []
for oid in range(1, 10001):
    cust_id  = random.randint(1, 2000)
    odate    = random_order_date()
    status   = random.choice(STATUS_WEIGHTS)
    country  = random.choice(COUNTRIES)
    orders.append((oid, cust_id, odate.strftime("%Y-%m-%d %H:%M:%S"), status, 0.0, country))

cur.executemany("INSERT INTO orders VALUES (?,?,?,?,?,?)", orders)
print(f"  orders: {len(orders)} filas")


# ════════════════════════════════════════════════════════════════════════════
# ORDER_ITEMS (~25 000)
# ════════════════════════════════════════════════════════════════════════════
DISCOUNT_OPTIONS = [0] * 70 + [5] * 10 + [10] * 8 + [15] * 6 + [20] * 4 + [30] * 2

items_per_order = np.random.choice(
    [1, 2, 3, 4, 5], size=10000, p=[0.45, 0.30, 0.15, 0.07, 0.03]
)

order_items = []
item_id = 1
for oid, n_items in enumerate(items_per_order, start=1):
    chosen_products = random.sample(range(1, 501), min(int(n_items), 500))
    for pid in chosen_products:
        product_price = products[pid - 1][3]  # price column
        qty     = random.randint(1, 4)
        disc    = random.choice(DISCOUNT_OPTIONS)
        order_items.append((item_id, oid, pid, qty, product_price, float(disc)))
        item_id += 1

cur.executemany("INSERT INTO order_items VALUES (?,?,?,?,?,?)", order_items)
print(f"  order_items: {len(order_items)} filas")


# ════════════════════════════════════════════════════════════════════════════
# Actualiza totales de órdenes
# ════════════════════════════════════════════════════════════════════════════
cur.execute("""
    UPDATE orders SET total_amount = (
        SELECT ROUND(SUM(quantity * unit_price * (1 - discount_pct / 100.0)), 2)
        FROM order_items
        WHERE order_items.order_id = orders.order_id
    )
""")

# ════════════════════════════════════════════════════════════════════════════
# Calcula lifetime_value por customer (solo completed + returned)
# ════════════════════════════════════════════════════════════════════════════
cur.execute("""
    UPDATE customers SET lifetime_value = (
        SELECT COALESCE(ROUND(SUM(o.total_amount), 2), 0)
        FROM orders o
        WHERE o.customer_id = customers.customer_id
          AND o.status IN ('completed', 'returned')
    )
""")


# ════════════════════════════════════════════════════════════════════════════
# Índices
# ════════════════════════════════════════════════════════════════════════════
cur.executescript("""
    CREATE INDEX idx_orders_customer ON orders(customer_id);
    CREATE INDEX idx_orders_date     ON orders(order_date);
    CREATE INDEX idx_items_order     ON order_items(order_id);
    CREATE INDEX idx_items_product   ON order_items(product_id);
""")

conn.commit()
conn.close()
print(f"\n✓ ventas_retail.db generado en: {os.path.abspath(DB_PATH)}")
