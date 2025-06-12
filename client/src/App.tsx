import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { AuthProvider } from "@/hooks/use-auth";
import { LanguageProvider } from "@/hooks/use-language";
import { ProtectedRoute } from "@/lib/protected-route";
import { SessionRecoveryAlert } from "@/components/session-recovery-alert";
import { HelmetProvider } from "react-helmet-async";
import { AchievementManager } from "@/components/achievements/AchievementManager";

import AuthPage from "@/pages/auth-page";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import CalendarPage from "@/pages/calendar-page";
import ClientsPage from "@/pages/clients-page-new";
import EstimatesPage from "@/pages/estimates-page";
import EstimateCreatePage from "@/pages/estimate-create-page";
import EstimateCreateServicePage from "@/pages/estimate-create-service-page";
import EstimateDetailPage from "@/pages/estimate-detail-page";
import EstimatePrintPage from "@/pages/estimate-print-page";
import PdfTemplateEditorPage from "@/pages/pdf-template-editor-page";
import CompanyServicesPage from "@/pages/company-services-page";
import ToolsDashboard from "@/pages/tools-dashboard";
import PremiumEstimatePage from "@/pages/premium-estimate-page";
import AgentEstimateFormPage from "@/pages/agent-estimate-form-page";
import VendorEstimateFormPageNew from "@/pages/vendor-estimate-form-page-new";
import AgentServiceEstimatePage from "@/pages/agent-service-estimate-page";
import MultiServiceEstimatePage from "@/pages/multi-service-estimate-page";
import ProfessionalEstimatePage from "@/pages/professional-estimate-page";
import PropertyMeasurementsPage from "@/pages/property-measurements-page";
import AgentManagementPage from "@/pages/agent-management-page";
import InvoicesPage from "@/pages/invoices-page";
import InvoiceDetailPage from "@/pages/invoice-detail-page";
import ProjectsPage from "@/pages/projects-page";
import ProjectsDebugPage from "@/pages/projects-debug";
import EstimateSimpleTest from "@/pages/estimate-simple-test";
import MaterialsPage from "@/pages/materials-page";
import AIAssistantPage from "@/pages/ai-assistant-page";
import SettingsPage from "@/pages/settings-page";
// PriceConfigurationsPage eliminado (ya no es necesario)
import PricingConfigPage from "@/pages/pricing-config-page";
import SimplePricingPage from "@/pages/simple-pricing-page";
import PublicEstimateView from "@/pages/public-estimate-view";
import PublicInvoiceView from "@/pages/public-invoice-view";
import ClientPortal from "@/pages/client-portal";
import AdminDashboard from "@/pages/admin-dashboard";
import SuperAdminDashboard from "@/pages/super-admin-dashboard-fixed";
import AdminDashboardArchitectural from "@/pages/admin-dashboard-architectural";
import SuperAdminAddContractor from "@/pages/super-admin-add-contractor";
import AchievementsPage from "@/pages/achievements-page";
import TimeclockPage from "@/pages/timeclock-page";
import StandaloneTimeclockPage from "@/pages/standalone-timeclock";
import EmployeeSelectPage from "@/pages/employee-select-page";
import TimeClockSelectAction from "@/pages/time-clock-select-action";
import LeadCapturePage from "@/pages/lead-capture-page";
import PricingPage from "@/pages/pricing";
import BillingPage from "@/pages/billing";
// Google Sheets import removed

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <Route path="/landing" component={Landing} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/lead-capture" component={LeadCapturePage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/estimates" component={EstimatesPage} />
      <ProtectedRoute path="/estimates/create-service" component={EstimateCreateServicePage} />
      <ProtectedRoute path="/estimates/create-professional" component={ProfessionalEstimatePage} />
      <ProtectedRoute path="/estimates/:id" component={EstimateDetailPage} />
      <ProtectedRoute path="/estimates/:id/print" component={EstimatePrintPage} />
      <ProtectedRoute path="/premium-estimate" component={PremiumEstimatePage} />
      <ProtectedRoute path="/agent-estimate-form" component={AgentEstimateFormPage} />
      <ProtectedRoute path="/agent-estimate-form-service" component={AgentServiceEstimatePage} />

      <ProtectedRoute path="/multi-service-estimate" component={MultiServiceEstimatePage} />
      <ProtectedRoute path="/property-measurements" component={PropertyMeasurementsPage} />
      <ProtectedRoute path="/invoices" component={InvoicesPage} />
      <ProtectedRoute path="/invoices/:id" component={InvoiceDetailPage} />
      <ProtectedRoute path="/projects" component={ProjectsPage} />
      <ProtectedRoute path="/projects-debug" component={ProjectsDebugPage} />
      <ProtectedRoute path="/estimate-simple-test" component={EstimateSimpleTest} />
      <ProtectedRoute path="/materials" component={MaterialsPage} />
      <ProtectedRoute path="/timeclock" component={TimeclockPage} />
      <ProtectedRoute path="/ai-assistant" component={AIAssistantPage} />
      <Route path="/price-configurations">
        {/* Redirigir a la nueva ruta de pricing */}
        {() => {
          window.location.href = "/pricing";
          return null;
        }}
      </Route>
      <ProtectedRoute path="/pricing" component={SimplePricingPage} />
      <ProtectedRoute path="/pricing-old" component={PricingConfigPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/agents" component={AgentManagementPage} />
      <ProtectedRoute path="/admin-dashboard" component={AdminDashboard} />
      <ProtectedRoute path="/admin-architectural" component={AdminDashboardArchitectural} />
      <ProtectedRoute path="/super-admin" component={SuperAdminDashboard} />
      <ProtectedRoute path="/super-admin/add-contractor" component={SuperAdminAddContractor} />
      <ProtectedRoute path="/pdf-template-editor" component={PdfTemplateEditorPage} />
      <ProtectedRoute path="/company-services" component={CompanyServicesPage} />
      <ProtectedRoute path="/billing" component={BillingPage} />
      <Route path="/landing" component={Landing} />
      <Route path="/plans" component={PricingPage} />
      {/* Ruta de Google Sheets eliminada */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/public/estimates/:id" component={PublicEstimateView} />
      <Route path="/public/invoices/:id" component={PublicInvoiceView} />
      <Route path="/client-portal/:clientId" component={ClientPortal} />
      <Route path="/standalone-timeclock" component={StandaloneTimeclockPage} />
      <Route path="/employee-select" component={EmployeeSelectPage} />
      <Route path="/time-clock-action" component={TimeClockSelectAction} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HelmetProvider>
          <LanguageProvider>
            <Router />
            <SessionRecoveryAlert />
            <AchievementManager />
            <Toaster />
          </LanguageProvider>
        </HelmetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
