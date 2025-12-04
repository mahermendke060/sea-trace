import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";

interface SaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: any;
  onSuccess: () => void;
}

export const SaleDialog = ({ open, onOpenChange, sale, onSuccess }: SaleDialogProps) => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    sale_date: "",
    notes: "",
  });
  const [saleItems, setSaleItems] = useState<any[]>([
    {
      purchase_id: "",
      quantity: "",
      percentage_used: "",
      num_crates: "",
      num_crates_manual: false,
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      const [suppliersData, customersData, purchasesData] = await Promise.all([
        supabase.from("suppliers").select("*"),
        supabase.from("customers").select("*"),
        supabase
          .from("purchases")
          .select("*, products(species, unit_of_measurement), vessels(registration_number), suppliers(name)")
          .gt("remaining_quantity", 0),
      ]);
      setSuppliers(suppliersData.data || []);
      setCustomers(customersData.data || []);
      const list = (purchasesData.data || [])
        .sort((a: any, b: any) => new Date(a.landing_date).getTime() - new Date(b.landing_date).getTime())
        .map((p: any, idx: number) => ({ ...p, _seq: idx + 1 }));
      setPurchases(list);
    };
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (sale) {
      setFormData({
        customer_id: sale.customer_id || "",
        sale_date: sale.sale_date || "",
        notes: sale.notes || "",
      });
    } else {
      setFormData({
        customer_id: "",
        sale_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setSaleItems([
        {
          purchase_id: "",
          quantity: "",
          percentage_used: "",
          num_crates: "",
          num_crates_manual: false,
        },
      ]);
    }
  }, [sale, open]);

  // Handle purchase selection - auto-populate num_crates
  const handlePurchaseChange = (index: number, purchaseId: string) => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    const newItems = [...saleItems];
    newItems[index] = {
      ...newItems[index],
      purchase_id: purchaseId,
      num_crates: purchase?.num_crates?.toString() || "",
    };
    setSaleItems(newItems);
  };

  // Handle quantity change - recalculate percentage
  const handleQuantityChange = (index: number, quantity: string) => {
    const newItems = [...saleItems];
    const item = newItems[index];
    const purchase = purchases.find((p) => p.id === item.purchase_id);
    const baseQty = purchase?.remaining_quantity || purchase?.purchase_quantity || purchase?.quantity || 0;

    // Subtract any quantities already allocated in other rows for the same purchase
    const allocatedElsewhere = saleItems
      .filter((si, i) => i !== index && si.purchase_id === item.purchase_id && si.quantity)
      .reduce((sum, si) => sum + (parseFloat(si.quantity) || 0), 0);
    const purchaseQty = Math.max(0, baseQty - allocatedElsewhere);

    const n = parseFloat(quantity);
    const autoCrates = !item.num_crates_manual && !isNaN(n) ? Math.round(n / 30) : undefined;
    newItems[index] = {
      ...item,
      quantity,
      percentage_used: purchaseQty > 0 && quantity
        ? ((parseFloat(quantity) / purchaseQty) * 100).toFixed(2)
        : "",
      num_crates: autoCrates !== undefined ? String(autoCrates) : item.num_crates,
    };
    setSaleItems(newItems);
  };

  // Handle percentage change - recalculate quantity
  const handlePercentageChange = (index: number, percentage: string) => {
    const newItems = [...saleItems];
    const item = newItems[index];
    const purchase = purchases.find((p) => p.id === item.purchase_id);
    const baseQty = purchase?.remaining_quantity || purchase?.purchase_quantity || purchase?.quantity || 0;

    const allocatedElsewhere = saleItems
      .filter((si, i) => i !== index && si.purchase_id === item.purchase_id && si.quantity)
      .reduce((sum, si) => sum + (parseFloat(si.quantity) || 0), 0);
    const purchaseQty = Math.max(0, baseQty - allocatedElsewhere);

    const computedQty = purchaseQty > 0 && percentage
      ? ((parseFloat(percentage) / 100) * purchaseQty).toFixed(2)
      : "";
    const n = parseFloat(computedQty);
    const autoCrates = !item.num_crates_manual && !isNaN(n) ? Math.round(n / 30) : undefined;
    newItems[index] = {
      ...item,
      percentage_used: percentage,
      quantity: computedQty,
      num_crates: autoCrates !== undefined ? String(autoCrates) : item.num_crates,
    };
    setSaleItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get seller_id from the first purchase's supplier
    const firstPurchase = purchases.find((p) => p.id === saleItems[0]?.purchase_id);
    const salePayload = {
      ...formData,
      seller_id: firstPurchase?.supplier_id,
    };

    const { data: saleData, error: saleError } = sale
      ? await supabase.from("sales").update(salePayload).eq("id", sale.id).select().single()
      : await supabase.from("sales").insert([salePayload]).select().single();

    if (saleError) {
      toast({
        title: "Error",
        description: saleError.message,
        variant: "destructive",
      });
      return;
    }

    // Insert sale items and update purchase remaining quantities
    for (const item of saleItems) {
      if (!item.purchase_id || !item.quantity) continue;

      const purchase = purchases.find((p) => p.id === item.purchase_id);
      const soldQty = parseFloat(item.quantity);

      // Insert sale item
      const { error: itemsError } = await supabase.from("sale_items").insert({
        sale_id: saleData.id,
        purchase_id: item.purchase_id,
        product_id: purchase?.product_id,
        quantity: soldQty,
        percentage_used: item.percentage_used ? parseFloat(item.percentage_used) : null,
      });

      if (itemsError) {
        toast({
          title: "Error",
          description: itemsError.message,
          variant: "destructive",
        });
        return;
      }

      // Update remaining quantity on purchase
      const currentRemaining = purchase?.remaining_quantity || purchase?.purchase_quantity || purchase?.quantity || 0;
      const newRemaining = Math.max(0, currentRemaining - soldQty);

      await supabase
        .from("purchases")
        .update({ remaining_quantity: newRemaining })
        .eq("id", item.purchase_id);
    }

    toast({
      title: "Success",
      description: `Sale ${sale ? "updated" : "recorded"} successfully`,
    });
    onSuccess();
    onOpenChange(false);
  };

  const addItem = () => {
    setSaleItems([
      ...saleItems,
      {
        purchase_id: "",
        quantity: "",
        percentage_used: "",
        num_crates: "",
        num_crates_manual: false,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sale ? "Edit" : "Record"} Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_date">Sale Date *</Label>
              <Input
                id="sale_date"
                type="date"
                value={formData.sale_date}
                onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex justify-between items-center">
              <Label className="text-base">Sale Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            {saleItems.map((item, index) => {
              const selectedPurchase = purchases.find((p) => p.id === item.purchase_id);
              const baseAvail = selectedPurchase?.remaining_quantity || selectedPurchase?.purchase_quantity || selectedPurchase?.quantity || 0;
              const allocatedElsewhere = saleItems
                .filter((si, i) => i !== index && si.purchase_id === item.purchase_id && si.quantity)
                .reduce((sum, si) => sum + (parseFloat(si.quantity) || 0), 0);
              const availableQty = Math.max(0, baseAvail - allocatedElsewhere);

              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded">
                  <div className="col-span-4 space-y-2">
                    <Label className="text-xs">Purchase Source *</Label>
                    <Select
                      value={item.purchase_id}
                      onValueChange={(value) => handlePurchaseChange(index, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select purchase" />
                      </SelectTrigger>
                      <SelectContent>
                        {purchases
                          .filter((p) => {
                            const base = p.remaining_quantity ?? p.purchase_quantity ?? p.quantity ?? 0;
                            const allocated = saleItems
                              .filter((si, i) => si.purchase_id === p.id && i !== index && si.quantity)
                              .reduce((sum, si) => sum + (parseFloat(si.quantity) || 0), 0);
                            const dynRemaining = Math.max(0, base - allocated);
                            return dynRemaining > 0 && !p.is_downstream_purchase;
                          })
                          .map((purchase) => {
                            const base = purchase.remaining_quantity ?? purchase.purchase_quantity ?? purchase.quantity ?? 0;
                            const allocated = saleItems
                              .filter((si, i) => si.purchase_id === purchase.id && i !== index && si.quantity)
                              .reduce((sum, si) => sum + (parseFloat(si.quantity) || 0), 0);
                            const dynRemaining = Math.max(0, base - allocated);
                            return (
                              <SelectItem key={purchase.id} value={purchase.id}>
                                {format(new Date(purchase.landing_date), "MMM dd, yyyy")} · {`PO-${String(purchase._seq || 0).padStart(4, "0")}`} · {purchase.products?.species} ({dynRemaining} {purchase.products?.unit_of_measurement} avail.) · {purchase.suppliers?.name}{purchase.vessels?.registration_number ? ` - ${purchase.vessels.registration_number}` : ""}
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs">Sale Qty *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      max={availableQty}
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(index, e.target.value)}
                      required
                      placeholder="Qty"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs">% Used</Label>
                    <Input
                      type="number"
                      step="0.01"
                      max="100"
                      value={item.percentage_used}
                      onChange={(e) => handlePercentageChange(index, e.target.value)}
                      placeholder="%"
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label className="text-xs"># Crates</Label>
                    <Input
                      type="number"
                      step="1"
                      value={item.num_crates}
                      onChange={(e) => {
                        const newItems = [...saleItems];
                        newItems[index].num_crates = e.target.value;
                        newItems[index].num_crates_manual = true;
                        setSaleItems(newItems);
                      }}
                      placeholder="Crates"
                    />
                  </div>
                  <div className="col-span-1 text-xs text-muted-foreground">
                    {selectedPurchase && (
                      <span>Avail: {availableQty}</span>
                    )}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {sale ? "Update" : "Record"} Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};