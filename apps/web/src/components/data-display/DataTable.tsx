export function DataTable({ columns, rows }: { columns: string[]; rows: unknown[][] }) {
  if (rows.length === 0) {
    return <p className="data-table-empty">Query returned no rows.</p>;
  }

  return (
    <div className="data-table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            // eslint-disable-next-line react/no-array-index-key -- rows have no stable id
            <tr key={rowIndex}>
              {row.map((value, cellIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <td key={cellIndex} className={typeof value === "number" ? "data-table-cell-numeric" : undefined}>
                  {value === null || value === undefined ? <span className="data-table-null">—</span> : String(value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
