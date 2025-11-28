import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Suppliers from "./pages/Suppliers";
import Vessels from "./pages/Vessels";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Locations from "./pages/Locations";
import FishingZones from "./pages/FishingZones";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Traceability from "./pages/Traceability";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
          <Route path="/vessels" element={<Layout><Vessels /></Layout>} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/customers" element={<Layout><Customers /></Layout>} />
          <Route path="/locations" element={<Layout><Locations /></Layout>} />
          <Route path="/fishing-zones" element={<Layout><FishingZones /></Layout>} />
          <Route path="/purchases" element={<Layout><Purchases /></Layout>} />
          <Route path="/sales" element={<Layout><Sales /></Layout>} />
          <Route path="/traceability" element={<Layout><Traceability /></Layout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
