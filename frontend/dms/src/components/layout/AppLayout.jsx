import { useLocation } from "react-router-dom";
import AppShell from "./AppShell";

function AppLayout({ children }) {
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";

  const isPrintPage =
    location.pathname.endsWith("/print") ||
    location.pathname.includes("/print/");

  if (isLoginPage || isPrintPage) {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}

export default AppLayout;
