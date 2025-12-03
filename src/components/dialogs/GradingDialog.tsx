import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertCircle, TrendingDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";

interface GradingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grading?: any;
  onSuccess: () => void;
}

export const GradingDialog = ({ open, onOpenChange, grading, onSuccess }: GradingDialogProps) => {
  const { toast } = useToast();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);
  const [gradeItems, setGradeItems] = useState<any[]>([{ grade: "", quantity: "", percentage: "" }]);
  const [gradedBy, setGradedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [gradedOn, setGradedOn] = useState(new Date().toISOString().split("T")[0]);
  const [numCrates, setNumCrates] = useState("");
  const [weightPerCrate, setWeightPerCrate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const [purchasesData, gradesData] = await Promise.all([
        supabase
          .from("purchases")
          .select(`
            *,
            products(id, species, unit_of_measurement),
            vessels(registration_number),
            suppliers(name)
          `)
          .eq("is_downstream_purchase", true)
          .order("landing_date", { ascending: false }),
        supabase
          .from("grades")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);
      setPurchases(purchasesData.data || []);
      setGrades(gradesData.data || []);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!open) {
      setSelectedPurchase(null);
      setGradeItems([{ grade: "", quantity: "", percentage: "" }]);
      setGradedBy("");
      setNotes("");
      setGradedOn(new Date().toISOString().split("T")[0]);
      setNumCrates("");
      setWeightPerCrate("");
    }
  }, [open]);

  // Calculate total weight from crates
  const calculatedTotalWeight = numCrates && weightPerCrate 
    ? parseFloat(numCrates) * parseFloat(weightPerCrate) 
    : 0;
  
  const totalWeight = selectedPurchase?.purchase_quantity || selectedPurchase?.quantity || calculatedTotalWeight;
  
  // Calculate grade totals
  const totalGradedWeight = gradeItems.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
  const totalGradedPercentage = gradeItems.reduce((sum, item) => sum + (parseFloat(item.percentage) || 0), 0);
  
  // Calculate shrinkage
  const shrinkagePercentage = Math.max(0, 100 - totalGradedPercentage);
  const shrinkageWeight = totalWeight > 0 ? (shrinkagePercentage / 100) * totalWeight : 0;

  // Handle quantity change - recalculate percentage
  const handleQuantityChange = (index: number, quantity: string) => {
    const newItems = [...gradeItems];
    newItems[index] = {
      ...newItems[index],
      quantity,
      percentage: totalWeight > 0 && quantity
        ? ((parseFloat(quantity) / totalWeight) * 100).toFixed(2)
        : "",
    };
    setGradeItems(newItems);
  };

  // Handle percentage change - recalculate quantity
  const handlePercentageChange = (index: number, percentage: string) => {
    const newItems = [...gradeItems];
    newItems[index] = {
      ...newItems[index],
      percentage,
      quantity: totalWeight > 0 && percentage
        ? ((parseFloat(percentage) / 100) * totalWeight).toFixed(2)
        : "",
    };
    setGradeItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totalGradedPercentage > 100) {
      toast({
        title: "Validation Error",
        description: "Total grade percentages cannot exceed 100%",
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
        percentage_of_purchase: parseFloat(item.percentage) || null,
        graded_by: gradedBy || null,
        graded_at: gradedOn,
        purchased_on: selectedPurchase.landing_date,
        num_crates: numCrates ? parseFloat(numCrates) : null,
        weight_per_crate: weightPerCrate ? parseFloat(weightPerCrate) : null,
        total_weight: totalWeight,
        shrinkage_weight: shrinkageWeight > 0 ? shrinkageWeight : null,
        shrinkage_percentage: shrinkagePercentage > 0 ? shrinkagePercentage : null,
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
    setGradeItems([...gradeItems, { grade: "", quantity: "", percentage: "" }]);
  };

  const removeGradeItem = (index: number) => {
    setGradeItems(gradeItems.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade Products</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Purchase Selection */}
          <div className="space-y-2">
            <Label>Select Purchase to Grade *</Label>
            <Select 
              value={selectedPurchase?.id || ""} 
              onValueChange={(value) => {
                const purchase = purchases.find(p => p.id === value);
                setSelectedPurchase(purchase);
                if (purchase?.num_crates) setNumCrates(purchase.num_crates.toString());
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a purchase" />
              </SelectTrigger>
              <SelectContent>
                {purchases.map((purchase) => (
                  <SelectItem key={purchase.id} value={purchase.id}>
                    {purchase.vessels?.registration_number} - {purchase.products?.species} 
                    ({purchase.purchase_quantity || purchase.quantity} {purchase.products?.unit_of_measurement}) 
                    - {purchase.suppliers?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPurchase && (
            <>
              {/* Purchase Details */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-xs text-muted-foreground">Purchased From</Label>
                  <p className="font-medium">{selectedPurchase.suppliers?.name || "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Purchased On</Label>
                  <p className="font-medium">{selectedPurchase.landing_date ? format(new Date(selectedPurchase.landing_date), "MMM dd, yyyy") : "-"}</p>
                </div>
              </div>

              {/* Grading Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graded_on">Graded On *</Label>
                  <Input
                    id="graded_on"
                    type="date"
                    value={gradedOn}
                    onChange={(e) => setGradedOn(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="num_crates">Number of Crates</Label>
                  <Input
                    id="num_crates"
                    type="number"
                    step="1"
                    value={numCrates}
                    onChange={(e) => setNumCrates(e.target.value)}
                    placeholder="# of crates"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight_per_crate">Weight per Crate ({selectedPurchase.products?.unit_of_measurement})</Label>
                  <Input
                    id="weight_per_crate"
                    type="number"
                    step="0.01"
                    value={weightPerCrate}
                    onChange={(e) => setWeightPerCrate(e.target.value)}
                    placeholder="Weight/crate"
                  />
                </div>
              </div>

              {/* Grade Breakdown */}
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
                    <div className="col-span-5 space-y-2">
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
                          {grades.map((grade) => (
                            <SelectItem key={grade.code} value={grade.code}>
                              <div>
                                <span className="font-medium">{grade.name}</span>
                                <span className="text-muted-foreground ml-2 text-xs">({grade.description})</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3 space-y-2">
                      <Label className="text-xs">Weight ({selectedPurchase.products?.unit_of_measurement}) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs">% of Purchase</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.percentage}
                        onChange={(e) => handlePercentageChange(index, e.target.value)}
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

                {/* Total Weight Display */}
                <div className="flex justify-end items-center gap-4 text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Total Graded:</span>
                  <span className="font-semibold">{totalGradedWeight.toFixed(2)} {selectedPurchase.products?.unit_of_measurement}</span>
                  <span className="text-muted-foreground">({totalGradedPercentage.toFixed(2)}%)</span>
                </div>
              </div>

              {/* Shrinkage Card */}
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                    Shrinkage
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Shrinkage Weight</Label>
                      <p className="text-lg font-semibold text-amber-700">
                        {shrinkageWeight.toFixed(2)} {selectedPurchase.products?.unit_of_measurement}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Shrinkage Percentage</Label>
                      <p className="text-lg font-semibold text-amber-700">
                        {shrinkagePercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Shrinkage is calculated as the remaining weight/percentage after all grades are summed.
                  </p>
                </CardContent>
              </Card>

              {/* Grader Info */}
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

              {/* Notes */}
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
            <Button 
              type="submit" 
              disabled={!selectedPurchase || totalGradedPercentage > 100} 
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Save Grading
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};