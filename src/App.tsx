import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import FarmsData from "@/pages/FarmsData";
import WarningCenter from "@/pages/WarningCenter";
import ApprovalCenter from "@/pages/ApprovalCenter";
import Forecast from "@/pages/Forecast";
import Reports from "@/pages/Reports";
import SlaughterData from "@/pages/SlaughterData";
import MarketData from "@/pages/MarketData";
import DataUpload from "@/pages/DataUpload";
import SystemConfig from "@/pages/SystemConfig";
import AppLayout from "@/components/Layout";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = localStorage.getItem('user');
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/data/farms" element={<FarmsData />} />
                  <Route path="/data/slaughter" element={<SlaughterData />} />
                  <Route path="/data/markets" element={<MarketData />} />
                  <Route path="/data/upload" element={<DataUpload />} />
                  <Route path="/warnings" element={<WarningCenter />} />
                  <Route path="/approvals" element={<ApprovalCenter />} />
                  <Route path="/forecast" element={<Forecast />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/system" element={<SystemConfig />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
