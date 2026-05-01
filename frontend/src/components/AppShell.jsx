import { Link, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus2, UploadCloud, ShieldCheck, LogOut, Menu, X, ScanSearch } from "lucide-react";
import { useState } from "react";
import { getUser, logout } from "../utils/auth";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/create", label: "Create", icon: FilePlus2 },
  { to: "/upload", label: "Upload", icon: UploadCloud },
  { to: "/audit", label: "Audit", icon: ShieldCheck },
];

export default function AppShell({ children }) {
  const [open, setOpen] = useState(false);
  const user = getUser();
  const nav = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav (Amazon-style) */}
      <header className="bg-navy text-white">
        <div className="max-w-7xl mx-auto flex items-center gap-3 px-3 sm:px-6 py-2">
          <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <ScanSearch className="text-accent" />
            <span>Invoice<span className="text-accent">Validator</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 hover:bg-navy-light ${isActive ? "bg-navy-light ring-1 ring-accent/60" : ""}`
                }>
                <l.icon size={16} /> {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">Hello, <b>{user?.name || "User"}</b></span>
            <button onClick={() => { logout(); }} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-navy-light">
              <LogOut size={16} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
        {/* mobile menu */}
        {open && (
          <div className="md:hidden border-t border-navy-light px-3 pb-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={({ isActive }) => `px-3 py-2 rounded text-sm flex items-center gap-2 ${isActive ? "bg-navy-light" : ""}`}>
                <l.icon size={16} /> {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">{children}</main>

      <footer className="bg-navy text-gray-300 text-xs text-center py-3">
        © {new Date().getFullYear()} Invoice Validator · Built with Express + React
      </footer>
    </div>
  );
}
