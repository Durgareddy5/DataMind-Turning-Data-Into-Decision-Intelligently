import { Card } from "../../components/ui/Card.js";
import { CodeBlock } from "../../components/data-display/CodeBlock.js";

export function SqlViewer({ sql }: { sql: string }) {
  return (
    <Card title="Generated SQL">
      <CodeBlock code={sql} language="sql" />
    </Card>
  );
}
