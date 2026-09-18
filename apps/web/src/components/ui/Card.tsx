import type { ReactNode } from "react";

export function Card({ title, actions, children }: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="card">
      {(title || actions) && (
        <div className="card-header">
          {title ? <h3 className="card-title">{title}</h3> : <span />}
          {actions}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
