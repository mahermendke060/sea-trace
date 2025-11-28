import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";

export default function Traceability() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Traceability</h1>
        <p className="text-muted-foreground mt-1">Track products through the entire supply chain</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Chain of Custody Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Generate full traceability reports from vessel to end customer. Coming soon: Search by vessel, product, or transaction.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}