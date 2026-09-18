import { Card } from "../../components/ui/Card.js";
import { DataTable } from "../../components/data-display/DataTable.js";
import type { QueryResult } from "../../types/api.js";

export function ResultTable({ result }: { result: QueryResult }) {
  return (
    <Card title="Result" actions={<span className="card-meta">{result.rows.length} row{result.rows.length === 1 ? "" : "s"}</span>}>
      <DataTable columns={result.columns} rows={result.rows} />
    </Card>
  );
}
