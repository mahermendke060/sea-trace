import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Scale } from "lucide-react";
import { GradingDialog } from "@/components/dialogs/GradingDialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface GradingRecord {
  id: string;
  purchase_id: string;
  grade: string;
  quantity: number;
  available_quantity: number;
  percentage_of_purchase: number | null;
  graded_at: string;
  total_weight: number | null;
  shrinkage_percentage: number | null;
  products: { species: string; unit_of_measurement: string } | null;
  purchases: {
    landing_date: string;
    vessels: { registration_number: string } | null;
    suppliers: { name: string } | null;
  } | null;
}

interface GroupedGrading {
  purchase_id: string;
  vessel: string;
  supplier: string;
  product: string;
  unit: string;
  purchase_date: string;
  total_weight: number;
  graded_at: string;
  shrinkage_percentage: number | null;
  grades: Array<{
    grade: string;
    quantity: number;
    available_quantity: number;
    percentage: number | null;
  }>;
}

export default function Grading() {
  const [gradings, setGradings] = useState<GradingRecord[]>([]);
  const [groupedGradings, setGroupedGradings] = useState<GroupedGrading[]>([]);
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
    
    const records = (data || []) as GradingRecord[];
    setGradings(records);
    
    // Group by purchase_id
    const grouped = new Map<string, GroupedGrading>();
    records.forEach((record) => {
      const key = record.purchase_id;
      if (!grouped.has(key)) {
        grouped.set(key, {
          purchase_id: record.purchase_id,
          vessel: record.purchases?.vessels?.registration_number || "-",
          supplier: record.purchases?.suppliers?.name || "-",
          product: record.products?.species || "-",
          unit: record.products?.unit_of_measurement || "",
          purchase_date: record.purchases?.landing_date || "",
          total_weight: record.total_weight || 0,
          graded_at: record.graded_at,
          shrinkage_percentage: record.shrinkage_percentage,
          grades: [],
        });
      }
      grouped.get(key)!.grades.push({
        grade: record.grade,
        quantity: record.quantity,
        available_quantity: record.available_quantity,
        percentage: record.percentage_of_purchase,
      });
    });
    
    setGroupedGradings(Array.from(grouped.values()));
  };

  useEffect(() => {
    fetchGradings();
  }, []);

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Purchase ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Total Weight</TableHead>
                <TableHead>Grade Breakdown</TableHead>
                <TableHead>Shrinkage</TableHead>
                <TableHead>Graded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedGradings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No grading records found
                  </TableCell>
                </TableRow>
              ) : (
                groupedGradings.map((group) => (
                  <TableRow key={group.purchase_id}>
                    <TableCell className="font-mono text-xs">
                      {group.purchase_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{group.product}</TableCell>
                    <TableCell>
                      {group.purchase_date ? format(new Date(group.purchase_date), "MMM dd, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {group.total_weight} {group.unit}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.grades.map((g, idx) => (
                          <Badge key={idx} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                            {gradeLabels[g.grade] || g.grade}: {g.quantity} {group.unit} 
                            {g.percentage !== null && (
                              <span className="ml-1 text-muted-foreground">({g.percentage.toFixed(1)}%)</span>
                            )}
                            {g.available_quantity < g.quantity && (
                              <span className="ml-1 text-amber-600">[Avail: {g.available_quantity}]</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.shrinkage_percentage !== null ? (
                        <span className="text-amber-600 font-medium">
                          {group.shrinkage_percentage.toFixed(1)}%
                        </span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(group.graded_at), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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