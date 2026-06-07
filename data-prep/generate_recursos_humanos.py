"""
generate_recursos_humanos.py
Genera recursos_humanos.db con datos sintéticos de RRHH.

Tablas:
  departments         (~10 filas)
  employees           (~1 000 filas)
  salaries            (~5 000 filas — historial de cambios)
  performance_reviews (~3 000 filas)

Nota intencional: el dataset incluye una brecha salarial de género sutil (~7%)
para que el demo pueda descubrirla mediante análisis de datos.
"""

import os
import random
import sqlite3
from datetime import date, datetime, timedelta

import numpy as np
from faker import Faker


def parse_date_flexible(value):
    """Parsea fechas tolerantemente desde SQLite o strings."""
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, str):
        for fmt in (
            "%Y-%m-%d",
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S.%f",
        ):
            try:
                return datetime.strptime(value, fmt).date()
            except ValueError:
                continue
        try:
            return date.fromisoformat(value[:10])
        except ValueError:
            raise ValueError(f"No se pudo parsear fecha: {value!r}")
    raise TypeError(f"Tipo no soportado para fecha: {type(value).__name__}")

# ── Reproducibilidad ────────────────────────────────────────────────────────
random.seed(42)
np.random.seed(42)
fake = Faker(["es_MX"])
Faker.seed(42)

# ── Destino ─────────────────────────────────────────────────────────────────
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "analyst-service", "data")
os.makedirs(OUTPUT_DIR, exist_ok=True)
DB_PATH = os.path.join(OUTPUT_DIR, "recursos_humanos.db")

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# ════════════════════════════════════════════════════════════════════════════
# DDL
# ════════════════════════════════════════════════════════════════════════════
cur.executescript("""
CREATE TABLE departments (
    department_id    INTEGER PRIMARY KEY,
    name             TEXT NOT NULL,
    head_count_target INTEGER NOT NULL
);

CREATE TABLE employees (
    employee_id      INTEGER PRIMARY KEY,
    name             TEXT NOT NULL,
    gender           TEXT NOT NULL,
    department_id    INTEGER NOT NULL REFERENCES departments(department_id),
    position         TEXT NOT NULL,
    level            TEXT NOT NULL,
    hire_date        DATE NOT NULL,
    birth_date       DATE NOT NULL,
    is_active        INTEGER NOT NULL,
    termination_date DATE
);

CREATE TABLE salaries (
    salary_id      INTEGER PRIMARY KEY,
    employee_id    INTEGER NOT NULL REFERENCES employees(employee_id),
    effective_date DATE NOT NULL,
    base_salary    REAL NOT NULL,
    bonus_pct      REAL NOT NULL
);

CREATE TABLE performance_reviews (
    review_id    INTEGER PRIMARY KEY,
    employee_id  INTEGER NOT NULL REFERENCES employees(employee_id),
    review_date  DATE NOT NULL,
    rating       INTEGER NOT NULL,
    manager_id   INTEGER REFERENCES employees(employee_id),
    would_rehire INTEGER NOT NULL
);
""")


# ════════════════════════════════════════════════════════════════════════════
# DEPARTMENTS (hardcoded)
# ════════════════════════════════════════════════════════════════════════════
DEPARTMENTS = [
    (1,  "Ingeniería",        120),
    (2,  "Producto",           40),
    (3,  "Diseño",             25),
    (4,  "Marketing",          50),
    (5,  "Ventas",             80),
    (6,  "Recursos Humanos",   20),
    (7,  "Finanzas",           25),
    (8,  "Legal",              15),
    (9,  "Operaciones",        60),
    (10, "Customer Success",   65),
]
cur.executemany("INSERT INTO departments VALUES (?,?,?)", DEPARTMENTS)
print(f"  departments: {len(DEPARTMENTS)} filas")

DEPT_IDS    = [d[0] for d in DEPARTMENTS]
DEPT_NAMES  = {d[0]: d[1] for d in DEPARTMENTS}
DEPT_WEIGHTS = [d[2] for d in DEPARTMENTS]


# ════════════════════════════════════════════════════════════════════════════
# EMPLOYEES (~1 000)
# Salary base ranges by level (MXN mensual bruto)
# ════════════════════════════════════════════════════════════════════════════
LEVELS = ["junior", "mid", "senior", "lead", "director"]
LEVEL_W = [0.25, 0.35, 0.25, 0.10, 0.05]

SALARY_RANGES = {
    "junior":   (25_000, 45_000),
    "mid":      (45_000, 80_000),
    "senior":   (80_000, 130_000),
    "lead":     (130_000, 190_000),
    "director": (190_000, 300_000),
}

POSITIONS_BY_DEPT = {
    1:  ["Software Engineer", "Backend Dev", "Frontend Dev", "DevOps", "QA Engineer"],
    2:  ["Product Manager", "Product Owner", "Product Analyst"],
    3:  ["UX Designer", "UI Designer", "Graphic Designer", "Design Lead"],
    4:  ["Marketing Manager", "Content Strategist", "Growth Hacker", "SEO Specialist"],
    5:  ["Account Executive", "Sales Rep", "BDR", "Sales Manager"],
    6:  ["HR Business Partner", "Recruiter", "Compensation Analyst"],
    7:  ["Financial Analyst", "Controller", "CFO", "Accountant"],
    8:  ["Legal Counsel", "Compliance Officer"],
    9:  ["Operations Analyst", "Supply Chain Coord", "Procurement Spec"],
    10: ["CS Manager", "Customer Success Rep", "Onboarding Specialist"],
}

# Género: M 48%, F 48%, NB 4%
GENDER_OPTS = ["M", "F", "NB"]
GENDER_W    = [0.48, 0.48, 0.04]

# Brecha salarial: hombres ~+3.5%, mujeres ~-3.5% (neto ~7% de brecha M-F)
GENDER_SALARY_MULT = {"M": 1.035, "F": 0.965, "NB": 1.00}

employees = []
for eid in range(1, 1001):
    gender = random.choices(GENDER_OPTS, weights=GENDER_W)[0]
    dept_id = random.choices(DEPT_IDS, weights=DEPT_WEIGHTS)[0]
    level   = random.choices(LEVELS, weights=LEVEL_W)[0]
    position = random.choice(POSITIONS_BY_DEPT[dept_id])

    hire_date  = fake.date_between(start_date=date(2018, 1, 1), end_date=date(2025, 12, 31))
    birth_year = random.randint(1975, 2000)
    birth_date = fake.date_between(
        start_date=date(birth_year, 1, 1), end_date=date(birth_year, 12, 31)
    )

    # ~15% terminated
    is_active = 0 if random.random() < 0.15 else 1
    if not is_active:
        tenure_days = random.randint(60, 1500)
        term_date = hire_date + timedelta(days=tenure_days)
        term_date = min(term_date, date(2026, 4, 30))
        termination_date = str(term_date)
    else:
        termination_date = None

    if gender == "F":
        name = fake.name_female()
    elif gender == "M":
        name = fake.name_male()
    else:
        name = fake.name()

    employees.append((eid, name, gender, dept_id, position, level,
                      str(hire_date), str(birth_date), is_active, termination_date))

cur.executemany("INSERT INTO employees VALUES (?,?,?,?,?,?,?,?,?,?)", employees)
print(f"  employees: {len(employees)} filas")


# ════════════════════════════════════════════════════════════════════════════
# SALARIES (~1–5 entries por empleado → ~3 500-5 000 filas)
# ════════════════════════════════════════════════════════════════════════════
salaries = []
salary_id = 1
emp_data = {e[0]: e for e in employees}  # eid → tuple

for eid, name, gender, dept_id, position, level, hire_str, *_ in employees:
    hire = parse_date_flexible(hire_str)
    base_range = SALARY_RANGES[level]
    base_salary = random.uniform(*base_range) * GENDER_SALARY_MULT[gender]
    n_changes = random.randint(1, 5)

    current_date = hire
    current_salary = base_salary

    for i in range(n_changes):
        bonus = round(random.uniform(0, 20), 1)
        salaries.append((salary_id, eid,
                         str(current_date),
                         round(current_salary, 2),
                         bonus))
        salary_id += 1

        # Siguiente aumento: 6–18 meses después, +3-12%
        months_ahead = random.randint(6, 18)
        current_date = current_date + timedelta(days=months_ahead * 30)
        if current_date > date(2026, 5, 1):
            break
        current_salary *= random.uniform(1.03, 1.12)

cur.executemany("INSERT INTO salaries VALUES (?,?,?,?,?)", salaries)
print(f"  salaries: {len(salaries)} filas")


# ════════════════════════════════════════════════════════════════════════════
# PERFORMANCE_REVIEWS (~3 000) — semestrales para activos
# ════════════════════════════════════════════════════════════════════════════
active_eids   = [e[0] for e in employees if e[8] == 1]
manager_eids  = [e[0] for e in employees if e[5] in ("lead", "director")]
if not manager_eids:
    manager_eids = active_eids[:20]

reviews = []
review_id = 1
REVIEW_DATES = [date(y, m, 1) for y in range(2022, 2026) for m in [6, 12]]

for eid in active_eids:
    hire_str = emp_data[eid][6]
    hire = parse_date_flexible(hire_str)

    for review_date in REVIEW_DATES:
        if review_date < hire:
            continue
        if random.random() < 0.15:  # 15% sin review ese semestre
            continue
        rating    = random.choices([1, 2, 3, 4, 5], weights=[3, 8, 30, 40, 19])[0]
        manager   = random.choice(manager_eids)
        rehire    = 1 if rating >= 3 else 0
        reviews.append((review_id, eid, str(review_date), rating, manager, rehire))
        review_id += 1

cur.executemany("INSERT INTO performance_reviews VALUES (?,?,?,?,?,?)", reviews)
print(f"  performance_reviews: {len(reviews)} filas")


# ════════════════════════════════════════════════════════════════════════════
# Índices
# ════════════════════════════════════════════════════════════════════════════
cur.executescript("""
    CREATE INDEX idx_emp_dept       ON employees(department_id);
    CREATE INDEX idx_sal_emp_date   ON salaries(employee_id, effective_date);
    CREATE INDEX idx_rev_emp        ON performance_reviews(employee_id);
""")

conn.commit()
conn.close()
print(f"\n✓ recursos_humanos.db generado en: {os.path.abspath(DB_PATH)}")
