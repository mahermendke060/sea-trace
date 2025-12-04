import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { DistributorSupplierDialog } from "@/components/dialogs/DistributorSupplierDialog";
import { useToast } from "@/hooks/use-toast";

export default function DistributorSuppliers() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const { toast } = useToast();

  const fetchSuppliers = async () => {
    // Read current distributor suppliers
    const { data: existing } = await supabase
      .from("distributor_suppliers")
      .select("id,name, type, contact_name, contact_email, contact_phone, location_id")
      .order("created_at", { ascending: false });

    const existingByName = new Set((existing || []).map((s: any) => (s.name || "").trim().toLowerCase()));

    // Pull SeaChain customers and insert missing ones as distributor suppliers
    const { data: seaCustomers } = await supabase
      .from("customers")
      .select("name, type, contact_name, contact_email, contact_phone")
      .eq("portal", "seachain");

    const toInsert = (seaCustomers || [])
      .filter((c: any) => !!c?.name && !existingByName.has(String(c.name).trim().toLowerCase()))
      .map((c: any) => ({
        name: c.name,
        type: c.type || null,
        contact_name: c.contact_name || null,
        contact_email: c.contact_email || null,
        contact_phone: c.contact_phone || null,
        location_id: null as any, // optional mapping later to distributor_locations
      }));

    if (toInsert.length > 0) {
      await supabase.from("distributor_suppliers").insert(toInsert);
    }

    // Fetch fresh list with location join for display
    const { data } = await supabase
      .from("distributor_suppliers")
      .select("*, distributor_locations(name)")
      .order("created_at", { ascending: false });
    setSuppliers(data || []);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Type", accessor: "type" },
    { header: "Contact", accessor: "contact_name" },
    { header: "Email", accessor: "contact_email" },
    { header: "Phone", accessor: "contact_phone" },
    { header: "Location", accessor: (row: any) => row.distributor_locations?.name || "-" },
  ];

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedSupplier(null);
    setDialogOpen(true);
  };

  const handleDelete = async (supplier: any) => {
    if (!supplier?.id) {
      toast({ title: "Delete failed", description: "Missing supplier ID.", variant: "destructive" });
      return;
    }
    if (!confirm(`Delete supplier "${supplier.name || "(unnamed)"}"?`)) return;
    try {
      const { error } = await supabase.from("distributor_suppliers").delete().eq("id", supplier.id);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Supplier deleted" });
        fetchSuppliers();
      }
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message || String(e), variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage supplier relationships</p>
        </div>
        <Button onClick={handleAdd} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={suppliers} 
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <DistributorSupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        supplier={selectedSupplier}
        onSuccess={fetchSuppliers}
      />
    </div>
  );
}
