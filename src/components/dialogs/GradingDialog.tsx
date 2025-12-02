import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grading?: any;
  onSuccess: () => void;
}

const GRADES = [
  { value: "culls", label: "Culls", description: "Missing claws or damaged" },
  { value: "selects", label: "Selects", description: "Premium quality" },
  { value: "chicks", label: "Chicks", description: "1-1.25 lbs" },
  { value: "quarters", label: "Quarters", description: "1.25-1.5 lbs" },
  { value: "halves", label: "Halves", description: "1.5-2 lbs" },
  { value: "jumbo", label: "Jumbo", description: "2+ lbs" },
  { value: "soft_shell", label: "Soft Shell", description: "Recently molted" },
  { value: "hard_shell", label: "Hard Shell", description: "Full shell" },
];

export const GradingDialog = ({ open, onOpenChange, grading, onSuccess }: GradingDialogProps) => {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [gradeItems, setGradeItems] = useState<any[]>([{ grade: "", quantity: "" }]);
  const [gradedBy, setGradedBy] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchPurchases = async () => {
      const { data } = await supabase
        .from("purchases")
        .select(`
          *,
          products(id, species, unit_of_measurement),
          vessels(registration_number),
          suppliers(name)
        `)
        .eq("is_downstream_purchase", true)
        .order("landing_date", { ascending: false });
      setPurchases(data || []);
    };
    fetchPurchases();
  }, []);

  useEffect(() => {
    if (!open) {
      setSelectedPurchase(null);
      setGradeItems([{ grade: "", quantity: "" }]);
      setGradedBy("");
      setNotes("");
    }
  }, [open]);

  const totalGraded = gradeItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const purchaseQty = selectedPurchase?.quantity || 0;
  const isValid = totalGraded === purchaseQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast({
        title: "Validation Error",
        description: `Total graded quantity (${totalGraded}) must equal purchase quantity (${purchaseQty})`,
        variant: "destructive",
      });
      return;
    }

    const gradingRecords = gradeItems
      .filter(item => item.grade && parseFloat(item.quantity) > 0)
      .map(item => ({
        purchase_id: selectedPurchase.id,
        product_id: selectedPurchase.product_id,
        grade: item.grade,
        quantity: parseFloat(item.quantity),
        available_quantity: parseFloat(item.quantity),
        graded_by: gradedBy || null,
        notes: notes || null,
      }));

    const { error } = await supabase.from("grading").insert(gradingRecords);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Products graded successfully",
    });
    onSuccess();
    onOpenChange(false);
  };

  const addGradeItem = () => {
    setGradeItems([...gradeItems, { grade: "", quantity: "" }]);
  };

  const removeGradeItem = (index: number) => {
    setGradeItems(gradeItems.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade Products</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Purchase to Grade *</Label>
            <Select 
              value={selectedPurchase?.id || ""} 
              onValueChange={(value) => {
                const purchase = purchases.find(p => p.id === value);
                setSelectedPurchase(purchase);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a purchase" />
              </SelectTrigger>
              <SelectContent>
                {purchases.map((purchase) => (
                  <SelectItem key={purchase.id} value={purchase.id}>
                    {purchase.vessels?.registration_number} - {purchase.products?.species} 
                    ({purchase.quantity} {purchase.products?.unit_of_measurement}) 
                    - {purchase.suppliers?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPurchase && (
            <>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Total graded quantity must equal <strong>{purchaseQty} {selectedPurchase.products?.unit_of_measurement}</strong>. 
                  Current total: <strong className={isValid ? "text-emerald-600" : "text-destructive"}>{totalGraded}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Grade Breakdown</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addGradeItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Grade
                  </Button>
                </div>

                {gradeItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end border p-3 rounded">
                    <div className="col-span-6 space-y-2">
                      <Label className="text-xs">Grade *</Label>
                      <Select 
                        value={item.grade} 
                        onValueChange={(value) => {
                          const newItems = [...gradeItems];
                          newItems[index].grade = value;
                          setGradeItems(newItems);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRADES.map((grade) => (
                            <SelectItem key={grade.value} value={grade.value}>
                              <div>
                                <span className="font-medium">{grade.label}</span>
                                <span className="text-muted-foreground ml-2 text-xs">({grade.description})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4 space-y-2">
                      <Label className="text-xs">Quantity ({selectedPurchase.products?.unit_of_measurement}) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...gradeItems];
                          newItems[index].quantity = e.target.value;
                          setGradeItems(newItems);
                        }}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      {gradeItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGradeItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graded_by">Graded By</Label>
                  <Input
                    id="graded_by"
                    value={gradedBy}
                    onChange={(e) => setGradedBy(e.target.value)}
                    placeholder="Name of person grading"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedPurchase || !isValid} className="bg-emerald-600 hover:bg-emerald-700">
              Save Grading
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};