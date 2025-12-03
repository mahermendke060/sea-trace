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
import { Badge } from "@/components/ui/badge";

interface DistributorSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale?: any;
  onSuccess: () => void;
  distributorId?: string;
}

const gradeLabels: Record<string, string> = {
  culls: "Culls",
  selects: "Selects",
  chicks: "Chicks",
  quarters: "Quarters",
  halves: "Halves",
  jumbo: "Jumbo",
  soft_shell: "Soft Shell",
  hard_shell: "Hard Shell",
};

export const DistributorSaleDialog = ({ open, onOpenChange, sale, onSuccess, distributorId }: DistributorSaleDialogProps) => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [gradings, setGradings] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    sale_date: "",
    notes: "",
  });
  const [saleItems, setSaleItems] = useState<any[]>([{
    grading_id: "",
    quantity: "",
  }]);

  useEffect(() => {
    const fetchData = async () => {
      const [customersData, gradingsData] = await Promise.all([
        supabase.from("customers").select("*"),
        supabase.from("grading").select(`
          *,
          products(species, unit_of_measurement),
          purchases(vessels(registration_number), suppliers(id, name))
        `).gt("available_quantity", 0),
      ]);
      setCustomers(customersData.data || []);
      setGradings(gradingsData.data || []);
    };
    fetchData();
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
      setSaleItems([{ grading_id: "", quantity: "" }]);
    }
  }, [sale, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate quantities against available
    for (const item of saleItems) {
      const grading = gradings.find(g => g.id === item.grading_id);
      if (grading && parseFloat(item.quantity) > grading.available_quantity) {
        toast({
          title: "Validation Error",
          description: `Quantity exceeds available stock for ${gradeLabels[grading.grade]}`,
          variant: "destructive",
        });
        return;
      }
    }

    // Use first grading's purchase supplier as seller_id for record-keeping
    const firstGrading = gradings.find(g => g.id === saleItems[0]?.grading_id);
    const sellerId = distributorId || firstGrading?.purchases?.suppliers?.id || (firstGrading as any)?.purchases?.supplier_id;

    if (!sellerId) {
      toast({
        title: "Validation Error",
        description: "Unable to determine seller. Please ensure the graded item links to a purchase with a supplier.",
        variant: "destructive",
      });
      return;
    }

    const salePayload = {
      ...formData,
      seller_id: sellerId,
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

    // Insert sale items with grade reference
    const itemsToInsert = saleItems.map((item) => {
      const grading = gradings.find((g) => g.id === item.grading_id);
      return {
        sale_id: saleData.id,
        purchase_id: grading?.purchase_id,
        product_id: grading?.product_id,
        grade_id: item.grading_id,
        quantity: parseFloat(item.quantity),
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

    // Update available quantities in grading table
    for (const item of saleItems) {
      const grading = gradings.find(g => g.id === item.grading_id);
      if (grading) {
        await supabase
          .from("grading")
          .update({ available_quantity: grading.available_quantity - parseFloat(item.quantity) })
          .eq("id", item.grading_id);
      }
    }

    toast({
      title: "Success",
      description: `Sale ${sale ? "updated" : "recorded"} successfully`,
    });
    onSuccess();
    onOpenChange(false);
  };

  const addItem = () => {
    setSaleItems([...saleItems, { grading_id: "", quantity: "" }]);
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
              <Label className="text-base">Sale Items (from Graded Inventory)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            {saleItems.map((item, index) => {
              const selectedGrading = gradings.find(g => g.id === item.grading_id);
              return (
                <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded">
                  <div className="col-span-7 space-y-2">
                    <Label className="text-xs">Graded Product *</Label>
                    <Select 
                      value={item.grading_id} 
                      onValueChange={(value) => {
                        const newItems = [...saleItems];
                        newItems[index].grading_id = value;
                        setSaleItems(newItems);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select graded product" />
                      </SelectTrigger>
                      <SelectContent>
                        {gradings.map((grading) => (
                          <SelectItem key={grading.id} value={grading.id}>
                            <div className="flex items-center gap-2">
                              <span>{grading.products?.species}</span>
                              <Badge variant="outline" className="text-xs">
                                {gradeLabels[grading.grade]}
                              </Badge>
                              <span className="text-muted-foreground text-xs">
                                (Avail: {grading.available_quantity} {grading.products?.unit_of_measurement})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 space-y-2">
                    <Label className="text-xs">
                      Quantity {selectedGrading && `(max: ${selectedGrading.available_quantity})`} *
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      max={selectedGrading?.available_quantity}
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...saleItems];
                        newItems[index].quantity = e.target.value;
                        setSaleItems(newItems);
                      }}
                      required
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
              );
            })}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              {sale ? "Update" : "Record"} Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
