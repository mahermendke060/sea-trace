import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, TrendingUp, Scale, Package } from "lucide-react";

export default function DistributorDashboard() {
  const [stats, setStats] = useState({
    purchases: 0,
    sales: 0,
    graded: 0,
    pendingGrading: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [purchasesData, salesData, gradingData] = await Promise.all([
        supabase.from("purchases").select("id", { count: "exact" }).eq("is_downstream_purchase", true),
        supabase.from("sales").select("id", { count: "exact" }),
        supabase.from("grading").select("id", { count: "exact" }),
      ]);

      // Get purchases pending grading (downstream purchases without grading records)
      const { data: downstreamPurchases } = await supabase
        .from("purchases")
        .select("id")
        .eq("is_downstream_purchase", true);
      
      const { data: gradedPurchases } = await supabase
        .from("grading")
        .select("purchase_id");
      
      const gradedIds = new Set(gradedPurchases?.map(g => g.purchase_id) || []);
      const pendingCount = downstreamPurchases?.filter(p => !gradedIds.has(p.id)).length || 0;

      setStats({
        purchases: purchasesData.count || 0,
        sales: salesData.count || 0,
        graded: gradingData.count || 0,
        pendingGrading: pendingCount,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Distributor Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your distribution operations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Received Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.purchases}</div>
            <p className="text-xs text-muted-foreground">From upstream suppliers</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingGrading}</div>
            <p className="text-xs text-muted-foreground">Awaiting sorting</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Graded Batches</CardTitle>
            <Scale className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.graded}</div>
            <p className="text-xs text-muted-foreground">Ready for sale</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sales}</div>
            <p className="text-xs text-muted-foreground">Completed transactions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}