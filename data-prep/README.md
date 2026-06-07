# Data Prep — Generación de datasets sintéticos

Estos scripts generan las bases de datos SQLite que usa el demo "Analista de Datos con IA".
Córrelos **una sola vez** en local. Los archivos `.db` se crean en `../analyst-service/data/`.

## Requisitos

- Python 3.10 o superior
- PowerShell (Windows) o Bash (Mac/Linux)

## Instrucciones (Windows PowerShell)

```powershell
# 1. Navega a esta carpeta
cd data-prep

# 2. Crea el entorno virtual
python -m venv venv

# 3. Actívalo
venv\Scripts\Activate.ps1

# 4. Instala dependencias
pip install -r requirements.txt

# 5. Genera los tres datasets (en cualquier orden)
python generate_ventas_retail.py
python generate_metricas_saas.py
python generate_recursos_humanos.py
```

Si PowerShell bloquea la activación del venv, ejecuta primero:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Instrucciones (Mac / Linux)

```bash
cd data-prep
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python generate_ventas_retail.py
python generate_metricas_saas.py
python generate_recursos_humanos.py
```

## Archivos generados

| Archivo | Tamaño aprox. | Descripción |
|---|---|---|
| `../analyst-service/data/ventas_retail.db` | 3–5 MB | E-commerce con clientes, productos, órdenes |
| `../analyst-service/data/metricas_saas.db` | 8–12 MB | SaaS con usuarios, suscripciones, eventos |
| `../analyst-service/data/recursos_humanos.db` | 1–2 MB | RRHH con empleados, salarios, reviews |

## Verificación

Puedes inspeccionar los archivos con [DB Browser for SQLite](https://sqlitebrowser.org/)
o con el CLI de SQLite:

```bash
sqlite3 ../analyst-service/data/ventas_retail.db ".tables"
sqlite3 ../analyst-service/data/ventas_retail.db "SELECT COUNT(*) FROM orders;"
```

## Notas

- Los datos son 100% sintéticos. Cualquier parecido con personas o empresas reales es coincidencia.
- El script usa seeds fijos (`random.seed(42)`, `np.random.seed(42)`) para reproducibilidad.
- El dataset de RRHH incluye intencionalmente una brecha salarial de género sutil (~7%) para que el demo de análisis pueda descubrirla.
