import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VesselDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vessel?: any;
  onSuccess: () => void;
}

export const VesselDialog = ({ open, onOpenChange, vessel, onSuccess }: VesselDialogProps) => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    registration_number: "",
    license_number: "",
    gear_type: "Trap/Pots",
    supplier_id: "",
    captain_name: "",
  });

  useEffect(() => {
    const fetchSuppliers = async () => {
      const { data } = await supabase.from("suppliers").select("*");
      setSuppliers(data || []);
    };
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (vessel) {
      setFormData({
        registration_number: vessel.registration_number || "",
        license_number: vessel.license_number || "",
        gear_type: vessel.gear_type || "Trap/Pots",
        supplier_id: vessel.supplier_id || "",
        captain_name: vessel.captain_name || "",
      });
    } else {
      setFormData({
        registration_number: "",
        license_number: "",
        gear_type: "Trap/Pots",
        supplier_id: "",
        captain_name: "",
      });
    }
  }, [vessel, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      registration_number: formData.registration_number,
      license_number: formData.license_number,
      gear_type: formData.gear_type,
      supplier_id: formData.supplier_id,
      captain_name: formData.captain_name,
    } as any;

    const { error } = vessel
      ? await supabase.from("vessels").update(payload).eq("id", vessel.id)
      : await supabase.from("vessels").insert([payload]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Vessel ${vessel ? "updated" : "created"} successfully`,
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vessel ? "Edit" : "Add"} Vessel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supplier_id">Supplier</Label>
            <Select value={formData.supplier_id} onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="captain_name">Captain Name</Label>
            <Input
              id="captain_name"
              value={formData.captain_name}
              onChange={(e) => setFormData({ ...formData, captain_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registration_number">Registration Number *</Label>
            <Input
              id="registration_number"
              value={formData.registration_number}
              onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="license_number">License Number</Label>
            <Input
              id="license_number"
              value={formData.license_number}
              onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gear_type">Gear Type</Label>
            <Select value={formData.gear_type} onValueChange={(value) => setFormData({ ...formData, gear_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Trap/Pots">Trap/Pots</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {vessel ? "Update" : "Create"} Vessel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};