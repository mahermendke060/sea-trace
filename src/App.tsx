import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { DistributorLayout } from "@/components/DistributorLayout";

// Portal Selection
import PortalSelection from "./pages/PortalSelection";

// SeaChain Tracker Pages
import Dashboard from "./pages/Dashboard";
import Suppliers from "./pages/Suppliers";
import Vessels from "./pages/Vessels";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import Locations from "./pages/Locations";
import FishingZones from "./pages/FishingZones";
import Purchases from "./pages/Purchases";
import Sales from "./pages/Sales";
import Traceability from "./pages/Traceability";

// Distributor Pages
import DistributorDashboard from "./pages/distributor/Dashboard";
import DistributorPurchases from "./pages/distributor/Purchases";
import DistributorGrading from "./pages/distributor/Grading";
import DistributorSales from "./pages/distributor/Sales";
import DistributorTraceability from "./pages/distributor/Traceability";
import DistributorSuppliers from "./pages/distributor/Suppliers";
import DistributorVessels from "./pages/distributor/Vessels";
import DistributorProducts from "./pages/distributor/Products";
import DistributorCustomers from "./pages/distributor/Customers";
import DistributorLocations from "./pages/distributor/Locations";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Portal Selection */}
          <Route path="/" element={<PortalSelection />} />

          {/* SeaChain Tracker Routes */}
          <Route path="/seachain-tracker" element={<Layout><Dashboard /></Layout>} />
          <Route path="/seachain-tracker/suppliers" element={<Layout><Suppliers /></Layout>} />
          <Route path="/seachain-tracker/vessels" element={<Layout><Vessels /></Layout>} />
          <Route path="/seachain-tracker/products" element={<Layout><Products /></Layout>} />
          <Route path="/seachain-tracker/customers" element={<Layout><Customers /></Layout>} />
          <Route path="/seachain-tracker/locations" element={<Layout><Locations /></Layout>} />
          <Route path="/seachain-tracker/fishing-zones" element={<Layout><FishingZones /></Layout>} />
          <Route path="/seachain-tracker/purchases" element={<Layout><Purchases /></Layout>} />
          <Route path="/seachain-tracker/sales" element={<Layout><Sales /></Layout>} />
          <Route path="/seachain-tracker/traceability" element={<Layout><Traceability /></Layout>} />

          {/* Legacy routes redirect to seachain-tracker */}
          <Route path="/suppliers" element={<Navigate to="/seachain-tracker/suppliers" replace />} />
          <Route path="/vessels" element={<Navigate to="/seachain-tracker/vessels" replace />} />
          <Route path="/products" element={<Navigate to="/seachain-tracker/products" replace />} />
          <Route path="/customers" element={<Navigate to="/seachain-tracker/customers" replace />} />
          <Route path="/locations" element={<Navigate to="/seachain-tracker/locations" replace />} />
          <Route path="/fishing-zones" element={<Navigate to="/seachain-tracker/fishing-zones" replace />} />
          <Route path="/purchases" element={<Navigate to="/seachain-tracker/purchases" replace />} />
          <Route path="/sales" element={<Navigate to="/seachain-tracker/sales" replace />} />
          <Route path="/traceability" element={<Navigate to="/seachain-tracker/traceability" replace />} />

          {/* Distributor Portal Routes */}
          <Route path="/distributor" element={<DistributorLayout><DistributorDashboard /></DistributorLayout>} />
          <Route path="/distributor/purchases" element={<DistributorLayout><DistributorPurchases /></DistributorLayout>} />
          <Route path="/distributor/grading" element={<DistributorLayout><DistributorGrading /></DistributorLayout>} />
          <Route path="/distributor/sales" element={<DistributorLayout><DistributorSales /></DistributorLayout>} />
          <Route path="/distributor/traceability" element={<DistributorLayout><DistributorTraceability /></DistributorLayout>} />
          <Route path="/distributor/suppliers" element={<DistributorLayout><DistributorSuppliers /></DistributorLayout>} />
          <Route path="/distributor/vessels" element={<DistributorLayout><DistributorVessels /></DistributorLayout>} />
          <Route path="/distributor/products" element={<DistributorLayout><DistributorProducts /></DistributorLayout>} />
          <Route path="/distributor/customers" element={<DistributorLayout><DistributorCustomers /></DistributorLayout>} />
          <Route path="/distributor/locations" element={<DistributorLayout><DistributorLocations /></DistributorLayout>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;