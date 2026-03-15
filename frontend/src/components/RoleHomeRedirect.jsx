import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RoleHomeRedirect() {
  const { user } = useAuth();
  const destination = user?.role === "admin" ? "/admin/books" : "/dashboard";
  return <Navigate to={destination} replace />;
}
