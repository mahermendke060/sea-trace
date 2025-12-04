import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Anchor, 
  Fish, 
  MapPin,
  Users,
  ShoppingCart,
  TrendingUp,
  Search,
  Scale,
  Settings,
  Menu,
  X
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/distributor", icon: LayoutDashboard },
  { name: "Purchases", href: "/distributor/purchases", icon: ShoppingCart },
  { name: "Grading", href: "/distributor/grading", icon: Scale },
  { name: "Grade Setup", href: "/distributor/grade-management", icon: Settings },
  { name: "Sales", href: "/distributor/sales", icon: TrendingUp },
  { name: "Traceability", href: "/distributor/traceability", icon: Search },
  { name: "Products", href: "/distributor/products", icon: Fish },
  { name: "Suppliers", href: "/distributor/suppliers", icon: Users },
  { name: "Customers", href: "/distributor/customers", icon: Anchor },
  { name: "Locations", href: "/distributor/locations", icon: MapPin },
];

export const DistributorLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 focus:outline-none"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Scale className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Cyan Analytics</h1>
              <p className="text-sm text-white/80">Distribution Management</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar Navigation - Desktop */}
        <nav className="w-64 flex-shrink-0 hidden lg:block">
          <div className="bg-card rounded-lg shadow-card p-4 sticky top-24">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                        isActive
                          ? "bg-emerald-600 text-white shadow-md"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-72 bg-card shadow-card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Scale className="h-6 w-6" />
                  <span className="font-semibold">Distributor</span>
                </div>
                <button
                  className="inline-flex items-center justify-center p-2 rounded-md hover:bg-muted"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                          isActive
                            ? "bg-emerald-600 text-white shadow-md"
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};