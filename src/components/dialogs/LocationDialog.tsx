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

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || "",
        type: location.type || "wharf",
        address: location.address || "",
      });
    } else {
      setFormData({
        name: "",
        type: "wharf",
        address: "",
      });
    }
  }, [location, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = location
      ? await supabase.from("locations").update(formData).eq("id", location.id)
      : await supabase.from("locations").insert([formData]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Location ${location ? "updated" : "created"} successfully`,
      });
      onSuccess();
      onOpenChange(false);
    }
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