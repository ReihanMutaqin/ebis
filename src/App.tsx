import { Routes, Route } from "react-router";
import MainFilterPage from "./pages/MainFilterPage";
import HomePage from "./pages/tracker/HomePage";
import TechnicianView from "./pages/tracker/TechnicianView";
import ManagerDashboard from "./pages/tracker/ManagerDashboard";
import TrackerLayout from "./components/tracker/TrackerLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainFilterPage />} />
      <Route path="/tracker" element={<TrackerLayout />}>
        <Route index element={<HomePage />} />
        <Route path="technician" element={<TechnicianView />} />
        <Route path="manager" element={<ManagerDashboard />} />
      </Route>
    </Routes>
  );
}
