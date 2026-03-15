import { useEffect, useState } from "react";
import { getMyActiveRecords } from "../services/borrowService";
import { formatCurrency } from "../utils/dateUtils";
import { getOverdueSummary } from "../services/borrowService";
import { getBooks } from "../services/bookService";
import useAuth from "../hooks/useAuth";

function getErrorMessage(error) {
  return error?.response?.data?.detail || "Unable to load dashboard data.";
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [summary, setSummary] = useState({
    total_overdue_books: 0,
    total_estimated_fine: 0,
    records: [],
  });
  const [activeRecords, setActiveRecords] = useState([]);
  const [bookStats, setBookStats] = useState({
    total: 0,
    available: 0,
    unavailable: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError("");

      try {
        if (isAdmin) {
          const books = await getBooks();
          const available = books.filter(
            (book) => Number(book.available_copies || 0) > 0
          ).length;
          setBookStats({
            total: books.length,
            available,
            unavailable: books.length - available,
          });
        } else {
          const [overdueSummary, active] = await Promise.all([
            getOverdueSummary(),
            getMyActiveRecords(),
          ]);
          setSummary(overdueSummary);
          setActiveRecords(active);
        }
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAdmin]);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  return (
    <section>
      <h1>Dashboard</h1>
      <p style={{ color: "#4b5563" }}>
        Logged in as <strong>{user?.role || "user"}</strong>
      </p>
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {isAdmin ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, minWidth: 180 }}>
            <p style={{ margin: 0, color: "#6b7280" }}>Total Books</p>
            <h2 style={{ margin: "6px 0 0" }}>{bookStats.total}</h2>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, minWidth: 180 }}>
            <p style={{ margin: 0, color: "#6b7280" }}>Books Available</p>
            <h2 style={{ margin: "6px 0 0" }}>{bookStats.available}</h2>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, minWidth: 220 }}>
            <p style={{ margin: 0, color: "#6b7280" }}>Books Unavailable</p>
            <h2 style={{ margin: "6px 0 0" }}>{bookStats.unavailable}</h2>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, minWidth: 180 }}>
            <p style={{ margin: 0, color: "#6b7280" }}>Active Borrowed Books</p>
            <h2 style={{ margin: "6px 0 0" }}>{activeRecords.length}</h2>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, minWidth: 180 }}>
            <p style={{ margin: 0, color: "#6b7280" }}>Overdue Books</p>
            <h2 style={{ margin: "6px 0 0" }}>{summary.total_overdue_books}</h2>
          </div>

          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12, minWidth: 220 }}>
            <p style={{ margin: 0, color: "#6b7280" }}>Total Estimated Fine</p>
            <h2 style={{ margin: "6px 0 0" }}>{formatCurrency(summary.total_estimated_fine)}</h2>
          </div>
        </div>
      )}
    </section>
  );
}
