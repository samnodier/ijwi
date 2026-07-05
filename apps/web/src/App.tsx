import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ReportPage from "./pages/ReportPage";
import EmergencyNumbersPage from "./pages/EmergencyNumbersPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import SummaryPage from "./pages/dashboard/SummaryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/report" element={<ReportPage />} />
      <Route path="/numbers" element={<EmergencyNumbersPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/summary" element={<SummaryPage />} />
    </Routes>
  );
}
