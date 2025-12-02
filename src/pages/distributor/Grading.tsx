import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Scale } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { GradingDialog } from "@/components/dialogs/GradingDialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

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

export default function Grading() {
  const [gradings, setGradings] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGrading, setSelectedGrading] = useState<any>(null);

  const fetchGradings = async () => {
    const { data } = await supabase
      .from("grading")
      .select(`
        *,
        products(species, unit_of_measurement),
        purchases(
          quantity,
          landing_date,
          vessels(registration_number),
          suppliers(name)
        )
      `)
      .order("graded_at", { ascending: false });
    setGradings(data || []);
  };

  useEffect(() => {
    fetchGradings();
  }, []);

  const columns = [
    { 
      header: "Source Purchase", 
      accessor: (row: any) => `${row.purchases?.vessels?.registration_number || "-"} - ${row.purchases?.suppliers?.name || "-"}` 
    },
    { header: "Product", accessor: (row: any) => row.products?.species || "-" },
    { 
      header: "Grade", 
      accessor: (row: any) => (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          {gradeLabels[row.grade] || row.grade}
        </Badge>
      )
    },
    { header: "Graded Qty", accessor: (row: any) => `${row.quantity} ${row.products?.unit_of_measurement || ""}` },
    { 
      header: "Available", 
      accessor: (row: any) => (
        <span className={row.available_quantity > 0 ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
          {row.available_quantity} {row.products?.unit_of_measurement || ""}
        </span>
      )
    },
    { header: "Graded At", accessor: (row: any) => format(new Date(row.graded_at), "MMM dd, yyyy HH:mm") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8 text-emerald-600" />
            Sorting & Grading
          </h1>
          <p className="text-muted-foreground mt-1">Grade and sort received products by lobster industry standards</p>
        </div>
        <Button onClick={() => { setSelectedGrading(null); setDialogOpen(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Grade Products
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Graded Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={gradings} 
            onEdit={(grading) => { setSelectedGrading(grading); setDialogOpen(true); }}
          />
        </CardContent>
      </Card>

      <GradingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        grading={selectedGrading}
        onSuccess={fetchGradings}
      />
    </div>
  );
}