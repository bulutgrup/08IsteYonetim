import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Tasks } from './pages/Tasks';
import { TaskForm } from './pages/TaskForm';
import { Projects } from './pages/Projects';
import { ProjectForm } from './pages/ProjectForm';
import { Customers } from './pages/Customers';
import { CustomerForm } from './pages/CustomerForm';
import { Offers } from './pages/Offers';
import { OfferForm } from './pages/OfferForm';
import { Finance } from './pages/Finance';
import { FinanceForm } from './pages/FinanceForm';
import { ServiceTickets } from './pages/ServiceTickets';
import { ServiceTicketForm } from './pages/ServiceTicketForm';
import { Messages } from './pages/Messages';
import { MessageWrite } from './pages/MessageWrite';
import { Upgrade } from './pages/Upgrade';
import { Personnel } from './pages/Personnel';
import { PersonnelForm } from './pages/PersonnelForm';
import { Profile } from './pages/Profile';
import { FAQ } from './pages/FAQ';
import { Support } from './pages/Support';
import { isMockMode } from './lib/supabase';

// Güvenli Rota Kontrolcüsü (Oturum Açılmamışsa Login Sayfasına Yönlendirir)
interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  // Simülasyon modunda sb-mock-logged-in anahtarına bakarız (varsayılan true)
  if (isMockMode()) {
    const isLoggedIn = localStorage.getItem('sb-mock-logged-in');
    return isLoggedIn !== 'false' ? children : <Navigate to="/login" replace />;
  }

  // Supabase Auth oturum kontrolü (Dinamik ve güvenli local storage taraması)
  const getSessionFromStorage = () => {
    const tokenKey = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    if (!tokenKey) return false;
    try {
      const sessionData = JSON.parse(localStorage.getItem(tokenKey) || '{}');
      return !!sessionData.access_token;
    } catch (e) {
      return false;
    }
  };

  const hasSession = getSessionFromStorage();

  return hasSession ? children : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <Tasks />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/new"
          element={
            <PrivateRoute>
              <TaskForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/edit/:id"
          element={
            <PrivateRoute>
              <TaskForm />
            </PrivateRoute>
          }
        />

        {/* Projeler Rotaları */}
        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <Projects />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <PrivateRoute>
              <ProjectForm />
            </PrivateRoute>
          }
        />

        {/* Müşteriler Rotaları */}
        <Route
          path="/customers"
          element={
            <PrivateRoute>
              <Customers />
            </PrivateRoute>
          }
        />
        <Route
          path="/customers/new"
          element={
            <PrivateRoute>
              <CustomerForm />
            </PrivateRoute>
          }
        />

        {/* Teklifler Rotaları */}
        <Route
          path="/offers"
          element={
            <PrivateRoute>
              <Offers />
            </PrivateRoute>
          }
        />
        <Route
          path="/offers/new"
          element={
            <PrivateRoute>
              <OfferForm />
            </PrivateRoute>
          }
        />

        {/* Finans Rotaları */}
        <Route
          path="/finance"
          element={
            <PrivateRoute>
              <Finance />
            </PrivateRoute>
          }
        />
        <Route
          path="/finance/new"
          element={
            <PrivateRoute>
              <FinanceForm />
            </PrivateRoute>
          }
        />

        {/* Teknik Servis Rotaları */}
        <Route
          path="/service-tickets"
          element={
            <PrivateRoute>
              <ServiceTickets />
            </PrivateRoute>
          }
        />
        <Route
          path="/service-tickets/new"
          element={
            <PrivateRoute>
              <ServiceTicketForm />
            </PrivateRoute>
          }
        />



        {/* Mesaj Rotaları */}
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <Messages />
            </PrivateRoute>
          }
        />
        <Route
          path="/messages/write"
          element={
            <PrivateRoute>
              <MessageWrite />
            </PrivateRoute>
          }
        />

        {/* Abonelik & Hesap Yükseltme */}
        <Route
          path="/upgrade"
          element={
            <PrivateRoute>
              <Upgrade />
            </PrivateRoute>
          }
        />

        {/* Sistem Ayarları & Personel Yönetimi */}
        <Route
          path="/settings/personnel"
          element={
            <PrivateRoute>
              <Personnel />
            </PrivateRoute>
          }
        />
         <Route
          path="/settings/personnel/new"
          element={
            <PrivateRoute>
              <PersonnelForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <PrivateRoute>
              <FAQ />
            </PrivateRoute>
          }
        />
        <Route
          path="/support"
          element={
            <PrivateRoute>
              <Support />
            </PrivateRoute>
          }
        />

        {/* Diğer şablon rotaları için Dashboard'a yönlendir */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
