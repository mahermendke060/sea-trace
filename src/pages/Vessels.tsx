import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { VesselDialog } from "@/components/dialogs/VesselDialog";

export default function Vessels() {
  const [vessels, setVessels] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);

  const fetchVessels = async () => {
    const { data } = await supabase
      .from("vessels")
      .select("*, suppliers(name)")
      .order("created_at", { ascending: false });
    setVessels(data || []);
  };

  useEffect(() => {
    fetchVessels();
  }, []);

  const columns = [
    { header: "Registration", accessor: "registration_number" },
    { header: "License", accessor: "license_number" },
    { header: "Gear Type", accessor: "gear_type" },
    { header: "Supplier", accessor: (row: any) => row.suppliers?.name || "-" },
  ];

  const handleDelete = async (vessel: any) => {
    if (!confirm(`Delete vessel "${vessel.registration_number || vessel.license_number || ''}"?`)) return;
    await supabase.from("vessels").delete().eq("id", vessel.id);
    fetchVessels();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vessels</h1>
          <p className="text-muted-foreground mt-1">Manage fishing vessels and boats</p>
        </div>
        <Button onClick={() => { setSelectedVessel(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vessel
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Vessels</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={vessels} 
            onEdit={(vessel) => { setSelectedVessel(vessel); setDialogOpen(true); }}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <VesselDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vessel={selectedVessel}
        onSuccess={fetchVessels}
      />
    </div>
  );
}