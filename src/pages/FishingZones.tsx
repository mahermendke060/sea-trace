import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { FishingZoneDialog } from "@/components/dialogs/FishingZoneDialog";

export default function FishingZones() {
  const [zones, setZones] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<any>(null);

  const fetchZones = async () => {
    const { data } = await supabase
      .from("fishing_zones")
      .select("*")
      .order("created_at", { ascending: false });
    setZones(data || []);
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const columns = [
    { header: "Zone Name", accessor: "name" },
    { header: "Description", accessor: "description" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fishing Zones</h1>
          <p className="text-muted-foreground mt-1">Manage predefined fishing zones</p>
        </div>
        <Button onClick={() => { setSelectedZone(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Zone
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Fishing Zones</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={zones} 
            onEdit={(zone) => { setSelectedZone(zone); setDialogOpen(true); }}
          />
        </CardContent>
      </Card>

      <FishingZoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        zone={selectedZone}
        onSuccess={fetchZones}
      />
    </div>
  );
}