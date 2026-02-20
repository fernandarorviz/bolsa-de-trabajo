import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Vacantes from "./pages/Vacantes";
import VacanteNueva from "./pages/VacanteNueva";
import VacanteDetalle from "./pages/VacanteDetalle";
import VacantePipeline from "./pages/VacantePipeline";
import Candidatos from "./pages/Candidatos";
import Clientes from "./pages/Clientes";
import ClienteForm from "./pages/ClienteForm";
import Usuarios from "./pages/Usuarios";
import OverviewReport from "./pages/admin/reports/OverviewReport";
import HiringClientReport from "./pages/admin/reports/HiringClientReport";
import RecruiterServiceReport from "./pages/admin/reports/RecruiterServiceReport";
import Facturacion from "./pages/admin/Facturacion";
import Auditoria from "./pages/admin/Auditoria";
import Notificaciones from "./pages/admin/Notificaciones";
import Plantillas from "./pages/admin/Plantillas";
import PlantillaNueva from "./pages/admin/PlantillaNueva";
import CalendarView from "./pages/CalendarView";
import CargaTrabajo from "./pages/CargaTrabajo";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientVacancyDetail from "./pages/client/ClientVacancyDetail";
import ClientAgenda from "./pages/client/ClientAgenda";
import JobBoard from "./pages/public/JobBoard";
import JobDetail from "./pages/public/JobDetail";
import ClientProfile from "./pages/client/ClientProfile";
import ClientBilling from "./pages/client/ClientBilling";
import ClientSettings from "./pages/client/ClientSettings";
import ClientNotifications from "./pages/client/ClientNotifications";

// Candidate Portal
import CandidateAuth from "./pages/candidate/CandidateAuth";
import CandidateLayout from "./components/candidate/CandidateLayout";
import CandidateProfile from "./pages/candidate/CandidateProfile";
import MyApplications from "./pages/candidate/MyApplications";
import CandidateAccount from "./pages/candidate/CandidateAccount";
import CandidateNotifications from "./pages/candidate/CandidateNotifications";
import Agenda from "./pages/candidate/Agenda";

// Client Portal Auth
import ClientAuth from "./pages/client/ClientAuth";

// Ant Design
import { ConfigProvider, theme } from "antd";
import AntdDemo from "./components/AntdDemo";

const queryClient = new QueryClient();

const App = () => (
  <ConfigProvider
    theme={{
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#58A738', // Vibrant green from reference
        borderRadius: 6,
      },
    }}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Public Access Routes */}
              <Route path="/empleos" element={<JobBoard />} />
              <Route path="/empleos/:id" element={<JobDetail />} />
              <Route path="/antd-demo" element={<AntdDemo />} />

              <Route path="/auth" element={<Auth />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vacantes"
                element={
                  <ProtectedRoute>
                    <Vacantes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vacantes/nueva"
                element={
                  <ProtectedRoute requiredRoles={['reclutador', 'coordinador', 'admin']}>
                    <VacanteNueva />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vacantes/:id"
                element={
                  <ProtectedRoute>
                    <VacanteDetalle />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vacantes/:id/editar"
                element={
                  <ProtectedRoute requiredRoles={['reclutador', 'coordinador', 'admin']}>
                    <VacanteNueva />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vacantes/:id/pipeline"
                element={
                  <ProtectedRoute>
                    <VacantePipeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidatos"
                element={
                  <ProtectedRoute>
                    <Candidatos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute>
                    <Clientes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes/nuevo"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <ClienteForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes/:id/editar"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <ClienteForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usuarios"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Usuarios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'coordinador']}>
                    <OverviewReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes/clientes"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'coordinador']}>
                    <HiringClientReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reportes/analistas"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'coordinador']}>
                    <RecruiterServiceReport />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facturacion"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'coordinador']}>
                    <Facturacion />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/carga-trabajo"
                element={
                  <ProtectedRoute requiredRoles={['admin', 'coordinador']}>
                    <CargaTrabajo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/auditoria"
                element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Auditoria />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/agenda"
                element={
                  <ProtectedRoute>
                    <CalendarView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notificaciones"
                element={
                  <ProtectedRoute>
                    <Notificaciones />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plantillas"
                element={
                  <ProtectedRoute requiredRoles={['reclutador', 'coordinador', 'admin']}>
                    <Plantillas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plantillas/nueva"
                element={
                  <ProtectedRoute requiredRoles={['reclutador', 'coordinador', 'admin']}>
                    <PlantillaNueva />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/plantillas/:id/editar"
                element={
                  <ProtectedRoute requiredRoles={['reclutador', 'coordinador', 'admin']}>
                    <PlantillaNueva />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              
              {/* Client Portal Routes */}
              <Route path="/cliente/auth" element={<ClientAuth />} />
              <Route path="/portal" element={<Navigate to="/portal/dashboard" replace />} />
              <Route
                path="/portal/dashboard"
                element={
                  <ProtectedRoute requiredRoles={['cliente']}>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/portal/vacantes/:id"
                element={
                  <ProtectedRoute requiredRoles={['cliente']}>
                    <ClientVacancyDetail />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/portal/agenda"
                element={
                  <ProtectedRoute requiredRoles={['cliente']}>
                    <ClientAgenda />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portal/agenda"
                element={
                  <ProtectedRoute requiredRoles={['cliente']}>
                    <ClientAgenda />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/portal/perfil"
                element={
                  <ProtectedRoute requiredRoles={['cliente']}>
                    <ClientProfile />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/portal/datos-fiscales"
                element={
                  <ProtectedRoute requiredRoles={['cliente']}>
                    <ClientBilling />
                  </ProtectedRoute>
                }
              />
               <Route
                path="/portal/configuracion"
                element={
                  <ProtectedRoute requiredRoles={['cliente']}>
                    <ClientSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portal/notificaciones"
                element={
                  <ProtectedRoute requiredRoles={['cliente']}>
                    <ClientNotifications />
                  </ProtectedRoute>
                }
              />
              {/* End Client Routes */}
  
              {/* Candidate Portal Routes */}
              <Route path="/candidato/auth" element={<CandidateAuth />} />
              <Route
                path="/candidato/perfil"
                element={
                  <ProtectedRoute>
                    <CandidateLayout>
                      <CandidateProfile />
                    </CandidateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidato/postulaciones"
                element={
                  <ProtectedRoute>
                    <CandidateLayout>
                      <MyApplications />
                    </CandidateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidato/agenda"
                element={
                  <ProtectedRoute>
                    <CandidateLayout>
                      <Agenda />
                    </CandidateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidato/notificaciones"
                element={
                  <ProtectedRoute>
                    <CandidateLayout>
                      <CandidateNotifications />
                    </CandidateLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidato/cuenta"
                element={
                  <ProtectedRoute>
                    <CandidateLayout>
                      <CandidateAccount />
                    </CandidateLayout>
                  </ProtectedRoute>
                }
              />
              {/* End Candidate Routes */}
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ConfigProvider>
);

export default App;
