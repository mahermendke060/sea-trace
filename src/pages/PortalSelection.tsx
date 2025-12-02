import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ship, Scale, ArrowRight } from "lucide-react";

export default function PortalSelection() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-2">Seafood Supply Chain</h1>
          <p className="text-white/70">Select your portal to continue</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/seachain-tracker">
            <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-blue-400">
              <CardHeader className="text-center">
                <div className="mx-auto bg-blue-100 p-4 rounded-full w-fit mb-4">
                  <Ship className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">SeaChain Tracker</CardTitle>
                <CardDescription>
                  Harvester & Wharf Buyer Portal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Track vessel purchases</li>
                  <li>• Manage fishing zones</li>
                  <li>• Record sales to distributors</li>
                  <li>• Full supply chain traceability</li>
                </ul>
                <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
                  Enter SeaChain
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link to="/distributor">
            <Card className="h-full hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer border-2 border-transparent hover:border-emerald-400">
              <CardHeader className="text-center">
                <div className="mx-auto bg-emerald-100 p-4 rounded-full w-fit mb-4">
                  <Scale className="h-12 w-12 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl">Distributor Portal</CardTitle>
                <CardDescription>
                  Grading & Distribution Management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Receive synced purchases</li>
                  <li>• Grade & sort products</li>
                  <li>• Sell to downstream customers</li>
                  <li>• Full chain-of-custody tracking</li>
                </ul>
                <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                  Enter Distributor
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}