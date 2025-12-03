import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Scale, ShoppingCart } from "lucide-react";

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

export default function DistributorPortal() {
  const { distributorName } = useParams<{ distributorName: string }>();
  const [distributor, setDistributor] = useState<any>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [gradings, setGradings] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDistributorData = async () => {
      if (!distributorName) return;

      // Find distributor by name (URL-friendly format)
      const formattedName = distributorName.replace(/_/g, " ");
      const { data: customerData } = await supabase
        .from("customers")
        .select("*")
        .ilike("name", formattedName)
        .single();

      if (!customerData) {
        setLoading(false);
        return;
      }

      setDistributor(customerData);

      // Fetch purchases where this distributor is the downstream customer
      const { data: purchasesData } = await supabase
        .from("purchases")
        .select(`
          *,
          products(species, unit_of_measurement),
          vessels(registration_number),
          suppliers(name)
        `)
        .eq("downstream_customer_id", customerData.id)
        .order("landing_date", { ascending: false });

      setPurchases(purchasesData || []);

      // Fetch gradings related to these purchases
      const purchaseIds = (purchasesData || []).map(p => p.id);
      if (purchaseIds.length > 0) {
        const { data: gradingsData } = await supabase
          .from("grading")
          .select(`
            *,
            products(species, unit_of_measurement)
          `)
          .in("purchase_id", purchaseIds)
          .order("graded_at", { ascending: false });

        setGradings(gradingsData || []);
      }

      // Fetch sales where this distributor is the customer
      const { data: salesData } = await supabase
        .from("sales")
        .select(`
          *,
          suppliers(name),
          customers(name),
          sale_items(
            quantity,
            products(species, unit_of_measurement),
            grading(grade)
          )
        `)
        .eq("customer_id", customerData.id)
        .order("sale_date", { ascending: false });

      setSales(salesData || []);
      setLoading(false);
    };

    fetchDistributorData();
  }, [distributorName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!distributor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Distributor Not Found</h2>
            <p className="text-muted-foreground">
              No distributor found with the name "{distributorName?.replace(/_/g, " ")}"
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const purchaseColumns = [
    { header: "Date", accessor: (row: any) => format(new Date(row.landing_date), "MMM dd, yyyy") },
    { header: "Vessel", accessor: (row: any) => row.vessels?.registration_number || "-" },
    { header: "Product", accessor: (row: any) => row.products?.species || "-" },
    { header: "Quantity", accessor: (row: any) => `${row.purchase_quantity || row.quantity} ${row.products?.unit_of_measurement || ""}` },
    { header: "From", accessor: (row: any) => row.suppliers?.name || "-" },
  ];

  const gradingColumns = [
    { header: "Graded On", accessor: (row: any) => format(new Date(row.graded_at), "MMM dd, yyyy") },
    { header: "Product", accessor: (row: any) => row.products?.species || "-" },
    { 
      header: "Grade", 
      accessor: (row: any) => (
        <Badge variant="outline">{gradeLabels[row.grade] || row.grade}</Badge>
      )
    },
    { header: "Quantity", accessor: (row: any) => `${row.quantity} ${row.products?.unit_of_measurement || ""}` },
    { header: "Available", accessor: (row: any) => `${row.available_quantity} ${row.products?.unit_of_measurement || ""}` },
  ];

  const salesColumns = [
    { header: "Date", accessor: (row: any) => format(new Date(row.sale_date), "MMM dd, yyyy") },
    { header: "Seller", accessor: (row: any) => row.suppliers?.name || "-" },
    { 
      header: "Items", 
      accessor: (row: any) => {
        const items = row.sale_items || [];
        return items.length > 0 
          ? items.map((item: any, idx: number) => (
              <div key={idx} className="text-sm">
                {item.quantity} {item.products?.unit_of_measurement} {item.products?.species}
                {item.grading?.grade && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    {gradeLabels[item.grading.grade] || item.grading.grade}
                  </Badge>
                )}
              </div>
            ))
          : "-";
      }
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Scale className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{distributor.name}</h1>
              <p className="text-sm text-white/80">Distributor Portal</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <ShoppingCart className="h-10 w-10 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{purchases.length}</p>
                <p className="text-sm text-muted-foreground">Purchases</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <Package className="h-10 w-10 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{gradings.length}</p>
                <p className="text-sm text-muted-foreground">Graded Batches</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 py-4">
              <TrendingUp className="h-10 w-10 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{sales.length}</p>
                <p className="text-sm text-muted-foreground">Sales Received</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchases */}
        <Card>
          <CardHeader>
            <CardTitle>Purchases (Received from SeaChain)</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={purchaseColumns} data={purchases} />
          </CardContent>
        </Card>

        {/* Gradings */}
        <Card>
          <CardHeader>
            <CardTitle>Graded Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={gradingColumns} data={gradings} />
          </CardContent>
        </Card>

        {/* Sales Received */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Received</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={salesColumns} data={sales} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
