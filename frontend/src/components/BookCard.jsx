import { formatDateTime } from "../utils/dateUtils";

export default function BookCard({
  book,
  onBorrow,
  onDelete,
  onEdit,
  allowBorrow = false,
  allowAdminActions = false,
}) {
  return (
    <article
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 14,
        backgroundColor: "#ffffff",
      }}
    >
      <h3 style={{ margin: "0 0 8px" }}>{book.title}</h3>
      <p style={{ margin: "0 0 6px", color: "#374151" }}>Author: {book.author}</p>
      <p style={{ margin: "0 0 6px", color: "#374151" }}>ISBN: {book.isbn}</p>
      <p style={{ margin: "0 0 6px", color: "#374151" }}>
        Copies: {book.available_copies}/{book.total_copies}
      </p>
      <p style={{ margin: "0 0 12px", color: "#6b7280", fontSize: 12 }}>
        Added: {formatDateTime(book.created_at)}
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        {allowBorrow && (
          <button
            type="button"
            onClick={() => onBorrow?.(book)}
            disabled={book.available_copies < 1}
          >
            Borrow
          </button>
        )}

        {allowAdminActions && (
          <>
            <button type="button" onClick={() => onEdit?.(book)}>
              Edit
            </button>
            <button type="button" onClick={() => onDelete?.(book.id)}>
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}
