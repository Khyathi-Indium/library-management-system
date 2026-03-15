import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function ProtectedRoute({ requiredRole }) {
  const { loading, isAuthenticated, user } = useAuth();
  const location = useLocation();
  const fallbackPath = user?.role === "admin" ? "/admin/books" : "/dashboard";

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
