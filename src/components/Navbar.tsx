import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Shield, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/login", label: "Login", authRequired: false },
  { href: "/register", label: "Register", authRequired: false },
  { href: "/report", label: "Report" },
  { href: "/my-reports", label: "My Reports", authRequired: true },
  { href: "/contact", label: "Contact Support" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const filteredLinks = navLinks.filter((link) => {
    if (link.authRequired === false && user) return false;
    if (link.authRequired === true && !user) return false;
    // Hide Report, My Reports, Contact Support for admin and super_admin
    if ((userRole === "admin" || userRole === "super_admin") && 
        (link.href === "/report" || link.href === "/my-reports" || link.href === "/contact")) return false;
    return true;
  });

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-nav text-nav-foreground border-b border-nav-foreground/20 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-lg bg-nav-foreground/10 group-hover:bg-nav-foreground/20 transition-colors">
              <Shield className="h-6 w-6 text-nav-foreground" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-nav-foreground">
              PROMETEO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  location.pathname === link.href
                    ? "bg-nav-foreground/20 text-nav-foreground"
                    : "text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-foreground/10"
                )}
              >
                {link.label}
              </Link>
            ))}

            {/* Dashboard link for admins */}
            {user && (userRole === "admin" || userRole === "super_admin") && (
              <Link
                to="/dashboard"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  location.pathname === "/dashboard"
                    ? "bg-nav-foreground/20 text-nav-foreground"
                    : "text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-foreground/10"
                )}
              >
                Dashboard
              </Link>
            )}

            {/* Super Admin link */}
            {user && userRole === "super_admin" && (
              <Link
                to="/super-admin"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  location.pathname === "/super-admin"
                    ? "bg-nav-foreground/20 text-nav-foreground"
                    : "text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-foreground/10"
                )}
              >
                Admin Panel
              </Link>
            )}

            <div className="ml-2 flex items-center gap-2">
              <ThemeToggle />
              
              {user && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-nav-foreground/10">
                    <User className="h-4 w-4 text-nav-foreground/70" />
                    <span className="text-sm font-medium capitalize text-nav-foreground">{userRole}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSignOut}
                    className="h-9 w-9 text-nav-foreground hover:bg-nav-foreground/10"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="h-9 w-9"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-nav-foreground/20 animate-slide-in">
            <div className="flex flex-col gap-1">
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    location.pathname === link.href
                      ? "bg-nav-foreground/20 text-nav-foreground"
                      : "text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-foreground/10"
                  )}
                >
                  {link.label}
                </Link>
              ))}

              {user && (userRole === "admin" || userRole === "super_admin") && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    location.pathname === "/dashboard"
                      ? "bg-nav-foreground/20 text-nav-foreground"
                      : "text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-foreground/10"
                  )}
                >
                  Dashboard
                </Link>
              )}

              {user && userRole === "super_admin" && (
                <Link
                  to="/super-admin"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-all",
                    location.pathname === "/super-admin"
                      ? "bg-nav-foreground/20 text-nav-foreground"
                      : "text-nav-foreground/70 hover:text-nav-foreground hover:bg-nav-foreground/10"
                  )}
                >
                  Admin Panel
                </Link>
              )}

              {user && (
                <div className="pt-2 mt-2 border-t border-nav-foreground/20">
                  <div className="flex items-center justify-between px-4 py-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-nav-foreground/70" />
                      <span className="text-sm font-medium capitalize text-nav-foreground">{userRole}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSignOut}
                      className="gap-2 text-nav-foreground hover:bg-nav-foreground/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
