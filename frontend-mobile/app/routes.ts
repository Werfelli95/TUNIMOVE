import { createBrowserRouter } from 'react-router';
import LoginPage from './pages/LoginPage';
import ServiceStartPage from './pages/ServiceStartPage';
import DashboardPage from './pages/DashboardPage';
import SeatMapPage from './pages/SeatMapPage';
import PassengerManifestPage from './pages/PassengerManifestPage';
import TicketSalePage from './pages/TicketSalePage';
import IncidentReportPage from './pages/IncidentReportPage';
import ServiceClosurePage from './pages/ServiceClosurePage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/service-start',
    Component: ServiceStartPage,
  },
  {
    path: '/dashboard',
    Component: DashboardPage,
  },
  {
    path: '/seat-map',
    Component: SeatMapPage,
  },
  {
    path: '/manifest',
    Component: PassengerManifestPage,
  },
  {
    path: '/ticket-sale',
    Component: TicketSalePage,
  },
  {
    path: '/incident',
    Component: IncidentReportPage,
  },
  {
    path: '/closure',
    Component: ServiceClosurePage,
  },
]);
