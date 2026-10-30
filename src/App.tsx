import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import { SessionRevokedDialog } from "@/components/auth/SessionRevokedDialog";
import { ApiProgressBar } from "@/components/common/ApiProgressBar";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import Vehicle from "@/pages/Vehicles/Vehicle";
import Devices from "@/pages/Vehicles/Devices";
import Transporter from "@/pages/Transporter/Transporter";
import Client from "@/pages/Client/Client";
import VehicleDetail from "@/pages/Vehicles/VehicleDetail";
import DriverDetails from "@/pages/Vehicles/DriverDetails";
import Geofence from "@/pages/Vehicles/Geofence";
import Payment from "@/pages/Vehicles/Payment";
import Enquiry from "@/pages/Vehicles/Enquiry";
import DeviceInventory from "@/pages/Vehicles/DeviceInventory";
import TechnicianList from "@/pages/Vehicles/ManageTechnician/TechnicianList";
import JobSheet from "@/pages/Vehicles/ManageTechnician/JobSheet";
import User from "@/pages/Vehicles/UserGroups/User";
import Groups from "@/pages/Vehicles/UserGroups/Groups";
import CoinBanking from "@/pages/Reports/CoinBanking";
import DriverAssignmentReport from "@/pages/Reports/DriverAssignmentReport";
import ExpenseReport from "@/pages/Reports/ExpenseReport";
import GeofenceReport from "@/pages/Reports/GeofenceReport";
import IdleSummaryReport from "@/pages/Reports/IdleSummaryReport";
import PoiReport from "@/pages/Reports/PoiReport";
import RegisterMobileReport from "@/pages/Reports/RegisterMobileReport";
import RideReport from "@/pages/Reports/RideReport";
import SendComandLog from "@/pages/Reports/SendComandLog";
import SensorReport from "@/pages/Reports/SensorReport";
import SimTrackingReport from "@/pages/Reports/SimTrackingReport";
import SpeedVsDistance from "@/pages/Reports/SpeedVsDistance";
import DistanceReport from "@/pages/Reports/DistanceReport";
import StatusReport from "@/pages/Reports/StatusReport";
import StoppageSummaryReport from "@/pages/Reports/StoppageSummaryReport";
import SubscriptionChangedReport from "@/pages/Reports/SubscriptionChangedReport";
import SubscriptionExpiredDate from "@/pages/Reports/SubscriptionExpiredDate";
import TravelSummaryReport from "@/pages/Reports/TravelSummaryReport";
import VehicleLogReport from "@/pages/Reports/VehicleLogReport";
import Settings from "@/pages/Settings";
import AddAlert from "@/pages/Alert/AddAlert";
import NotificationList from "@/pages/Alert/NotificationList";
import ServiceAndMaintenance from "@/pages/Alert/ServiceAndMaintenance";
import ParkScheduler from "@/pages/Alert/ParkScheduler";
import Announcement from "@/pages/Alert/Announcement";
import Owners from "@/pages/Master/Owners";
import RaisedTicket from "@/pages/Support/RaisedTicket";
import AnsweredTickets from "@/pages/Support/AnsweredTickets";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <>
        <SessionRevokedDialog />
        <Login />
      </>
    );
  }

  return (
    <>
      <SessionRevokedDialog />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/owners" element={<Owners />} />
        <Route path="/vehicles" element={<Vehicle />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/transporters" element={<Transporter />} />
        <Route path="/clients" element={<Client />} />
        <Route path="/vehicle-details" element={<VehicleDetail />} />
        <Route path="/driver-details" element={<DriverDetails />} />
        <Route path="/geofence" element={<Geofence />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/enquiry" element={<Enquiry />} />
        <Route path="/device-inventory" element={<DeviceInventory />} />
        <Route path="/technician-list" element={<TechnicianList />} />
        <Route path="/job-sheet" element={<JobSheet />} />
        <Route path="/users" element={<User />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/coin-banking" element={<CoinBanking />} />
        <Route path="/driver-assignment-report" element={<DriverAssignmentReport />} />
        <Route path="/expense-report" element={<ExpenseReport />} />
        <Route path="/geofence-report" element={<GeofenceReport />} />
        <Route path="/idle-summary-report" element={<IdleSummaryReport />} />
        <Route path="/poi-report" element={<PoiReport />} />
        <Route path="/register-mobile-report" element={<RegisterMobileReport />} />
        <Route path="/ride-report" element={<RideReport />} />
        <Route path="/send-command-logs" element={<SendComandLog />} />
        <Route path="/sensor-report" element={<SensorReport />} />
        <Route path="/sim-tracking-report" element={<SimTrackingReport />} />
        <Route path="/speed-vs-distance" element={<SpeedVsDistance />} />
        <Route path="/distance-report" element={<DistanceReport />} />
        <Route path="/status-report" element={<StatusReport />} />
        <Route path="/stoppage-summary-report" element={<StoppageSummaryReport />} />
        <Route path="/subscription-changed-report" element={<SubscriptionChangedReport />} />
        <Route path="/subscription-expired-report" element={<SubscriptionExpiredDate />} />
        <Route path="/travel-summary-report" element={<TravelSummaryReport />} />
        <Route path="/vehicle-log-report" element={<VehicleLogReport />} />
        <Route path="/add-alerts" element={<AddAlert />} />
        <Route path="/notification-list" element={<NotificationList />} />
        <Route path="/service-maintenance" element={<ServiceAndMaintenance />} />
        <Route path="/parked-scheduler" element={<ParkScheduler />} />
        <Route path="/announcement" element={<Announcement />} />
        <Route path="/raise-ticket" element={<RaisedTicket />} />
        <Route path="/answer-tickets" element={<AnsweredTickets />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" storageKey="gps-theme" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ApiProgressBar />
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
