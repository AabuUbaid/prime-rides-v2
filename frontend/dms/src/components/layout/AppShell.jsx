import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";

function AppShell({ children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      <Sidebar
        user={user}
        onLogout={logout}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:pl-[260px]">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />

        <main className="min-h-[calc(100vh-68px)] bg-[#f5f6fa]">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
