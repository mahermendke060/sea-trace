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
    {
      header: "Scope",
      accessor: (row: any) => {
        // Prefer UI mapping from localStorage when present
        try {
          const raw = localStorage.getItem("location_scope");
          if (raw) {
            const map = JSON.parse(raw);
            if (map && map[row.id]) return map[row.id];
          }
        } catch {}
        const t = row.type || "";
        if (typeof t === "string" && t.startsWith("external_")) return "external";
        if (typeof t === "string" && t.startsWith("internal_")) return "internal";
        return "internal"; // default when no stored scope or prefix
      },
    },
    {
      header: "Type",
      accessor: (row: any) => {
        const t = row.type || "";
        const match = /^(internal|external)_(.+)$/.exec(t);
        return match ? match[2] : t;
      },
    },
    { header: "Address", accessor: "address" },
  ];

  const handleDelete = async (location: any) => {
    if (!confirm(`Delete location "${location.name}"?`)) return;
    await supabase.from("locations").delete().eq("id", location.id);
    fetchLocations();
  };

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
            onDelete={handleDelete}
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