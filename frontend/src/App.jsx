import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleHomeRedirect from "./components/RoleHomeRedirect";
import AdminBooks from "./pages/AdminBooks";
import Books from "./pages/Books";
import BorrowedBooks from "./pages/BorrowedBooks";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1080, margin: "0 auto", padding: 16 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<RoleHomeRedirect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/books" element={<Books />} />
            <Route path="/borrowed" element={<BorrowedBooks />} />
          </Route>

          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin/books" element={<AdminBooks />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
