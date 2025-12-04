import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { DataTable } from "@/components/DataTable";
import { format } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function DistributorPurchases() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [poLabels, setPoLabels] = useState<Record<string, string>>({});
  const [saleLabels, setSaleLabels] = useState<Record<string, string>>({});
  const [saleSupplierMap, setSaleSupplierMap] = useState<Record<string, string>>({});

  const [saleHarvestMap, setSaleHarvestMap] = useState<Record<string, number>>({});
  const [saleUpstreamMap, setSaleUpstreamMap] = useState<Record<string, { harvest_quantity?: number; purchase_quantity?: number }>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

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
      .or("is_downstream_purchase.is.true,source_sale_id.not.is.null")
      .order("landing_date", { ascending: true });
    const rows = data || [];

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

    // Build SO labels and supplier map from SeaChain sales table (so it matches SeaChain panel numbering)
    const { data: allSales } = await supabase
      .from("sales")
      .select("id, sale_date, created_at, customers(name)")
      .order("sale_date", { ascending: false })
      .order("created_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true });

    const saleMap: Record<string, string> = {};
    const supplierBySaleId: Record<string, string> = {};
    (allSales || []).forEach((s: any, idx: number) => {
      saleMap[s.id] = `SO-${String(idx + 1).padStart(4, "0")}`;
      supplierBySaleId[s.id] = s.customers?.name || "-";
    });

    // Sort distributor purchases by SO number ascending (unknowns at bottom)
    const sortKey = (row: any) => {
      const lbl = row.source_sale_id ? saleMap[row.source_sale_id] : null;
      if (!lbl) return Number.POSITIVE_INFINITY;
      const n = parseInt(lbl.replace(/\D/g, ""), 10);
      return isNaN(n) ? Number.POSITIVE_INFINITY : n;
    };
    const sorted = [...rows].sort((a, b) => sortKey(a) - sortKey(b));

    // Fresh PO numbering based on sorted order only
    const poMap: Record<string, string> = {};
    let poCounter = 0;
    sorted.forEach((row: any) => {
      poCounter += 1;
      poMap[row.id] = `PO-${String(poCounter).padStart(4, "0")}`;
    });

    setPoLabels(poMap);
    setSaleLabels(saleMap);
    setSaleSupplierMap(supplierBySaleId);

    // Now set purchases and expansion state
    setPurchases(sorted);
    const exp: Record<string, boolean> = {};
    sorted.forEach((r: any) => { exp[r.id] = false; });
    setExpanded(exp);
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
          <span className="text-emerald-700 font-medium">{po}</span>
        );
      }
    },
    {
      header: "Sales Order No.",
      accessor: (row: any) => (row.source_sale_id ? (saleLabels[row.source_sale_id] || row.source_sale_id) : "-"),
    },
    { header: "Supplier", accessor: (row: any) => (row.source_sale_id ? (saleSupplierMap[row.source_sale_id] || "-") : "-") },
    { header: "Purchase Date", accessor: (row: any) => format(new Date(row.landing_date), "MMM dd, yyyy") },
    { header: "Total Quantity", accessor: (row: any) => `${row.purchase_quantity ?? row.quantity} ${row.products?.unit_of_measurement || ""}` },
    { header: "Product", accessor: (row: any) => row.products?.species || "-" },
    {
      header: "Details",
      accessor: (row: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setSelectedRow(row); setDetailsOpen(true); }}
        >
          View
        </Button>
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
      {selectedRow && (
        <DetailsModal
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          row={selectedRow}
          po={poLabels[selectedRow.id] || selectedRow.id}
          sa={saleLabels[selectedRow.source_sale_id] || selectedRow.source_sale_id}
          supplier={(selectedRow.source_sale_id && saleSupplierMap[selectedRow.source_sale_id]) || "-"}
          upstream={saleUpstreamMap[selectedRow.source_sale_id] || {}}
        />
      )}
    </div>
  );
}

function DetailsModal({ open, onOpenChange, row, po, sa, supplier, upstream }: { open: boolean; onOpenChange: (o: boolean) => void; row: any; po: string; sa: string | null; supplier: string; upstream: any }) {
  const unit = row?.products?.unit_of_measurement || "";
  const harvest = row?.harvest_quantity ?? upstream.harvest_quantity ?? upstream.harvest ?? undefined;
  const purchase = row?.purchase_quantity ?? upstream.purchase_quantity ?? upstream.purchase ?? row?.quantity ?? undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{po}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 text-sm">
          <div><strong>Sales Order No.:</strong> {sa ?? "-"}</div>
          <div><strong>Supplier:</strong> {supplier || "-"}</div>

          <div><strong>Vessel:</strong> {row?.vessels?.registration_number || "-"}</div>
          <div><strong>Product:</strong> {row?.products?.species || "-"}</div>
          {harvest != null && (
            <div><strong>Harvest Qty:</strong> {`${harvest} ${unit}`}</div>
          )}
          <div><strong>Purchase Qty:</strong> {purchase != null ? `${purchase} ${unit}` : "-"}</div>

        </div>
      </DialogContent>
    </Dialog>
  );
}