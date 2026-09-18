import type { ReactNode } from "react";
import { AuthProvider } from "../features/auth/AuthContext.js";

export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
