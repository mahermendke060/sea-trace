import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { DistributorSaleDialog } from "@/components/dialogs/DistributorSaleDialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const gradeLabels: Record<string, string> = {
  culls: "Culls",
  selects: "Selects",
  chicks: "Chicks",
  quarters: "Quarters",
  halves: "Halves",
  jumbo: "Jumbo",
  soft_shell: "Soft Shell",
  hard_shell: "Hard Shell",
};

export default function DistributorSales() {
  const [sales, setSales] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const { toast } = useToast();

  const fetchSales = async () => {
    const { data } = await supabase
      .from("sales")
      .select(`
        *,
        suppliers(name),
        customers(name),
        sale_items(
          quantity,
          products(species, unit_of_measurement),
          grading(grade)
        )
      `)
      .order("sale_date", { ascending: false });
    setSales(data || []);
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const columns = [
    { header: "Sales Order No.", accessor: (row: any) => `SO-${String(row._seq || 0).padStart(4, "0")}` },
    { header: "Sale Date", accessor: (row: any) => format(new Date(row.sale_date), "MMM dd, yyyy") },
    { header: "Customer", accessor: (row: any) => row.customers?.name || "-" },
    {
      header: "Product Name",
      accessor: (row: any) => {
        const items = row.sale_items || [];
        return items.length > 0
          ? items
              .map(
                (item: any) =>
                  `${item.quantity} ${item.products?.unit_of_measurement} ${item.products?.species}`
              )
              .join(", ")
          : "-";
      },
    },
  ];

  const handleDelete = async (sale: any) => {
    if (!sale?.id) {
      toast({ title: "Delete failed", description: "Missing sale ID.", variant: "destructive" });
      return;
    }
    if (!confirm("Delete this sale?")) return;
    try {
      const { error } = await supabase.from("sales").delete().eq("id", sale.id);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Sale deleted" });
        fetchSales();
      }
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground mt-1">Sell graded products to customers</p>
        </div>
        <Button onClick={() => { setSelectedSale(null); setDialogOpen(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Record Sale
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={sales} 
            onEdit={(sale) => { setSelectedSale(sale); setDialogOpen(true); }}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <DistributorSaleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sale={selectedSale}
        onSuccess={fetchSales}
      />
    </div>
  );
}