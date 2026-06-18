import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from '../App';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Schedule from '../pages/Schedule';
import Reservation from '../pages/Reservation';
import BillingRules from '../pages/BillingRules';
import Bills from '../pages/Bills';
import Qualifications from '../pages/Qualifications';
import Instruments from '../pages/Instruments';
import { useAppStore } from '../store/useAppStore';

const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) => {
  const { currentUser, isAuthenticated } = useAppStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'schedule',
        element: (
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        )
      },
      {
        path: 'reservation',
        element: (
          <ProtectedRoute allowedRoles={['researcher', 'admin']}>
            <Reservation />
          </ProtectedRoute>
        )
      },
      {
        path: 'billing-rules',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <BillingRules />
          </ProtectedRoute>
        )
      },
      {
        path: 'bills',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'finance', 'researcher']}>
            <Bills />
          </ProtectedRoute>
        )
      },
      {
        path: 'qualifications',
        element: (
          <ProtectedRoute>
            <Qualifications />
          </ProtectedRoute>
        )
      },
      {
        path: 'instruments',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <Instruments />
          </ProtectedRoute>
        )
      }
    ]
  }
]);
