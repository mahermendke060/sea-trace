import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: any;
  onSuccess: () => void;
}

export const LocationDialog = ({ open, onOpenChange, location, onSuccess }: LocationDialogProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    type: "wharf",
    address: "",
  });
  const [scope, setScope] = useState<"internal" | "external">("internal");

  useEffect(() => {
    if (location) {
      const rawType: string = location.type || "wharf";
      const match = /^(internal|external)_(.+)$/.exec(rawType);
      if (match) {
        setScope(match[1] as "internal" | "external");
        setFormData({
          name: location.name || "",
          type: match[2] || "wharf",
          address: location.address || "",
        });
      } else {
        setScope("internal");
        setFormData({
          name: location.name || "",
          type: rawType,
          address: location.address || "",
        });
      }
    } else {
      setScope("internal");
      setFormData({
        name: "",
        type: "wharf",
        address: "",
      });
    }
  }, [location, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // UI-only scope: do not persist it to DB to avoid violating type check constraint
    if (location) {
      const { error } = await supabase.from("locations").update(formData).eq("id", location.id);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      // Save scope to localStorage mapping
      try {
        const raw = localStorage.getItem("location_scope") || "{}";
        const map = JSON.parse(raw);
        map[location.id] = scope;
        localStorage.setItem("location_scope", JSON.stringify(map));
      } catch {}
    } else {
      const { data, error } = await supabase.from("locations").insert([formData]).select().single();
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      // Save scope to localStorage mapping with new id
      try {
        const raw = localStorage.getItem("location_scope") || "{}";
        const map = JSON.parse(raw);
        if (data?.id) map[data.id] = scope;
        localStorage.setItem("location_scope", JSON.stringify(map));
      } catch {}
    }
    toast({
      title: "Success",
      description: `Location ${location ? "updated" : "created"} successfully`,
    });
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? "Edit" : "Add"} Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Harbor Bay Wharf"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scope">Location Scope *</Label>
            <Select value={scope} onValueChange={(value) => setScope(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internal">Internal Location</SelectItem>
                <SelectItem value="external">External Location</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wharf">Wharf</SelectItem>
                <SelectItem value="dock">Dock</SelectItem>
                <SelectItem value="facility">Facility</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              placeholder="Enter full address"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {location ? "Update" : "Create"} Location
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};