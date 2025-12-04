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
  const [numCratesAuto, setNumCratesAuto] = useState(true);
  const today = new Date().toISOString().slice(0, 10);
  const [purchaseQtyWarning, setPurchaseQtyWarning] = useState("");

  const [formData, setFormData] = useState({
    supplier_id: "",
    vessel_id: "",
    product_id: "",
    fishing_zone_id: "",
    harvest_quantity: "",
    purchase_quantity: "",
    num_crates: "",
    gear_type: "Trap/Pots",
    trip_start_date: "",
    trip_end_date: "",
    landing_date: today,
    notes: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [suppliersData, productsData, zonesData] = await Promise.all([
        supabase.from("suppliers").select("*"),
        supabase.from("products").select("*"),
        supabase.from("fishing_zones").select("*"),
      ]);
      setSuppliers(suppliersData.data || []);
      setProducts(productsData.data || []);
      setZones(zonesData.data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchVessels = async () => {
      if (!open) return;
      if (!formData.supplier_id) {
        setVessels([]);
        setFormData((prev) => ({ ...prev, vessel_id: "", gear_type: "Trap/Pots" }));
        return;
      }
      const { data } = await supabase
        .from("vessels")
        .select("*")
        .eq("supplier_id", formData.supplier_id);
      const list = data || [];
      setVessels(list);
      setFormData((prev) => ({
        ...prev,
        vessel_id: list.some((v) => v.id === prev.vessel_id) ? prev.vessel_id : "",
      }));
    };
    fetchVessels();
  }, [open, formData.supplier_id]);

  useEffect(() => {
    if (!formData.vessel_id) return;
    const v = vessels.find((x) => x.id === formData.vessel_id);
    if (v && v.gear_type && formData.gear_type !== v.gear_type) {
      setFormData((prev) => ({ ...prev, gear_type: v.gear_type }));
    }
  }, [formData.vessel_id, vessels]);

  useEffect(() => {
    if (purchase) {
      setFormData({
        supplier_id: purchase.supplier_id || "",
        vessel_id: purchase.vessel_id || "",
        product_id: purchase.product_id || "",
        fishing_zone_id: purchase.fishing_zone_id || "",
        harvest_quantity: purchase.harvest_quantity?.toString() || purchase.quantity?.toString() || "",
        purchase_quantity: purchase.purchase_quantity?.toString() || purchase.quantity?.toString() || "",
        num_crates: purchase.num_crates?.toString() || "",
        gear_type: purchase.gear_type || "Trap/Pots",
        trip_start_date: purchase.trip_start_date || "",
        trip_end_date: purchase.trip_end_date || "",
        landing_date: purchase.landing_date || today,
        notes: purchase.notes || "",
      });
      setNumCratesAuto(false);
      setPurchaseQtyWarning("");
    } else {
      setFormData({
        supplier_id: "",
        vessel_id: "",
        product_id: "",
        fishing_zone_id: "",
        harvest_quantity: "",
        purchase_quantity: "",
        num_crates: "",
        gear_type: "Trap/Pots",
        trip_start_date: "",
        trip_end_date: "",
        landing_date: today,
        notes: "",
      });
      setNumCratesAuto(true);
      setPurchaseQtyWarning("");
    }
  }, [purchase, open]);

  useEffect(() => {
    if (!numCratesAuto) return;
    const qty = parseFloat(formData.purchase_quantity);
    if (isNaN(qty)) {
      setFormData((prev) => ({ ...prev, num_crates: "" }));
      return;
    }
    const autoCrates = Math.round(qty / 30);
    setFormData((prev) => ({ ...prev, num_crates: autoCrates ? String(autoCrates) : "0" }));
  }, [formData.purchase_quantity, numCratesAuto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const purchaseQty = parseFloat(formData.purchase_quantity);
    const harvestQty = parseFloat(formData.harvest_quantity);
    if (!isNaN(purchaseQty) && !isNaN(harvestQty) && purchaseQty > harvestQty) {
      setPurchaseQtyWarning("Enter a valid purchase quantity less than or equal to harvest quantity.");
      return;
    }

    const submitData = {
      supplier_id: formData.supplier_id,
      vessel_id: formData.vessel_id,
      product_id: formData.product_id,
      fishing_zone_id: formData.fishing_zone_id,
      harvest_quantity: parseFloat(formData.harvest_quantity),
      purchase_quantity: purchaseQty,
      quantity: purchaseQty, 
      remaining_quantity: purchase ? purchase.remaining_quantity : purchaseQty,
      num_crates: formData.num_crates ? parseFloat(formData.num_crates) : null,
      gear_type: formData.gear_type || "Trap/Pots",
      trip_start_date: formData.trip_start_date,
      trip_end_date: formData.trip_end_date,
      landing_date: formData.landing_date,
      notes: formData.notes || null,
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
              <Select
                value={formData.vessel_id}
                onValueChange={(value) => setFormData({ ...formData, vessel_id: value })}
                disabled={!formData.supplier_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.supplier_id ? "Select vessel" : "Select supplier first"} />
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
              <Label htmlFor="harvest_quantity">Harvest Quantity *</Label>
              <Input
                id="harvest_quantity"
                type="number"
                step="0.01"
                value={formData.harvest_quantity}
                onChange={(e) => setFormData({ ...formData, harvest_quantity: e.target.value })}
                required
                placeholder="Total harvested"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_quantity">Purchase Quantity *</Label>
              <Input
                id="purchase_quantity"
                type="number"
                step="0.01"
                value={formData.purchase_quantity}
                onChange={(e) => {
                  const next = e.target.value;
                  setPurchaseQtyWarning("");
                  const h = parseFloat(formData.harvest_quantity);
                  const n = parseFloat(next);
                  if (!isNaN(h) && !isNaN(n) && n > h) {
                    setPurchaseQtyWarning("Enter a valid purchase quantity less than or equal to harvest quantity.");
                    return;
                  }
                  setFormData({ ...formData, purchase_quantity: next });
                }}
                required
                placeholder="Quantity purchased"
              />
              {purchaseQtyWarning && (
                <p className="text-xs text-amber-600">{purchaseQtyWarning}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="num_crates">Number of Crates Used</Label>
              <Input
                id="num_crates"
                type="number"
                step="1"
                value={formData.num_crates}
                onChange={(e) => {
                  setFormData({ ...formData, num_crates: e.target.value });
                  setNumCratesAuto(false);
                }}
                placeholder="Auto-calculated as Purchase Qty / 30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gear_type">Gear Type</Label>
              <Input id="gear_type" value={formData.gear_type} readOnly />
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