import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DataTable } from "@/components/DataTable";
import { LocationDialog } from "@/components/dialogs/LocationDialog";

export default function Locations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const fetchLocations = async () => {
    const { data } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });
    setLocations(data || []);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const columns = [
    { header: "Name", accessor: "name" },
    { header: "Type", accessor: "type" },
    { header: "Address", accessor: "address" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground mt-1">Manage wharfs, docks, and facilities</p>
        </div>
        <Button onClick={() => { setSelectedLocation(null); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={locations} 
            onEdit={(location) => { setSelectedLocation(location); setDialogOpen(true); }}
          />
        </CardContent>
      </Card>

      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={selectedLocation}
        onSuccess={fetchLocations}
      />
    </div>
  );
}