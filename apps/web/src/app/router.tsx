import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage.js";
import { RequireAuth } from "../features/auth/RequireAuth.js";
import { DashboardPage } from "../pages/DashboardPage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <DashboardPage />
      </RequireAuth>
    ),
  },
  { path: "*", element: <NotFoundPage /> },
]);
