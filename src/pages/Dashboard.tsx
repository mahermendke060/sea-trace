import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, Fish, TrendingUp, Users, ShoppingCart, Anchor } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSales: 0,
    totalVessels: 0,
    totalSuppliers: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [purchases, sales, vessels, suppliers, customers, products] = await Promise.all([
        supabase.from("purchases").select("*", { count: "exact", head: true }),
        supabase.from("sales").select("*", { count: "exact", head: true }),
        supabase.from("vessels").select("*", { count: "exact", head: true }),
        supabase.from("suppliers").select("*", { count: "exact", head: true }),
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }),
      ]);

      setStats({
        totalPurchases: purchases.count || 0,
        totalSales: sales.count || 0,
        totalVessels: vessels.count || 0,
        totalSuppliers: suppliers.count || 0,
        totalCustomers: customers.count || 0,
        totalProducts: products.count || 0,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: "Total Purchases", value: stats.totalPurchases, icon: ShoppingCart, color: "text-primary" },
    { title: "Total Sales", value: stats.totalSales, icon: TrendingUp, color: "text-accent" },
    { title: "Active Vessels", value: stats.totalVessels, icon: Ship, color: "text-secondary" },
    { title: "Suppliers", value: stats.totalSuppliers, icon: Users, color: "text-primary" },
    { title: "Customers", value: stats.totalCustomers, icon: Anchor, color: "text-secondary" },
    { title: "Products", value: stats.totalProducts, icon: Fish, color: "text-accent" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your seafood supply chain operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="shadow-card hover:shadow-ocean transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Track your recent transactions and supply chain activities here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}