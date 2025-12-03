import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { CustomerDialog } from "@/components/dialogs/CustomerDialog";

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const fetchCustomers = async () => {
    const { data } = await supabase
      .from("customers")
      .select("*, locations(name)")
      .order("created_at", { ascending: false });
    setCustomers(data || []);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Type", accessor: "type" },
    { header: "Contact", accessor: "contact_name" },
    { header: "Email", accessor: "contact_email" },
    { header: "Phone", accessor: "contact_phone" },
    { header: "Location", accessor: (row: any) => row.locations?.name || "-" },
  ];

  const handleDelete = async (customer: any) => {
    if (!confirm(`Delete customer "${customer.name}"?`)) return;
    await supabase.from("customers").delete().eq("id", customer.id);
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage buyers and end customers</p>
        </div>
        <Button onClick={() => { setSelectedCustomer(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={customers} 
            onEdit={(customer) => { setSelectedCustomer(customer); setDialogOpen(true); }}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />
    </div>
  );
}