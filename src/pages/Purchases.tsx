import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { PurchaseDialog } from "@/components/dialogs/PurchaseDialog";
import { format } from "date-fns";

export default function Purchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  const fetchPurchases = async () => {
    const { data } = await supabase
      .from("purchases")
      .select(`
        *,
        suppliers(name),
        vessels(registration_number),
        products(species, unit_of_measurement),
        fishing_zones(name)
      `)
      .order("landing_date", { ascending: false });
    setPurchases(data || []);
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const columns = [
    { header: "Landing Date", accessor: (row: any) => format(new Date(row.landing_date), "MMM dd, yyyy") },
    { header: "Vessel", accessor: (row: any) => row.vessels?.registration_number || "-" },
    { header: "Supplier", accessor: (row: any) => row.suppliers?.name || "-" },
    { header: "Product", accessor: (row: any) => row.products?.species || "-" },
    { header: "Quantity", accessor: (row: any) => `${row.quantity} ${row.products?.unit_of_measurement || ""}` },
    { header: "Zone", accessor: (row: any) => row.fishing_zones?.name || "-" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchases</h1>
          <p className="text-muted-foreground mt-1">Track catches and vessel-based purchases</p>
        </div>
        <Button onClick={() => { setSelectedPurchase(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Record Purchase
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={purchases} 
            onEdit={(purchase) => { setSelectedPurchase(purchase); setDialogOpen(true); }}
          />
        </CardContent>
      </Card>

      <PurchaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        purchase={selectedPurchase}
        onSuccess={fetchPurchases}
      />
    </div>
  );
}