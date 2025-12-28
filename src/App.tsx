import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './routes/ProtectedRoute';


// Layouts
import { SimpleLayout } from './layouts/SimpleLayout';

// Pages
import ReloadPrompt from './ReloadPrompt';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { StressTest } from './pages/StressTest';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import Users from './pages/dashboard/Users';
import Classes from './pages/Classes';
import Modules from './pages/Modules';
import Materials from './pages/Materials';
import Assignments from './pages/dashboard/Assignments';
import Reports from './pages/dashboard/Reports';
import StudentClasses from './pages/dashboard/StudentClasses';
import Settings from './pages/dashboard/Settings';
import Profile from './pages/dashboard/Profile';
import NotFound from './pages/NotFound';
import Notion from './pages/dashboard/Notion';

import Orders from './pages/dashboard/Orders';
import CreateOrder from './pages/dashboard/CreateOrder';
import { CRM } from './pages/dashboard/CRM';
import { WhatsApp } from './pages/dashboard/WhatsApp';

// import { TodoServiceAccount } from './pages/dashboard/TodoServiceAccount';
// import { TodoReadOnly } from './pages/dashboard/TodoReadOnly';
import { MenuManagement } from './pages/dashboard/MenuManagement';
import RestrictedUsers from './pages/dashboard/RestrictedUsers';
import BugReports from './pages/dashboard/BugReports';
import Configuration from './pages/dashboard/Configuration';
import { TestNavigation } from './pages/dashboard/TestNavigation';
import Search from './pages/dashboard/Search';
import TribuMateria from './pages/dashboard/TribuMateria';
import { DB } from './pages/dashboard/DB';
import { Evento } from './pages/dashboard/Evento';
import { Gastos } from './pages/dashboard/Gastos';
import { Dashboard } from './pages/dashboard/Dashboard';
import { Home } from './pages/dashboard/Home';
import { Teaching } from './pages/dashboard/Teaching';
import { ArchivedClasses } from './pages/dashboard/ArchivedClasses';
import { ClassDetail } from './pages/dashboard/ClassDetail';
import { StudentClassDetail } from './pages/dashboard/students/StudentClassDetail';
import { TeacherClassDetail } from './pages/dashboard/teachers/TeacherClassDetail';
import { ParentClassDetail } from './pages/dashboard/parents/ParentClassDetail';
import { AdminClassDetail } from './pages/dashboard/admin/AdminClassDetail';
import { Calendar } from './pages/dashboard/Calendar';
import { DBExportButton } from './components/dev/DBExportButton';
import { DBImportButton } from './components/dev/DBImportButton';
import { DBTestPanel } from './components/dev/DBTestPanel';
import { PlaceholderPage } from './pages/dashboard/PlaceholderPage';
import ResidentsDirectory from './pages/dashboard/residents/ResidentsDirectory';
import ResidentProfile from './pages/dashboard/residents/ResidentProfile';
import EMARDashboard from './pages/dashboard/emar/EMARDashboard';
import VitalsDashboard from './pages/dashboard/medical/VitalsDashboard';
import LogbookDashboard from './pages/dashboard/medical/LogbookDashboard';

// Google OAuth eliminado: ya no se maneja callback de Google en el frontend

/**
 * Componente que renderiza ClassDetail según el rol del usuario
 */
const RoleBasedClassDetail: React.FC = () => {
  const { user } = useAuthStore();

  if (user?.role === 'paciente') {
    return <StudentClassDetail />;
  } else if (user?.role === 'enfermero') {
    return <TeacherClassDetail />;
  } else if (user?.role === 'pariente') {
    return <ParentClassDetail />;
  } else if (user?.role === 'admin') {
    return <AdminClassDetail />;
  } else {
    // Por defecto usa ClassDetail original
    return <ClassDetail />;
  }
};

const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <div className="App">
        <ReloadPrompt />
        <DBExportButton />
        <DBImportButton />
        <DBTestPanel />
        {/* El toggle flotante de dark mode ha sido eliminado */}
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />


          {/* Rutas de prueba */}
          <Route path="/stress-test" element={<StressTest />} />

          {/* Rutas del dashboard - con autenticación */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <SimpleLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard principal - siempre redirige aquí */}
            <Route index element={<Home />} />
            <Route path="home" element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="teaching" element={<Teaching />} />
            <Route path="archived-classes" element={<ArchivedClasses />} />
            <Route path="modules" element={<Modules />} />
            <Route path="classes" element={<Classes />} />
            <Route path="classes/:classId" element={<RoleBasedClassDetail />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="students" element={<div className="p-6">Gestión de Estudiantes (Próximamente)</div>} />
            <Route path="materials" element={<Materials />} />
            <Route path="create-class" element={<div className="p-6">Crear Nueva Clase (Próximamente)</div>} />
            <Route path="users" element={<Users />} />

            <Route path="db" element={<DB />} />
            <Route path="evento" element={<Evento />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="gastos" element={<Gastos />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/create" element={<CreateOrder />} />
            <Route path="crm" element={<CRM />} />
            <Route path="whatsapp" element={<WhatsApp />} />

            <Route path="reports" element={<Reports />} />
            <Route path="search" element={<Search />} />
            <Route path="studentclasses" element={<StudentClasses />} />
            <Route path="notion" element={<Notion />} />
            <Route path="menu-management" element={<MenuManagement />} />
            <Route path="restricted-users" element={<RestrictedUsers />} />
            <Route path="bug-reports" element={<BugReports />} />
            <Route path="configuration" element={<Configuration />} />
            <Route path="test-navigation" element={<TestNavigation />} />



            {/* Rutas GeriatricApp - Nuevos Módulos */}
            <Route path="residents" element={<ResidentsDirectory />} />
            <Route path="residents/:id" element={<ResidentProfile />} />
            <Route path="admissions" element={<PlaceholderPage />} />
            <Route path="records" element={<PlaceholderPage />} />
            <Route path="medical" element={<PlaceholderPage />} />
            <Route path="care-plans" element={<PlaceholderPage />} />
            <Route path="pharmacy" element={<PlaceholderPage />} />
            <Route path="incidents" element={<PlaceholderPage />} />
            <Route path="staff" element={<PlaceholderPage />} />
            <Route path="facilities" element={<PlaceholderPage />} />
            <Route path="beds" element={<PlaceholderPage />} />
            <Route path="kitchen" element={<PlaceholderPage />} />
            <Route path="maintenance" element={<PlaceholderPage />} />
            <Route path="finance" element={<PlaceholderPage />} />

            <Route path="emar" element={<EMARDashboard />} />
            <Route path="vitals" element={<VitalsDashboard />} />
            <Route path="logbook" element={<LogbookDashboard />} />
            <Route path="adl" element={<PlaceholderPage />} />

            <Route path="meals" element={<PlaceholderPage />} />
            <Route path="activities" element={<PlaceholderPage />} />
            <Route path="family" element={<PlaceholderPage />} />
            <Route path="help" element={<PlaceholderPage />} />

            <Route path="health-reports" element={<PlaceholderPage />} />
            <Route path="visits" element={<PlaceholderPage />} />
            <Route path="admin-docs" element={<PlaceholderPage />} />
            <Route path="contact" element={<PlaceholderPage />} />

            {/* Ruta dinámica para tribu y materia */}
            <Route path=":tribuId/:materia" element={<TribuMateria />} />
          </Route>

          {/* Ruta por defecto */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;