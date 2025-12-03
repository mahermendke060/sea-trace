import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { format } from "date-fns";

export default function DistributorPurchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [poLabels, setPoLabels] = useState<Record<string, string>>({});
  const [saleLabels, setSaleLabels] = useState<Record<string, string>>({});
  const [saleHarvestMap, setSaleHarvestMap] = useState<Record<string, number>>({});
  const [saleUpstreamMap, setSaleUpstreamMap] = useState<Record<string, { harvest_quantity?: number; purchase_quantity?: number }>>({});

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
      .order("landing_date", { ascending: true });
    const rows = data || [];
    setPurchases(rows);

    // If some downstream purchases don't have harvest_quantity, attempt to derive it
    const saleIdsNeedingHarvest = Array.from(
      new Set(
        rows
          .filter((r: any) => !r.harvest_quantity && r.source_sale_id)
          .map((r: any) => r.source_sale_id as string)
      )
    );
    if (saleIdsNeedingHarvest.length > 0) {
      const { data: siData } = await supabase
        .from("sale_items")
        .select(`sale_id, purchases!inner(id, harvest_quantity, purchase_quantity)`) // join upstream purchase via FK
        .in("sale_id", saleIdsNeedingHarvest);
      const map: Record<string, number> = {};
      const upMap: Record<string, { harvest_quantity?: number; purchase_quantity?: number }> = {};
      (siData || []).forEach((row: any) => {
        const hv = row.purchases?.harvest_quantity;
        const pq = row.purchases?.purchase_quantity;
        if (row.sale_id && typeof hv === "number" && map[row.sale_id] == null) {
          map[row.sale_id] = hv;
        }
        if (row.sale_id && upMap[row.sale_id] == null) {
          upMap[row.sale_id] = {};
        }
        if (row.sale_id) {
          if (typeof hv === "number") upMap[row.sale_id].harvest_quantity = hv;
          if (typeof pq === "number") upMap[row.sale_id].purchase_quantity = pq;
        }
      });
      setSaleHarvestMap(map);
      setSaleUpstreamMap(upMap);
    } else {
      setSaleHarvestMap({});
      setSaleUpstreamMap({});
    }

    // Build and persist user-visible labels (UI only, stable)
    let poMap: Record<string, string> = {};
    let saleMap: Record<string, string> = {};
    try {
      const storedPO = localStorage.getItem("po_labels");
      const storedSA = localStorage.getItem("sale_labels");
      poMap = storedPO ? JSON.parse(storedPO) : {};
      saleMap = storedSA ? JSON.parse(storedSA) : {};
    } catch {}

    let poCounter = Object.keys(poMap).length;
    let saCounter = Object.keys(saleMap).length;

    rows.forEach((row: any) => {
      if (!poMap[row.id]) {
        poCounter += 1;
        poMap[row.id] = `PO-${String(poCounter).padStart(3, "0")}`;
      }
      if (row.source_sale_id && !saleMap[row.source_sale_id]) {
        saCounter += 1;
        saleMap[row.source_sale_id] = `SA-${String(saCounter).padStart(3, "0")}`;
      }
    });

    setPoLabels(poMap);
    setSaleLabels(saleMap);
    try {
      localStorage.setItem("po_labels", JSON.stringify(poMap));
      localStorage.setItem("sale_labels", JSON.stringify(saleMap));
    } catch {}
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const columns = [
    {
      header: "Purchase Order No",
      accessor: (row: any) => {
        const po = poLabels[row.id] || row.id;
        return (
          <details>
            <summary className="cursor-pointer text-emerald-700 hover:underline">
              {po}
            </summary>
            <div className="mt-2 text-sm space-y-1">
              <div><strong>Sale ID:</strong> {row.source_sale_id ? (saleLabels[row.source_sale_id] || row.source_sale_id) : "-"}</div>
              <div><strong>Supplier:</strong> {row.suppliers?.name || "-"}</div>
              <div><strong>Vessel:</strong> {row.vessels?.registration_number || "-"}</div>
              <div><strong>Product:</strong> {row.products?.species || "-"}</div>
              <div><strong>Harvest Qty:</strong> {(row.harvest_quantity ?? saleUpstreamMap[row.source_sale_id]?.harvest_quantity ?? saleHarvestMap[row.source_sale_id]) ?? "-"} {row.products?.unit_of_measurement || ""}</div>
              <div><strong>Purchase Qty:</strong> {(row.purchase_quantity ?? saleUpstreamMap[row.source_sale_id]?.purchase_quantity ?? row.quantity) ?? "-"} {row.products?.unit_of_measurement || ""}</div>
            </div>
          </details>
        );
      }
    },

    { header: "Supplier", accessor: (row: any) => row.suppliers?.name || "-" },
    { header: "Purchase Date", accessor: (row: any) => format(new Date(row.landing_date), "MMM dd, yyyy") },
    { header: "Total Quantity", accessor: (row: any) => `${row.purchase_quantity ?? row.quantity} ${row.products?.unit_of_measurement || ""}` },
    { header: "Product", accessor: (row: any) => row.products?.species || "-" },
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