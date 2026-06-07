import type { DatasetSchema } from "./types";

export const DATASETS: DatasetSchema[] = [
  // ══════════════════════════════════════════════════════════════════════
  // 1. Ventas Retail
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "ventas-retail",
    name: "Ventas Retail",
    description:
      "E-commerce con clientes, catálogo de productos, órdenes y líneas de venta. Incluye distribución temporal realista con picos en Q4 y estacionalidad de marzo.",
    icon: "ShoppingCart",
    accentColor: "#f59e0b",
    dbFile: "ventas_retail.db",
    badges: ["E-commerce", "2 años de datos", "5 tablas", "~37 500 filas"],
    suggestedQuestions: [
      "¿Cuáles son los productos más vendidos en Q4 2025?",
      "Muéstrame la evolución de ingresos mensual con gráfica",
      "Análisis RFM de mis clientes top",
      "¿Qué categoría tiene mejor margen?",
      "Tasa de retención de clientes nuevos vs recurrentes",
    ],
    tables: [
      {
        name: "customers",
        description: "Clientes registrados en la plataforma.",
        rowCount: 2000,
        columns: [
          { name: "customer_id",      type: "INTEGER", description: "Identificador único del cliente" },
          { name: "name",             type: "TEXT",    description: "Nombre completo" },
          { name: "email",            type: "TEXT",    description: "Correo electrónico único" },
          { name: "country",          type: "TEXT",    description: "País del cliente", example: "Mexico" },
          { name: "signup_date",      type: "DATE",    description: "Fecha de registro en la plataforma", example: "2023-06-15" },
          { name: "customer_segment", type: "TEXT",    description: "Segmento: premium, standard o budget", example: "standard" },
          { name: "lifetime_value",   type: "REAL",    description: "Suma total de compras completadas/devueltas en MXN", example: "4320.50" },
        ],
      },
      {
        name: "categories",
        description: "Categorías del catálogo de productos.",
        rowCount: 10,
        columns: [
          { name: "category_id",      type: "INTEGER", description: "Identificador único" },
          { name: "name",             type: "TEXT",    description: "Nombre de la categoría", example: "Electrónica" },
          { name: "parent_category",  type: "TEXT",    description: "Categoría padre (NULL si es raíz)", example: "Electrónica" },
        ],
      },
      {
        name: "products",
        description: "Catálogo de productos disponibles.",
        rowCount: 500,
        columns: [
          { name: "product_id",   type: "INTEGER", description: "Identificador único" },
          { name: "name",         type: "TEXT",    description: "Nombre del producto", example: "Audífonos Pro" },
          { name: "category_id",  type: "INTEGER", description: "FK a categories" },
          { name: "price",        type: "REAL",    description: "Precio de venta en MXN", example: "349.99" },
          { name: "cost",         type: "REAL",    description: "Costo de adquisición (aprox. 45-65% del precio)", example: "189.00" },
          { name: "stock_level",  type: "INTEGER", description: "Unidades en inventario" },
          { name: "launch_date",  type: "DATE",    description: "Fecha de lanzamiento del producto" },
        ],
      },
      {
        name: "orders",
        description: "Órdenes de compra. Distribuidas entre enero 2024 y abril 2026 con picos en Q4 y marzo.",
        rowCount: 10000,
        columns: [
          { name: "order_id",         type: "INTEGER",  description: "Identificador único" },
          { name: "customer_id",      type: "INTEGER",  description: "FK a customers" },
          { name: "order_date",       type: "DATETIME", description: "Fecha y hora de la orden", example: "2024-11-29 14:32:00" },
          { name: "status",           type: "TEXT",     description: "Estado: completed (85%), cancelled (8%), returned (7%)", example: "completed" },
          { name: "total_amount",     type: "REAL",     description: "Suma de líneas de venta con descuentos aplicados", example: "1250.00" },
          { name: "shipping_country", type: "TEXT",     description: "País de envío", example: "Mexico" },
        ],
      },
      {
        name: "order_items",
        description: "Líneas de venta — cada ítem dentro de una orden.",
        rowCount: 25000,
        columns: [
          { name: "item_id",      type: "INTEGER", description: "Identificador único" },
          { name: "order_id",     type: "INTEGER", description: "FK a orders" },
          { name: "product_id",   type: "INTEGER", description: "FK a products" },
          { name: "quantity",     type: "INTEGER", description: "Unidades compradas", example: "2" },
          { name: "unit_price",   type: "REAL",    description: "Precio unitario al momento de la compra", example: "349.99" },
          { name: "discount_pct", type: "REAL",    description: "Porcentaje de descuento aplicado (0-30)", example: "10.0" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 2. Métricas SaaS
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "metricas-saas",
    name: "Métricas SaaS",
    description:
      "Datos de una empresa SaaS B2B: usuarios, suscripciones, eventos de uso y evolución del MRR. Ideal para análisis de churn, retención y crecimiento.",
    icon: "LineChart",
    accentColor: "#3b82f6",
    dbFile: "metricas_saas.db",
    badges: ["SaaS / B2B", "24 meses MRR", "4 tablas", "~110 000 filas"],
    suggestedQuestions: [
      "Calcula el MRR actual y compara vs hace 6 meses",
      "Funnel de activación: free → starter → pro",
      "Cohort analysis de retención por mes de signup",
      "¿Qué canal de adquisición tiene mejor LTV?",
      "Predice churn basado en patrones de uso",
    ],
    tables: [
      {
        name: "users",
        description: "Usuarios registrados en la plataforma SaaS.",
        rowCount: 5000,
        columns: [
          { name: "user_id",             type: "INTEGER", description: "Identificador único" },
          { name: "email",               type: "TEXT",    description: "Email único del usuario" },
          { name: "signup_date",         type: "DATE",    description: "Fecha de registro", example: "2023-08-10" },
          { name: "country",             type: "TEXT",    description: "País del usuario", example: "Mexico" },
          { name: "acquisition_channel", type: "TEXT",    description: "Canal de adquisición", example: "organic" },
          { name: "industry",            type: "TEXT",    description: "Industria del usuario/empresa", example: "SaaS" },
        ],
      },
      {
        name: "subscriptions",
        description: "Suscripción activa o histórica de cada usuario. Una por usuario.",
        rowCount: 5000,
        columns: [
          { name: "subscription_id", type: "INTEGER", description: "Identificador único" },
          { name: "user_id",         type: "INTEGER", description: "FK a users" },
          { name: "plan",            type: "TEXT",    description: "Plan: free (40%), starter (35%), pro (20%), enterprise (5%)", example: "pro" },
          { name: "mrr",             type: "REAL",    description: "MRR del plan en USD: free=0, starter=29, pro=99, enterprise=499", example: "99.0" },
          { name: "started_at",      type: "DATE",    description: "Fecha de inicio de la suscripción" },
          { name: "cancelled_at",    type: "DATE",    description: "Fecha de cancelación (NULL si activa)" },
          { name: "status",          type: "TEXT",    description: "Estado: active o cancelled", example: "active" },
        ],
      },
      {
        name: "events",
        description: "Eventos de uso generados por los usuarios. Usuarios de planes superiores generan más eventos.",
        rowCount: 100000,
        columns: [
          { name: "event_id",   type: "INTEGER",  description: "Identificador único" },
          { name: "user_id",    type: "INTEGER",  description: "FK a users" },
          { name: "event_type", type: "TEXT",     description: "Tipo: login, feature_used, export, api_call, invite_sent", example: "feature_used" },
          { name: "created_at", type: "DATETIME", description: "Timestamp del evento", example: "2024-03-15 09:45:00" },
          { name: "metadata",   type: "TEXT",     description: "JSON con detalles según tipo de evento", example: '{"feature": "dashboard"}' },
        ],
      },
      {
        name: "mrr_history",
        description: "Snapshot mensual del MRR durante los últimos 24 meses.",
        rowCount: 24,
        columns: [
          { name: "month",         type: "DATE", description: "Primer día del mes del snapshot", example: "2024-06-01" },
          { name: "total_mrr",     type: "REAL", description: "MRR total al final del mes en USD" },
          { name: "new_mrr",       type: "REAL", description: "MRR aportado por nuevas suscripciones" },
          { name: "churned_mrr",   type: "REAL", description: "MRR perdido por cancelaciones" },
          { name: "expansion_mrr", type: "REAL", description: "MRR adicional por upgrades de plan" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 3. Recursos Humanos
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "recursos-humanos",
    name: "Recursos Humanos",
    description:
      "Dataset de RRHH con empleados, historial salarial, reviews de desempeño y attrition. Incluye una brecha salarial de género sutil (~7%) para análisis.",
    icon: "Users",
    accentColor: "#22c55e",
    dbFile: "recursos_humanos.db",
    badges: ["RRHH / People Analytics", "2018–2026", "4 tablas", "~9 000 filas"],
    suggestedQuestions: [
      "¿Hay brecha salarial por género en la empresa?",
      "Análisis de attrition: qué departamentos pierden más gente",
      "Distribución de salarios por nivel y departamento (gráfica)",
      "Performance vs tenure: ¿correlacionan?",
      "Top 10 managers con mejores reviews de equipo",
    ],
    tables: [
      {
        name: "departments",
        description: "Departamentos de la empresa con headcount objetivo.",
        rowCount: 10,
        columns: [
          { name: "department_id",      type: "INTEGER", description: "Identificador único" },
          { name: "name",               type: "TEXT",    description: "Nombre del departamento", example: "Ingeniería" },
          { name: "head_count_target",  type: "INTEGER", description: "Número objetivo de empleados en el departamento", example: "120" },
        ],
      },
      {
        name: "employees",
        description: "Empleados activos e inactivos. ~15% con termination_date (dados de baja).",
        rowCount: 1000,
        columns: [
          { name: "employee_id",      type: "INTEGER", description: "Identificador único" },
          { name: "name",             type: "TEXT",    description: "Nombre completo" },
          { name: "gender",           type: "TEXT",    description: "M (48%), F (48%), NB (4%)", example: "F" },
          { name: "department_id",    type: "INTEGER", description: "FK a departments" },
          { name: "position",         type: "TEXT",    description: "Puesto dentro del departamento", example: "Software Engineer" },
          { name: "level",            type: "TEXT",    description: "Nivel: junior, mid, senior, lead, director", example: "senior" },
          { name: "hire_date",        type: "DATE",    description: "Fecha de ingreso a la empresa", example: "2021-03-01" },
          { name: "birth_date",       type: "DATE",    description: "Fecha de nacimiento" },
          { name: "is_active",        type: "INTEGER", description: "1 = activo, 0 = dado de baja" },
          { name: "termination_date", type: "DATE",    description: "Fecha de baja (NULL si activo)" },
        ],
      },
      {
        name: "salaries",
        description: "Historial de cambios salariales. Cada empleado tiene entre 1 y 5 registros (aumentos a lo largo del tiempo).",
        rowCount: 5000,
        columns: [
          { name: "salary_id",      type: "INTEGER", description: "Identificador único" },
          { name: "employee_id",    type: "INTEGER", description: "FK a employees" },
          { name: "effective_date", type: "DATE",    description: "Fecha desde la que aplica el salario", example: "2022-01-01" },
          { name: "base_salary",    type: "REAL",    description: "Salario base mensual en MXN", example: "95000.00" },
          { name: "bonus_pct",      type: "REAL",    description: "Porcentaje de bono sobre salario base", example: "12.0" },
        ],
      },
      {
        name: "performance_reviews",
        description: "Evaluaciones de desempeño semestrales para empleados activos.",
        rowCount: 3000,
        columns: [
          { name: "review_id",    type: "INTEGER", description: "Identificador único" },
          { name: "employee_id",  type: "INTEGER", description: "FK a employees (evaluado)" },
          { name: "review_date",  type: "DATE",    description: "Fecha de la evaluación (junio o diciembre)", example: "2024-12-01" },
          { name: "rating",       type: "INTEGER", description: "Calificación 1–5 (distribución realista sesgada a 3–4)", example: "4" },
          { name: "manager_id",   type: "INTEGER", description: "FK a employees (quien evalúa)" },
          { name: "would_rehire", type: "INTEGER", description: "1 = el manager volvería a contratar, 0 = no" },
        ],
      },
    ],
  },
];

export function getDataset(id: string): DatasetSchema | undefined {
  return DATASETS.find((d) => d.id === id);
}

export function getTotalRows(dataset: DatasetSchema): number {
  return dataset.tables.reduce((sum, t) => sum + t.rowCount, 0);
}
