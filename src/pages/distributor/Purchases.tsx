import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function DistributorPurchases() {
  const [purchases, setPurchases] = useState<any[]>([]);

  const fetchPurchases = async () => {
    const { data } = await supabase
      .from("purchases")
      .select(`
        *,
        suppliers(name),
        vessels(registration_number),
        products(species, unit_of_measurement),
        fishing_zones(name),
        customers!purchases_downstream_customer_id_fkey(name)
      `)
      .eq("is_downstream_purchase", true)
      .order("landing_date", { ascending: false });
    setPurchases(data || []);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const columns = [
    { header: "Received Date", accessor: (row: any) => format(new Date(row.landing_date), "MMM dd, yyyy") },
    { header: "Vessel", accessor: (row: any) => row.vessels?.registration_number || "-" },
    { header: "Supplier", accessor: (row: any) => row.suppliers?.name || "-" },
    { header: "Product", accessor: (row: any) => row.products?.species || "-" },
    { header: "Quantity", accessor: (row: any) => `${row.quantity} ${row.products?.unit_of_measurement || ""}` },
    { header: "Zone", accessor: (row: any) => row.fishing_zones?.name || "-" },
    { 
      header: "Status", 
      accessor: (row: any) => (
        <Badge variant={row.source_sale_id ? "default" : "secondary"}>
          {row.source_sale_id ? "Synced" : "Manual"}
        </Badge>
      )
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Received Purchases</h1>
        <p className="text-muted-foreground mt-1">Products received from upstream suppliers (auto-synced from sales)</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Received Products</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={purchases} 
          />
        </CardContent>
      </Card>
    </div>
  );
}