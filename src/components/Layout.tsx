import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Anchor, 
  Ship, 
  Fish, 
  Users, 
  MapPin, 
  Waves,
  ShoppingCart,
  TrendingUp,
  Search
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Purchases", href: "/purchases", icon: ShoppingCart },
  { name: "Sales", href: "/sales", icon: TrendingUp },
  { name: "Traceability", href: "/traceability", icon: Search },
  { name: "Suppliers", href: "/suppliers", icon: Users },
  { name: "Vessels", href: "/vessels", icon: Ship },
  { name: "Products", href: "/products", icon: Fish },
  { name: "Customers", href: "/customers", icon: Anchor },
  { name: "Locations", href: "/locations", icon: MapPin },
  { name: "Fishing Zones", href: "/fishing-zones", icon: Waves },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="gradient-ocean text-white shadow-ocean sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Ship className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">SeaChain Tracker</h1>
              <p className="text-sm text-white/80">Seafood Supply Chain Management</p>
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
                          ? "bg-primary text-primary-foreground shadow-md"
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