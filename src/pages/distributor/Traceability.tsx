import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Ship, Users, Scale, ShoppingCart, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

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

export default function DistributorTraceability() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<string>("");
  const [traceData, setTraceData] = useState<any>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      const { data } = await supabase
        .from("purchases")
        .select(`
          *,
          products(species),
          vessels(registration_number),
          suppliers(name)
        `)
        .eq("is_downstream_purchase", true)
        .order("landing_date", { ascending: false });
      setPurchases(data || []);
    };
    fetchPurchases();
  }, []);

  const traceProduct = async () => {
    if (!selectedPurchase) return;

    // Get the purchase with all upstream data
    const { data: purchase } = await supabase
      .from("purchases")
      .select(`
        *,
        products(species, unit_of_measurement),
        vessels(registration_number, license_number, gear_type),
        suppliers(name, contact_name, contact_email),
        fishing_zones(name, description),
        sales!purchases_source_sale_id_fkey(
          sale_date,
          suppliers(name),
          sale_items(
            quantity,
            purchases(
              landing_date,
              trip_start_date,
              trip_end_date,
              quantity,
              vessels(registration_number),
              suppliers(name),
              fishing_zones(name)
            )
          )
        )
      `)
      .eq("id", selectedPurchase)
      .single();

    // Get grading data
    const { data: gradings } = await supabase
      .from("grading")
      .select(`
        *,
        products(species, unit_of_measurement)
      `)
      .eq("purchase_id", selectedPurchase);

    // Get downstream sales from grading
    const { data: downstreamSales } = await supabase
      .from("sale_items")
      .select(`
        *,
        grading(grade),
        sales(
          sale_date,
          customers(name)
        )
      `)
      .in("grade_id", gradings?.map(g => g.id) || []);

    setTraceData({
      purchase,
      gradings,
      downstreamSales,
    });
  };

  const exportCSV = () => {
    if (!traceData) return;
    
    const rows = [
      ["Traceability Report"],
      ["Generated", new Date().toISOString()],
      [],
      ["UPSTREAM CHAIN"],
      ["Vessel", traceData.purchase?.vessels?.registration_number],
      ["Supplier", traceData.purchase?.suppliers?.name],
      ["Fishing Zone", traceData.purchase?.fishing_zones?.name],
      ["Landing Date", traceData.purchase?.landing_date],
      ["Product", traceData.purchase?.products?.species],
      ["Quantity", traceData.purchase?.quantity],
      [],
      ["GRADING BREAKDOWN"],
      ["Grade", "Quantity", "Available"],
      ...(traceData.gradings || []).map((g: any) => [
        gradeLabels[g.grade], g.quantity, g.available_quantity
      ]),
      [],
      ["DOWNSTREAM SALES"],
      ["Customer", "Grade", "Quantity", "Sale Date"],
      ...(traceData.downstreamSales || []).map((s: any) => [
        s.sales?.customers?.name,
        gradeLabels[s.grading?.grade],
        s.quantity,
        s.sales?.sale_date
      ]),
    ];

    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `traceability_${selectedPurchase}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="h-8 w-8 text-emerald-600" />
          Full Chain Traceability
        </h1>
        <p className="text-muted-foreground mt-1">
          Track products from vessel to final customer with complete grading history
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Search Product Chain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Select Received Purchase</Label>
              <Select value={selectedPurchase} onValueChange={setSelectedPurchase}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a purchase to trace" />
                </SelectTrigger>
                <SelectContent>
                  {purchases.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.vessels?.registration_number} - {p.products?.species} - {p.suppliers?.name} ({format(new Date(p.landing_date), "MMM dd")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={traceProduct} className="bg-emerald-600 hover:bg-emerald-700">
              <Search className="h-4 w-4 mr-2" />
              Trace
            </Button>
            {traceData && (
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {traceData && (
        <div className="space-y-4">
          {/* Upstream Chain */}
          <Card className="shadow-card border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Ship className="h-5 w-5" />
                Upstream Chain (Source)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground">Vessel</p>
                  <p className="font-semibold">{traceData.purchase?.vessels?.registration_number}</p>
                </div>
                <ArrowRight className="text-muted-foreground" />
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground">Fishing Zone</p>
                  <p className="font-semibold">{traceData.purchase?.fishing_zones?.name || "N/A"}</p>
                </div>
                <ArrowRight className="text-muted-foreground" />
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground">Supplier</p>
                  <p className="font-semibold">{traceData.purchase?.suppliers?.name}</p>
                </div>
                <ArrowRight className="text-muted-foreground" />
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="font-semibold">{traceData.purchase?.products?.species}</p>
                  <p className="text-sm text-muted-foreground">
                    {traceData.purchase?.quantity} {traceData.purchase?.products?.unit_of_measurement}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Trip Start:</span>{" "}
                  {traceData.purchase?.trip_start_date && format(new Date(traceData.purchase.trip_start_date), "MMM dd, yyyy")}
                </div>
                <div>
                  <span className="text-muted-foreground">Trip End:</span>{" "}
                  {traceData.purchase?.trip_end_date && format(new Date(traceData.purchase.trip_end_date), "MMM dd, yyyy")}
                </div>
                <div>
                  <span className="text-muted-foreground">Landing:</span>{" "}
                  {traceData.purchase?.landing_date && format(new Date(traceData.purchase.landing_date), "MMM dd, yyyy")}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grading */}
          <Card className="shadow-card border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Scale className="h-5 w-5" />
                Grading & Sorting
              </CardTitle>
            </CardHeader>
            <CardContent>
              {traceData.gradings && traceData.gradings.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {traceData.gradings.map((g: any) => (
                    <div key={g.id} className="bg-emerald-50 p-4 rounded-lg">
                      <Badge variant="outline" className="mb-2 bg-emerald-100 text-emerald-700 border-emerald-300">
                        {gradeLabels[g.grade]}
                      </Badge>
                      <p className="text-lg font-semibold">{g.quantity} {g.products?.unit_of_measurement}</p>
                      <p className="text-sm text-muted-foreground">
                        Available: {g.available_quantity} {g.products?.unit_of_measurement}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Not yet graded</p>
              )}
            </CardContent>
          </Card>

          {/* Downstream Sales */}
          <Card className="shadow-card border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700">
                <ShoppingCart className="h-5 w-5" />
                Downstream Sales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {traceData.downstreamSales && traceData.downstreamSales.length > 0 ? (
                <div className="space-y-3">
                  {traceData.downstreamSales.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 bg-amber-50 p-4 rounded-lg">
                      <div>
                        <p className="font-semibold">{s.sales?.customers?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {s.sales?.sale_date && format(new Date(s.sales.sale_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline">{gradeLabels[s.grading?.grade]}</Badge>
                      <p className="font-medium">{s.quantity} units sold</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No downstream sales yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}