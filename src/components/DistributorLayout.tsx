import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Anchor, 
  Ship, 
  Fish, 
  Users, 
  MapPin,
  ShoppingCart,
  TrendingUp,
  Search,
  Scale,
  Settings
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/distributor", icon: LayoutDashboard },
  { name: "Purchases", href: "/distributor/purchases", icon: ShoppingCart },
  { name: "Grading", href: "/distributor/grading", icon: Scale },
  { name: "Grade Setup", href: "/distributor/grade-management", icon: Settings },
  { name: "Sales", href: "/distributor/sales", icon: TrendingUp },
  { name: "Traceability", href: "/distributor/traceability", icon: Search },
  { name: "Suppliers", href: "/distributor/suppliers", icon: Users },
  { name: "Vessels", href: "/distributor/vessels", icon: Ship },
  { name: "Products", href: "/distributor/products", icon: Fish },
  { name: "Customers", href: "/distributor/customers", icon: Anchor },
  { name: "Locations", href: "/distributor/locations", icon: MapPin },
];

export const DistributorLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Distributor Portal</h1>
              <p className="text-sm text-white/80">Grading & Distribution Management</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-64 flex-shrink-0">
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

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};