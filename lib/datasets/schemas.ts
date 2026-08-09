import type { DatasetSchema } from "./types";

export const DATASETS: DatasetSchema[] = [
  // ══════════════════════════════════════════════════════════════════════
  // 1. Retail Sales
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "ventas-retail",
    name: "Retail Sales",
    description:
      "E-commerce with customers, product catalog, orders, and order line items. Includes a realistic time distribution with Q4 peaks and March seasonality.",
    icon: "ShoppingCart",
    accentColor: "#f59e0b",
    dbFile: "ventas_retail.db",
    badges: ["E-commerce", "2 years of data", "5 tables", "~37,500 rows"],
    suggestedQuestions: [
      "What are the best-selling products in Q4 2025?",
      "Show me the monthly revenue trend with a chart",
      "RFM analysis of my top customers",
      "Which category has the best margin?",
      "New vs. returning customer retention rate",
    ],
    tables: [
      {
        name: "customers",
        description: "Customers registered on the platform.",
        rowCount: 2000,
        columns: [
          { name: "customer_id",      type: "INTEGER", description: "Unique customer identifier" },
          { name: "name",             type: "TEXT",    description: "Full name" },
          { name: "email",            type: "TEXT",    description: "Unique email address" },
          { name: "country",          type: "TEXT",    description: "Customer's country", example: "Mexico" },
          { name: "signup_date",      type: "DATE",    description: "Date the customer registered on the platform", example: "2023-06-15" },
          { name: "customer_segment", type: "TEXT",    description: "Segment: premium, standard, or budget", example: "standard" },
          { name: "lifetime_value",   type: "REAL",    description: "Total sum of completed/returned purchases in MXN", example: "4320.50" },
        ],
      },
      {
        name: "categories",
        description: "Product catalog categories.",
        rowCount: 10,
        columns: [
          { name: "category_id",      type: "INTEGER", description: "Unique identifier" },
          { name: "name",             type: "TEXT",    description: "Category name", example: "Electrónica" },
          { name: "parent_category",  type: "TEXT",    description: "Parent category (NULL if root)", example: "Electrónica" },
        ],
      },
      {
        name: "products",
        description: "Catalog of available products.",
        rowCount: 500,
        columns: [
          { name: "product_id",   type: "INTEGER", description: "Unique identifier" },
          { name: "name",         type: "TEXT",    description: "Product name", example: "Audífonos Pro" },
          { name: "category_id",  type: "INTEGER", description: "FK to categories" },
          { name: "price",        type: "REAL",    description: "Sale price in MXN", example: "349.99" },
          { name: "cost",         type: "REAL",    description: "Acquisition cost (approx. 45-65% of price)", example: "189.00" },
          { name: "stock_level",  type: "INTEGER", description: "Units in inventory" },
          { name: "launch_date",  type: "DATE",    description: "Product launch date" },
        ],
      },
      {
        name: "orders",
        description: "Purchase orders. Distributed between January 2024 and April 2026, with peaks in Q4 and March.",
        rowCount: 10000,
        columns: [
          { name: "order_id",         type: "INTEGER",  description: "Unique identifier" },
          { name: "customer_id",      type: "INTEGER",  description: "FK to customers" },
          { name: "order_date",       type: "DATETIME", description: "Order date and time", example: "2024-11-29 14:32:00" },
          { name: "status",           type: "TEXT",     description: "Status: completed (85%), cancelled (8%), returned (7%)", example: "completed" },
          { name: "total_amount",     type: "REAL",     description: "Sum of order line items with discounts applied", example: "1250.00" },
          { name: "shipping_country", type: "TEXT",     description: "Shipping country", example: "Mexico" },
        ],
      },
      {
        name: "order_items",
        description: "Order line items — each item within an order.",
        rowCount: 25000,
        columns: [
          { name: "item_id",      type: "INTEGER", description: "Unique identifier" },
          { name: "order_id",     type: "INTEGER", description: "FK to orders" },
          { name: "product_id",   type: "INTEGER", description: "FK to products" },
          { name: "quantity",     type: "INTEGER", description: "Units purchased", example: "2" },
          { name: "unit_price",   type: "REAL",    description: "Unit price at time of purchase", example: "349.99" },
          { name: "discount_pct", type: "REAL",    description: "Discount percentage applied (0-30)", example: "10.0" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 2. SaaS Metrics
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "metricas-saas",
    name: "SaaS Metrics",
    description:
      "Data from a B2B SaaS company: users, subscriptions, usage events, and MRR trends. Ideal for churn, retention, and growth analysis.",
    icon: "LineChart",
    accentColor: "#3b82f6",
    dbFile: "metricas_saas.db",
    badges: ["SaaS / B2B", "24 months of MRR", "4 tables", "~110,000 rows"],
    suggestedQuestions: [
      "Calculate current MRR and compare it to 6 months ago",
      "Activation funnel: free → starter → pro",
      "Cohort retention analysis by signup month",
      "Which acquisition channel has the best LTV?",
      "Predict churn based on usage patterns",
    ],
    tables: [
      {
        name: "users",
        description: "Users registered on the SaaS platform.",
        rowCount: 5000,
        columns: [
          { name: "user_id",             type: "INTEGER", description: "Unique identifier" },
          { name: "email",               type: "TEXT",    description: "User's unique email" },
          { name: "signup_date",         type: "DATE",    description: "Registration date", example: "2023-08-10" },
          { name: "country",             type: "TEXT",    description: "User's country", example: "Mexico" },
          { name: "acquisition_channel", type: "TEXT",    description: "Acquisition channel", example: "organic" },
          { name: "industry",            type: "TEXT",    description: "User's/company's industry", example: "SaaS" },
        ],
      },
      {
        name: "subscriptions",
        description: "Each user's active or historical subscription. One per user.",
        rowCount: 5000,
        columns: [
          { name: "subscription_id", type: "INTEGER", description: "Unique identifier" },
          { name: "user_id",         type: "INTEGER", description: "FK to users" },
          { name: "plan",            type: "TEXT",    description: "Plan: free (40%), starter (35%), pro (20%), enterprise (5%)", example: "pro" },
          { name: "mrr",             type: "REAL",    description: "Plan MRR in USD: free=0, starter=29, pro=99, enterprise=499", example: "99.0" },
          { name: "started_at",      type: "DATE",    description: "Subscription start date" },
          { name: "cancelled_at",    type: "DATE",    description: "Cancellation date (NULL if active)" },
          { name: "status",          type: "TEXT",    description: "Status: active or cancelled", example: "active" },
        ],
      },
      {
        name: "events",
        description: "Usage events generated by users. Users on higher-tier plans generate more events.",
        rowCount: 100000,
        columns: [
          { name: "event_id",   type: "INTEGER",  description: "Unique identifier" },
          { name: "user_id",    type: "INTEGER",  description: "FK to users" },
          { name: "event_type", type: "TEXT",     description: "Type: login, feature_used, export, api_call, invite_sent", example: "feature_used" },
          { name: "created_at", type: "DATETIME", description: "Event timestamp", example: "2024-03-15 09:45:00" },
          { name: "metadata",   type: "TEXT",     description: "JSON with details depending on event type", example: '{"feature": "dashboard"}' },
        ],
      },
      {
        name: "mrr_history",
        description: "Monthly MRR snapshot over the last 24 months.",
        rowCount: 24,
        columns: [
          { name: "month",         type: "DATE", description: "First day of the snapshot month", example: "2024-06-01" },
          { name: "total_mrr",     type: "REAL", description: "Total MRR at month end, in USD" },
          { name: "new_mrr",       type: "REAL", description: "MRR contributed by new subscriptions" },
          { name: "churned_mrr",   type: "REAL", description: "MRR lost to cancellations" },
          { name: "expansion_mrr", type: "REAL", description: "Additional MRR from plan upgrades" },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════
  // 3. Human Resources
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "recursos-humanos",
    name: "Human Resources",
    description:
      "HR dataset with employees, salary history, performance reviews, and attrition. Includes a subtle gender pay gap (~7%) for analysis.",
    icon: "Users",
    accentColor: "#22c55e",
    dbFile: "recursos_humanos.db",
    badges: ["HR / People Analytics", "2018–2026", "4 tables", "~9,000 rows"],
    suggestedQuestions: [
      "Is there a gender pay gap at the company?",
      "Attrition analysis: which departments lose the most people",
      "Salary distribution by level and department (chart)",
      "Performance vs. tenure: do they correlate?",
      "Top 10 managers with the best team reviews",
    ],
    tables: [
      {
        name: "departments",
        description: "Company departments with target headcount.",
        rowCount: 10,
        columns: [
          { name: "department_id",      type: "INTEGER", description: "Unique identifier" },
          { name: "name",               type: "TEXT",    description: "Department name", example: "Ingeniería" },
          { name: "head_count_target",  type: "INTEGER", description: "Target number of employees in the department", example: "120" },
        ],
      },
      {
        name: "employees",
        description: "Active and inactive employees. ~15% have a termination_date (separated).",
        rowCount: 1000,
        columns: [
          { name: "employee_id",      type: "INTEGER", description: "Unique identifier" },
          { name: "name",             type: "TEXT",    description: "Full name" },
          { name: "gender",           type: "TEXT",    description: "M (48%), F (48%), NB (4%)", example: "F" },
          { name: "department_id",    type: "INTEGER", description: "FK to departments" },
          { name: "position",         type: "TEXT",    description: "Role within the department", example: "Software Engineer" },
          { name: "level",            type: "TEXT",    description: "Level: junior, mid, senior, lead, director", example: "senior" },
          { name: "hire_date",        type: "DATE",    description: "Date the employee joined the company", example: "2021-03-01" },
          { name: "birth_date",       type: "DATE",    description: "Date of birth" },
          { name: "is_active",        type: "INTEGER", description: "1 = active, 0 = separated" },
          { name: "termination_date", type: "DATE",    description: "Separation date (NULL if active)" },
        ],
      },
      {
        name: "salaries",
        description: "Salary change history. Each employee has between 1 and 5 records (raises over time).",
        rowCount: 5000,
        columns: [
          { name: "salary_id",      type: "INTEGER", description: "Unique identifier" },
          { name: "employee_id",    type: "INTEGER", description: "FK to employees" },
          { name: "effective_date", type: "DATE",    description: "Date the salary takes effect", example: "2022-01-01" },
          { name: "base_salary",    type: "REAL",    description: "Monthly base salary in MXN", example: "95000.00" },
          { name: "bonus_pct",      type: "REAL",    description: "Bonus percentage over base salary", example: "12.0" },
        ],
      },
      {
        name: "performance_reviews",
        description: "Semiannual performance evaluations for active employees.",
        rowCount: 3000,
        columns: [
          { name: "review_id",    type: "INTEGER", description: "Unique identifier" },
          { name: "employee_id",  type: "INTEGER", description: "FK to employees (reviewee)" },
          { name: "review_date",  type: "DATE",    description: "Review date (June or December)", example: "2024-12-01" },
          { name: "rating",       type: "INTEGER", description: "Rating 1-5 (realistic distribution skewed to 3-4)", example: "4" },
          { name: "manager_id",   type: "INTEGER", description: "FK to employees (reviewer)" },
          { name: "would_rehire", type: "INTEGER", description: "1 = the manager would rehire, 0 = would not" },
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
