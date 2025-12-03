import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Grade {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function GradeManagement() {
  const { toast } = useToast();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    is_active: true,
  });

  const fetchGrades = async () => {
    const { data } = await supabase
      .from("grades")
      .select("*")
      .order("sort_order", { ascending: true });
    setGrades(data || []);
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  useEffect(() => {
    if (selectedGrade) {
      setFormData({
        name: selectedGrade.name,
        code: selectedGrade.code,
        description: selectedGrade.description || "",
        is_active: selectedGrade.is_active,
      });
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        is_active: true,
      });
    }
  }, [selectedGrade, dialogOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      name: formData.name,
      code: formData.code.toLowerCase().replace(/\s+/g, "_"),
      description: formData.description || null,
      is_active: formData.is_active,
      sort_order: selectedGrade ? selectedGrade.sort_order : grades.length + 1,
    };

    const { error } = selectedGrade
      ? await supabase.from("grades").update(submitData).eq("id", selectedGrade.id)
      : await supabase.from("grades").insert([submitData]);

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
      description: `Grade ${selectedGrade ? "updated" : "created"} successfully`,
    });
    fetchGrades();
    setDialogOpen(false);
    setSelectedGrade(null);
  };

  const handleDelete = async (grade: Grade) => {
    if (!confirm(`Are you sure you want to delete "${grade.name}"?`)) return;

    const { error } = await supabase.from("grades").delete().eq("id", grade.id);

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
      description: "Grade deleted successfully",
    });
    fetchGrades();
  };

  const toggleActive = async (grade: Grade) => {
    const { error } = await supabase
      .from("grades")
      .update({ is_active: !grade.is_active })
      .eq("id", grade.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    fetchGrades();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Grade Management</h1>
          <p className="text-muted-foreground mt-1">
            Define and manage seafood grades used in sorting and grading
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedGrade(null);
            setDialogOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Grade
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Seafood Grades</CardTitle>
          <CardDescription>
            These grades are used when sorting and grading products in the Grading section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.map((grade, index) => (
                <TableRow key={grade.id}>
                  <TableCell className="text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </TableCell>
                  <TableCell className="font-medium">{grade.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {grade.code}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {grade.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={grade.is_active ? "default" : "secondary"}
                      className={grade.is_active ? "bg-emerald-600" : ""}
                    >
                      {grade.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(grade)}
                      >
                        <Switch checked={grade.is_active} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedGrade(grade);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(grade)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {grades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No grades defined. Add your first grade to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedGrade ? "Edit" : "Add"} Grade
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Grade Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Jumbo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Grade Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., jumbo"
                required
              />
              <p className="text-xs text-muted-foreground">
                Used internally for identification. Will be converted to lowercase with underscores.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., 2+ lbs weight"
                rows={2}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Active</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedGrade ? "Update" : "Create"} Grade
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}