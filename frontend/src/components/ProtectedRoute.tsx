import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '@/auth/session';

export function ProtectedRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
