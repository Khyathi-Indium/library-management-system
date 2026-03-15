import { useEffect, useMemo, useState } from "react";
import {
  getAdminActiveRecords,
  getAdminOverdueRecords,
  getMyActiveRecordsWithBooks,
  getMyOverdueRecords,
  previewFine,
  returnBook,
} from "../services/borrowService";
import { formatCurrency, formatDateTime, getDueStatusText } from "../utils/dateUtils";
import useAuth from "../hooks/useAuth";

function getErrorMessage(error) {
  return error?.response?.data?.detail || "Unable to load borrowed books.";
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function matchesAdminFilters(record, userQuery, bookQuery, statusFilter) {
  const normalizedUserQuery = normalize(userQuery);
  const normalizedBookQuery = normalize(bookQuery);

  const userMatch =
    normalizedUserQuery.length === 0 ||
    [record.borrower_name, record.borrower_email, String(record.user_id)].some((value) =>
      normalize(value).includes(normalizedUserQuery)
    );

  const bookMatch =
    normalizedBookQuery.length === 0 ||
    [record.book_title, record.book_author, record.book_isbn].some((value) =>
      normalize(value).includes(normalizedBookQuery)
    );

  const statusMatch = statusFilter === "all" || record.status === statusFilter;

  return userMatch && bookMatch && statusMatch;
}

export default function BorrowedBooks() {
  const { isAdmin } = useAuth();
  const [activeRecords, setActiveRecords] = useState([]);
  const [overdueRecords, setOverdueRecords] = useState([]);
  const [finePreviewById, setFinePreviewById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adminUserQuery, setAdminUserQuery] = useState("");
  const [adminBookQuery, setAdminBookQuery] = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("all");

  const filteredActiveRecords = useMemo(() => {
    if (!isAdmin) {
      return activeRecords;
    }

    return activeRecords.filter((record) =>
      matchesAdminFilters(record, adminUserQuery, adminBookQuery, adminStatusFilter)
    );
  }, [activeRecords, isAdmin, adminUserQuery, adminBookQuery, adminStatusFilter]);

  const filteredOverdueRecords = useMemo(() => {
    if (!isAdmin) {
      return overdueRecords;
    }

    return overdueRecords.filter((record) =>
      matchesAdminFilters(record, adminUserQuery, adminBookQuery, adminStatusFilter)
    );
  }, [overdueRecords, isAdmin, adminUserQuery, adminBookQuery, adminStatusFilter]);

  async function loadRecords() {
    setLoading(true);
    setError("");

    try {
      const [active, overdue] = isAdmin
        ? await Promise.all([getAdminActiveRecords(), getAdminOverdueRecords()])
        : await Promise.all([getMyActiveRecordsWithBooks(), getMyOverdueRecords()]);
      setActiveRecords(active);
      setOverdueRecords(overdue);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [isAdmin]);

  async function handlePreview(recordId) {
    setError("");
    try {
      const preview = await previewFine(recordId);
      setFinePreviewById((prev) => ({ ...prev, [recordId]: preview }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleReturn(recordId) {
    setMessage("");
    setError("");
    try {
      const data = await returnBook(recordId);
      setMessage(`Book returned. Final fine: ${formatCurrency(data.fine_amount)}`);
      await loadRecords();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section>
      <h1>{isAdmin ? "Borrow Records (Admin)" : "Borrowed Books"}</h1>
      {message && <p style={{ color: "#047857" }}>{message}</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {loading ? (
        <p>Loading borrowed records...</p>
      ) : (
        <>
          {isAdmin && (
            <section
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                backgroundColor: "#fafafa",
              }}
            >
              <h2 style={{ margin: "0 0 10px" }}>Admin Filters</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 10,
                }}
              >
                <label style={{ display: "grid", gap: 4 }}>
                  <span>User</span>
                  <input
                    type="text"
                    placeholder="Name, email, or user ID"
                    value={adminUserQuery}
                    onChange={(event) => setAdminUserQuery(event.target.value)}
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>Book</span>
                  <input
                    type="text"
                    placeholder="Title, author, or ISBN"
                    value={adminBookQuery}
                    onChange={(event) => setAdminBookQuery(event.target.value)}
                  />
                </label>

                <label style={{ display: "grid", gap: 4 }}>
                  <span>Status</span>
                  <select
                    value={adminStatusFilter}
                    onChange={(event) => setAdminStatusFilter(event.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="borrowed">Borrowed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setAdminUserQuery("");
                    setAdminBookQuery("");
                    setAdminStatusFilter("all");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </section>
          )}

          <h2>Active Records</h2>
          {filteredActiveRecords.length === 0 ? (
            <p>{isAdmin ? "No active records match current filters." : "No active borrowed books."}</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredActiveRecords.map((record) => {
                const preview = finePreviewById[record.id];
                return (
                  <article
                    key={record.id}
                    style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}
                  >
                    <h3 style={{ margin: "0 0 8px" }}>{record.book_title}</h3>
                    {isAdmin && (
                      <>
                        <p style={{ margin: "0 0 6px" }}>
                          Borrowed By: {record.borrower_name || `User ${record.user_id}`}
                        </p>
                        <p style={{ margin: "0 0 6px" }}>
                          Borrower Email: {record.borrower_email || "N/A"} | User ID: {record.user_id}
                        </p>
                      </>
                    )}
                    <p style={{ margin: "0 0 6px" }}>Author: {record.book_author}</p>
                    <p style={{ margin: "0 0 6px" }}>Borrowed: {formatDateTime(record.borrow_date)}</p>
                    <p style={{ margin: "0 0 6px" }}>Due: {formatDateTime(record.due_date)}</p>
                    <p style={{ margin: "0 0 10px" }}>Status: {getDueStatusText(record)}</p>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => handlePreview(record.id)}>
                        Preview Fine
                      </button>
                      <button type="button" onClick={() => handleReturn(record.id)}>
                        Return Book
                      </button>
                    </div>

                    {preview && (
                      <p style={{ marginTop: 8 }}>
                        Estimated Fine: {formatCurrency(preview.fine_amount)} ({preview.days_overdue}{" "}
                        day(s) overdue)
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          <h2 style={{ marginTop: 18 }}>Overdue Records</h2>
          {filteredOverdueRecords.length === 0 ? (
            <p>{isAdmin ? "No overdue records match current filters." : "No overdue records."}</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {filteredOverdueRecords.map((record) => (
                <article
                  key={record.id}
                  style={{
                    border: "1px solid #fca5a5",
                    backgroundColor: "#fff7ed",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <h3 style={{ margin: "0 0 8px" }}>{record.book_title}</h3>
                  {isAdmin && (
                    <>
                      <p style={{ margin: "0 0 6px" }}>
                        Borrowed By: {record.borrower_name || `User ${record.user_id}`}
                      </p>
                      <p style={{ margin: "0 0 6px" }}>
                        Borrower Email: {record.borrower_email || "N/A"} | User ID: {record.user_id}
                      </p>
                    </>
                  )}
                  <p style={{ margin: "0 0 6px" }}>Due: {formatDateTime(record.due_date)}</p>
                  <p style={{ margin: "0 0 6px" }}>{record.days_overdue} day(s) overdue</p>
                  <p style={{ margin: 0 }}>Estimated Fine: {formatCurrency(record.fine_amount)}</p>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
