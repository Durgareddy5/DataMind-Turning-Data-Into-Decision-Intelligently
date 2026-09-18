import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, KeyRound, Table2 } from "lucide-react";
import { Spinner } from "../../components/ui/Spinner.js";
import { ErrorState } from "../../components/ui/ErrorState.js";
import { getAuthorizedSchema } from "../../services/analyst.api.js";
import type { AuthorizedSchema, TableSchema } from "../../types/api.js";

function TableRow({ table }: { table: TableSchema }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="schema-table">
      <button type="button" className="schema-table-header" onClick={() => setExpanded((v) => !v)}>
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Table2 size={14} />
        <span className="schema-table-name">{table.name}</span>
        <span className="schema-table-count">{table.columns.length} cols</span>
      </button>
      {expanded && (
        <ul className="schema-column-list">
          {table.columns.map((column) => (
            <li key={column.name} className="schema-column">
              {column.isPrimaryKey && <KeyRound size={11} className="schema-column-pk" />}
              <span className="schema-column-name">{column.name}</span>
              <span className="schema-column-type">{column.dataType}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export function SchemaBrowser() {
  const [schema, setSchema] = useState<AuthorizedSchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setSchema(null);
    try {
      setSchema(await getAuthorizedSchema());
    } catch {
      setError("Couldn't load the schema.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!schema) return <Spinner label="Loading schema…" />;

  return (
    <ul className="schema-table-list">
      {schema.tables.map((table) => (
        <TableRow key={table.name} table={table} />
      ))}
    </ul>
  );
}
