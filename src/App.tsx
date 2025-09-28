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
import Invite from "./pages/Invite";
import InviteAccept from "./pages/InviteAccept";

// Protected pages
import Dashboard from "./pages/Dashboard";
import TestReports from "./pages/TestReports";
import { Templates } from "./pages/Templates";
import { EnhancedReportEditor } from "./components/EnhancedReportEditor";
import MonthlySummaries from "./pages/MonthlySummaries";
import ChainageBarChart from "./pages/ChainageBarChart";
import Approvals from "./pages/Approvals";
import Documents from "./pages/Documents";
import Team from "./pages/Team";
import Projects from "./pages/Projects";
import ProjectEdit from "./pages/ProjectEdit";
import Analytics from "./pages/Analytics";
import Automation from "./pages/Automation";
import Mobile from "./pages/Mobile";
import Export from "./pages/Export";
import Subscription from "./pages/Subscription";
import SuperAdmin from "./pages/SuperAdmin";
import Companies from "./pages/Companies";

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
            <Route path="/invite/:token" element={<PublicLayout><Invite /></PublicLayout>} />
            <Route path="/accept-invitation" element={<InviteAccept />} />
            
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

          <Route path="/test-reports/new" element={
            <ProtectedRoute>
              <AppLayout>
                <TestReports />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/test-reports/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <EnhancedReportEditor />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/test-reports/:id/edit" element={
            <ProtectedRoute>
              <AppLayout>
                <EnhancedReportEditor />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/templates" element={
            <ProtectedRoute>
              <AppLayout>
                <Templates />
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

          <Route path="/team" element={
            <ProtectedRoute>
              <AppLayout>
                <Team />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/projects" element={
            <ProtectedRoute>
              <AppLayout>
                <Projects />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/projects/new" element={
            <ProtectedRoute>
              <AppLayout>
                <ProjectEdit />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <AppLayout>
                <ProjectEdit />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/analytics" element={
            <ProtectedRoute>
              <AppLayout>
                <Analytics />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/automation" element={
            <ProtectedRoute>
              <AppLayout>
                <Automation />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/mobile" element={
            <ProtectedRoute>
              <AppLayout>
                <Mobile />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/export" element={
            <ProtectedRoute>
              <AppLayout>
                <Export />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/subscription" element={
            <ProtectedRoute>
              <AppLayout>
                <Subscription />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/super-admin" element={
            <ProtectedRoute>
              <AppLayout>
                <SuperAdmin />
              </AppLayout>
            </ProtectedRoute>
          } />

          <Route path="/companies" element={
            <ProtectedRoute>
              <AppLayout>
                <Companies />
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
