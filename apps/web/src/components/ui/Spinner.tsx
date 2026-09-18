export function Spinner({ label }: { label?: string }) {
  return (
    <span className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" />
      {label ? <span className="spinner-label">{label}</span> : null}
    </span>
  );
}
