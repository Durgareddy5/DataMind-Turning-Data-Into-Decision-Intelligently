export interface AuthUser {
  id: string;
  roles: string[];
}

export interface ColumnSchema {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  businessDescription?: string;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  isUnique: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  businessDescription?: string;
}

export interface RelationshipSchema {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  constraintName: string;
}

export interface NormalizedSchema {
  tables: TableSchema[];
  relationships: RelationshipSchema[];
  generatedAt: string;
}

export interface SchemaContext {
  question: string;
  allowedTables: string[];
  tables: TableSchema[];
  relationships: RelationshipSchema[];
  promptText: string;
}
