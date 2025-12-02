import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { VesselDialog } from "@/components/dialogs/VesselDialog";

export default function DistributorVessels() {
  const [vessels, setVessels] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVessel, setSelectedVessel] = useState<any>(null);

  const fetchVessels = async () => {
    const { data } = await supabase.from("vessels").select("*, suppliers(name)").order("registration_number");
    setVessels(data || []);
  };

  useEffect(() => { fetchVessels(); }, []);

  const columns = [
    { header: "Registration #", accessor: "registration_number" },
    { header: "License #", accessor: "license_number" },
    { header: "Gear Type", accessor: "gear_type" },
    { header: "Owner", accessor: (row: any) => row.suppliers?.name || "-" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vessels</h1>
          <p className="text-muted-foreground mt-1">Track vessels in your supply chain</p>
        </div>
        <Button onClick={() => { setSelectedVessel(null); setDialogOpen(true); }} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" />Add Vessel
        </Button>
      </div>
      <Card className="shadow-card">
        <CardHeader><CardTitle>All Vessels</CardTitle></CardHeader>
        <CardContent>
          <DataTable columns={columns} data={vessels} onEdit={(v) => { setSelectedVessel(v); setDialogOpen(true); }} />
        </CardContent>
      </Card>
      <VesselDialog open={dialogOpen} onOpenChange={setDialogOpen} vessel={selectedVessel} onSuccess={fetchVessels} />
    </div>
  );
}