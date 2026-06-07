export type DatasetId = "ventas-retail" | "metricas-saas" | "recursos-humanos";

export type ColumnSchema = {
  name: string;
  type: string;
  description: string;
  example?: string;
};

export type TableSchema = {
  name: string;
  description: string;
  rowCount: number;
  columns: ColumnSchema[];
};

export type DatasetSchema = {
  id: DatasetId;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  accentColor: string; // hex
  dbFile: string; // filename in analyst-service/data/
  tables: TableSchema[];
  suggestedQuestions: string[];
  badges: string[];
};
