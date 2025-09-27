import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth Context
import { AuthProvider } from "@/contexts/AuthContext";

// Public pages
import Home from "./pages/Home";
import About from "./pages/About";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";

// Auth pages
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// Protected pages
import Dashboard from "./pages/Dashboard";
import TestReports from "./pages/TestReports";
import MonthlySummaries from "./pages/MonthlySummaries";
import ChainageBarChart from "./pages/ChainageBarChart";
import Approvals from "./pages/Approvals";
import Documents from "./pages/Documents";

// Layouts
import { PublicLayout } from "./layouts/PublicLayout";
import { AppLayout } from "./layouts/AppLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes with public layout */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
            <Route path="/pricing" element={<PublicLayout><Pricing /></PublicLayout>} />
            <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
            
            {/* Auth routes without layout */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected routes with app layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/test-reports" element={
            <ProtectedRoute>
              <AppLayout>
                <TestReports />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/monthly-summaries" element={
            <ProtectedRoute>
              <AppLayout>
                <MonthlySummaries />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/barchart" element={
            <ProtectedRoute>
              <AppLayout>
                <ChainageBarChart />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/barchart/:projectId" element={
            <ProtectedRoute>
              <AppLayout>
                <ChainageBarChart />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/approvals" element={
            <ProtectedRoute>
              <AppLayout>
                <Approvals />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/documents" element={
            <ProtectedRoute>
              <AppLayout>
                <Documents />
              </AppLayout>
            </ProtectedRoute>
          } />
          
            {/* 404 page */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
