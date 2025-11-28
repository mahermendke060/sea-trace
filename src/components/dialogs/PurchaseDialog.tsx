import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase?: any;
  onSuccess: () => void;
}

export const PurchaseDialog = ({ open, onOpenChange, purchase, onSuccess }: PurchaseDialogProps) => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [vessels, setVessels] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    supplier_id: "",
    vessel_id: "",
    product_id: "",
    fishing_zone_id: "",
    quantity: "",
    gear_type: "",
    trip_start_date: "",
    trip_end_date: "",
    landing_date: "",
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [suppliersData, vesselsData, productsData, zonesData] = await Promise.all([
        supabase.from("suppliers").select("*"),
        supabase.from("vessels").select("*"),
        supabase.from("products").select("*"),
        supabase.from("fishing_zones").select("*"),
      ]);
      setSuppliers(suppliersData.data || []);
      setVessels(vesselsData.data || []);
      setProducts(productsData.data || []);
      setZones(zonesData.data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (purchase) {
      setFormData({
        supplier_id: purchase.supplier_id || "",
        vessel_id: purchase.vessel_id || "",
        product_id: purchase.product_id || "",
        fishing_zone_id: purchase.fishing_zone_id || "",
        quantity: purchase.quantity?.toString() || "",
        gear_type: purchase.gear_type || "",
        trip_start_date: purchase.trip_start_date || "",
        trip_end_date: purchase.trip_end_date || "",
        landing_date: purchase.landing_date || "",
        notes: purchase.notes || "",
      });
    } else {
      setFormData({
        supplier_id: "",
        vessel_id: "",
        product_id: "",
        fishing_zone_id: "",
        quantity: "",
        gear_type: "",
        trip_start_date: "",
        trip_end_date: "",
        landing_date: "",
        notes: "",
      });
    }
  }, [purchase, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      quantity: parseFloat(formData.quantity),
    };

    const { error } = purchase
      ? await supabase.from("purchases").update(submitData).eq("id", purchase.id)
      : await supabase.from("purchases").insert([submitData]);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Purchase ${purchase ? "updated" : "recorded"} successfully`,
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{purchase ? "Edit" : "Record"} Purchase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier_id">Supplier *</Label>
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
              <Label htmlFor="vessel_id">Vessel *</Label>
              <Select value={formData.vessel_id} onValueChange={(value) => setFormData({ ...formData, vessel_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vessel" />
                </SelectTrigger>
                <SelectContent>
                  {vessels.map((vessel) => (
                    <SelectItem key={vessel.id} value={vessel.id}>
                      {vessel.registration_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_id">Product *</Label>
              <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.species}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fishing_zone_id">Fishing Zone *</Label>
              <Select value={formData.fishing_zone_id} onValueChange={(value) => setFormData({ ...formData, fishing_zone_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gear_type">Gear Type</Label>
              <Input
                id="gear_type"
                value={formData.gear_type}
                onChange={(e) => setFormData({ ...formData, gear_type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip_start_date">Trip Start Date *</Label>
              <Input
                id="trip_start_date"
                type="date"
                value={formData.trip_start_date}
                onChange={(e) => setFormData({ ...formData, trip_start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trip_end_date">Trip End Date *</Label>
              <Input
                id="trip_end_date"
                type="date"
                value={formData.trip_end_date}
                onChange={(e) => setFormData({ ...formData, trip_end_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="landing_date">Landing Date *</Label>
              <Input
                id="landing_date"
                type="date"
                value={formData.landing_date}
                onChange={(e) => setFormData({ ...formData, landing_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {purchase ? "Update" : "Record"} Purchase
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};