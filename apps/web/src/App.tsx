import { useLocation, Routes, Route } from "react-router-dom";
import { Header, MobileNav } from "./components/layout/Header";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import HomePage from "./pages/HomePage";
import ReportPage from "./pages/ReportPage";
import ReportsPage from "./pages/ReportsPage";
import SuccessPage from "./pages/SuccessPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import EmergencyNumbersPage from "./pages/EmergencyNumbersPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import SummaryPage from "./pages/dashboard/SummaryPage";

function AppShell() {
  const location = useLocation();
  const isCameraHome = location.pathname === "/";

  return (
    <div className="min-h-screen pb-20">
      <Header minimal={isCameraHome} />
      <main className={`mx-auto max-w-lg ${isCameraHome ? "px-3 py-3" : "px-4 py-6"}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/success/:id" element={<SuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/numbers" element={<EmergencyNumbersPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/summary" element={<SummaryPage />} />
        </Routes>
      </main>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
