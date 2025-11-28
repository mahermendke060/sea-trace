import { useState, useEffect } from "react";
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
    seller_id: "",
    customer_id: "",
    sale_date: "",
    notes: "",
  });
  const [saleItems, setSaleItems] = useState<any[]>([{
    purchase_id: "",
    quantity: "",
    percentage_used: "",
  }]);

  useEffect(() => {
    const fetchData = async () => {
      const [suppliersData, customersData, purchasesData] = await Promise.all([
        supabase.from("suppliers").select("*"),
        supabase.from("customers").select("*"),
        supabase.from("purchases").select("*, products(species, unit_of_measurement), vessels(registration_number)"),
      ]);
      setSuppliers(suppliersData.data || []);
      setCustomers(customersData.data || []);
      setPurchases(purchasesData.data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (sale) {
      setFormData({
        seller_id: sale.seller_id || "",
        customer_id: sale.customer_id || "",
        sale_date: sale.sale_date || "",
        notes: sale.notes || "",
      });
    } else {
      setFormData({
        seller_id: "",
        customer_id: "",
        sale_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setSaleItems([{ purchase_id: "", quantity: "", percentage_used: "" }]);
    }
  }, [sale, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: saleData, error: saleError } = sale
      ? await supabase.from("sales").update(formData).eq("id", sale.id).select().single()
      : await supabase.from("sales").insert([formData]).select().single();

    if (saleError) {
      toast({
        title: "Error",
        description: saleError.message,
        variant: "destructive",
      });
      return;
    }

    // Insert sale items
    const itemsToInsert = saleItems.map((item) => {
      const purchase = purchases.find((p) => p.id === item.purchase_id);
      return {
        sale_id: saleData.id,
        purchase_id: item.purchase_id,
        product_id: purchase?.product_id,
        quantity: parseFloat(item.quantity),
        percentage_used: item.percentage_used ? parseFloat(item.percentage_used) : null,
      };
    });

    const { error: itemsError } = await supabase.from("sale_items").insert(itemsToInsert);

    if (itemsError) {
      toast({
        title: "Error",
        description: itemsError.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `Sale ${sale ? "updated" : "recorded"} successfully`,
    });
    onSuccess();
    onOpenChange(false);
  };

  const addItem = () => {
    setSaleItems([...saleItems, { purchase_id: "", quantity: "", percentage_used: "" }]);
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sale ? "Edit" : "Record"} Sale</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seller_id">Seller *</Label>
              <Select value={formData.seller_id} onValueChange={(value) => setFormData({ ...formData, seller_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select seller" />
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
              <Label htmlFor="customer_id">Customer *</Label>
              <Select value={formData.customer_id} onValueChange={(value) => setFormData({ ...formData, customer_id: value })}>
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
            <div className="space-y-2 col-span-2">
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
            {saleItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded">
                <div className="col-span-5 space-y-2">
                  <Label className="text-xs">Purchase Source *</Label>
                  <Select 
                    value={item.purchase_id} 
                    onValueChange={(value) => {
                      const newItems = [...saleItems];
                      newItems[index].purchase_id = value;
                      setSaleItems(newItems);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purchase" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchases.map((purchase) => (
                        <SelectItem key={purchase.id} value={purchase.id}>
                          {purchase.vessels?.registration_number} - {purchase.products?.species} ({purchase.quantity} {purchase.products?.unit_of_measurement})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3 space-y-2">
                  <Label className="text-xs">Quantity *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...saleItems];
                      newItems[index].quantity = e.target.value;
                      setSaleItems(newItems);
                    }}
                    required
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label className="text-xs">% Used</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.percentage_used}
                    onChange={(e) => {
                      const newItems = [...saleItems];
                      newItems[index].percentage_used = e.target.value;
                      setSaleItems(newItems);
                    }}
                  />
                </div>
                <div className="col-span-1">
                  {saleItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
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