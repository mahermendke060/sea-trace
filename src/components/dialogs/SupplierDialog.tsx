import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: any;
  onSuccess: () => void;
}

export const SupplierDialog = ({ open, onOpenChange, supplier, onSuccess }: SupplierDialogProps) => {
  const { toast } = useToast();
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    type: "fisherman",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    location_id: "",
  });

  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase.from("locations").select("*");
      setLocations(data || []);
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || "",
        type: supplier.type || "fisherman",
        contact_name: supplier.contact_name || "",
        contact_email: supplier.contact_email || "",
        contact_phone: supplier.contact_phone || "",
        location_id: supplier.location_id || "",
      });
    } else {
      setFormData({
        name: "",
        type: "fisherman",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        location_id: "",
      });
    }
  }, [supplier, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = supplier
      ? await supabase.from("suppliers").update(formData).eq("id", supplier.id)
      : await supabase.from("suppliers").insert([formData]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Supplier ${supplier ? "updated" : "created"} successfully`,
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{supplier ? "Edit" : "Add"} Supplier</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harvester">Harvester</SelectItem>
                  <SelectItem value="fisherman">Fisherman</SelectItem>
                  <SelectItem value="wharf_buyer">Wharf Buyer</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                  <SelectItem value="processor">Processor</SelectItem>
                  <SelectItem value="exporter">Exporter</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location_id">Location</Label>
              <Select value={formData.location_id} onValueChange={(value) => setFormData({ ...formData, location_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {supplier ? "Update" : "Create"} Supplier
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};