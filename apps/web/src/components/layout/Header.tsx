import { Link, useLocation } from "react-router-dom";
import {
  Camera,
  ClipboardList,
  FileImage,
  LogIn,
  LogOut,
  User,
} from "lucide-react";
import logo from "../../assets/logo.svg";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

type HeaderProps = {
  minimal?: boolean;
};

export function Header({ minimal }: HeaderProps) {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur ${
        minimal ? "border-transparent bg-brand-900/40" : "border-brand-100 bg-white/95"
      }`}
    >
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Ijwi" className="h-9 w-9" />
          <div>
            <p className={`text-sm font-bold ${minimal ? "text-white" : "text-brand-900"}`}>
              Ijwi
            </p>
            <p className={`text-xs ${minimal ? "text-white/70" : "text-brand-500"}`}>
              The voice of the citizens
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span
                className={`hidden items-center gap-1.5 text-xs font-medium sm:flex ${
                  minimal ? "text-white/80" : "text-brand-600"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                {user?.name}
              </span>
              <Button
                variant="ghost"
                onClick={logout}
                className={`px-2 py-1.5 ${minimal ? "text-white hover:bg-white/10" : ""}`}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button
                variant={minimal ? "outline" : "secondary"}
                className={
                  minimal
                    ? "border-white/30 bg-white/10 px-3 py-1.5 text-white hover:bg-white/20"
                    : "px-3 py-1.5"
                }
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

const navIcons = {
  "/": Camera,
  "/report": FileImage,
  "/reports": ClipboardList,
} as const;

export function MobileNav() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const links = [
    { to: "/", label: "Capture" },
    { to: "/report", label: "Report" },
    ...(isAuthenticated ? [{ to: "/reports", label: "My Reports" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg">
        {links.map((link) => {
          const active = location.pathname === link.to;
          const Icon = navIcons[link.to as keyof typeof navIcons] ?? ClipboardList;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                active ? "font-semibold text-accent-600" : "font-medium text-brand-500"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
              {link.label}
            </Link>
          );
        })}
        {!isAuthenticated && (
          <Link
            to="/login"
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium text-brand-500"
          >
            <ClipboardList className="h-5 w-5" strokeWidth={1.75} />
            Track reports
          </Link>
        )}
      </div>
    </nav>
  );
}
