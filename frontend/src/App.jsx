import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Web3Provider } from './context/Web3Context';
import { NotificationProvider } from './context/NotificationContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import ConnectWallet from './pages/ConnectWallet';
import Register from './pages/Register';
import DrugVerification from './pages/DrugVerification';
import DrugTracking from './pages/DrugTracking';
import DrugPassport from './pages/DrugPassport'; // Note: Will create this file
import IoTSimulator from './pages/IoTSimulator'; // Note: Will create this file
import Analytics from './pages/Analytics'; // Note: Will create this file
import TransactionExplorer from './pages/TransactionExplorer'; // Note: Will create this file

// Dashboard Pages
import ManufacturerDashboard from './pages/ManufacturerDashboard';
import WholesalerDashboard from './pages/WholesalerDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import TransporterDashboard from './pages/TransporterDashboard'; // Note: Will create this file
import RegulatorDashboard from './pages/RegulatorDashboard'; // Note: Will create this file
import QualityOfficerDashboard from './pages/QualityOfficerDashboard'; // Note: Will create this file
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <Web3Provider>
        <NotificationProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="connect" element={<ConnectWallet />} />
              <Route path="register" element={<Register />} />
              <Route path="verify" element={<DrugVerification />} />
              <Route path="verify/:drugId" element={<DrugVerification />} />
              <Route path="track" element={<DrugTracking />} />
              <Route path="passport/:drugId" element={<DrugPassport />} />
              <Route path="iot" element={<IoTSimulator />} />
            </Route>

            {/* Protected Routes (Dashboard) */}
            <Route element={<DashboardLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/manufacturer" element={<ManufacturerDashboard />} />
              <Route path="/wholesaler/*" element={<WholesalerDashboard />} />
              <Route path="/retailer/*" element={<RetailerDashboard />} />
              <Route path="/customer/*" element={<CustomerDashboard />} />
              <Route path="/transporter/*" element={<TransporterDashboard />} />
              <Route path="/regulator" element={<RegulatorDashboard />} />
              <Route path="/quality-officer/*" element={<QualityOfficerDashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/explorer" element={<TransactionExplorer />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </Web3Provider>
    </Router>
  );
}

export default App;
