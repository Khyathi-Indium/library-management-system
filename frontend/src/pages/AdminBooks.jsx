import { useEffect, useMemo, useState } from "react";
import BookCard from "../components/BookCard";
import { createBook, deleteBook, getBooks, updateBook } from "../services/bookService";

const initialForm = {
  title: "",
  author: "",
  isbn: "",
  total_copies: 1,
  available_copies: 1,
};

function getErrorMessage(error) {
  return error?.response?.data?.detail || "Admin action failed.";
}

export default function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submitLabel = useMemo(
    () => (editingId ? "Update Book" : "Create Book"),
    [editingId]
  );

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return books;
    }

    return books.filter((book) => {
      return [book.title, book.author, book.isbn].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query)
      );
    });
  }, [books, searchQuery]);

  async function loadBooks() {
    setLoading(true);
    setError("");
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBooks();
  }, []);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function toPayload(values) {
    return {
      title: values.title,
      author: values.author,
      isbn: values.isbn,
      total_copies: Number(values.total_copies),
      available_copies: Number(values.available_copies),
    };
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const payload = toPayload(form);
      if (editingId) {
        await updateBook(editingId, payload);
        setMessage("Book updated successfully.");
      } else {
        await createBook(payload);
        setMessage("Book created successfully.");
      }
      resetForm();
      await loadBooks();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(book) {
    setEditingId(book.id);
    setForm({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      total_copies: book.total_copies,
      available_copies: book.available_copies,
    });
  }

  async function handleDelete(bookId) {
    setError("");
    setMessage("");

    try {
      await deleteBook(bookId);
      setMessage("Book deleted successfully.");
      await loadBooks();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section>
      <h1>Admin Books</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, maxWidth: 460 }}>
        <input
          name="title"
          value={form.title}
          onChange={handleFormChange}
          placeholder="Title"
          required
        />
        <input
          name="author"
          value={form.author}
          onChange={handleFormChange}
          placeholder="Author"
          required
        />
        <input
          name="isbn"
          value={form.isbn}
          onChange={handleFormChange}
          placeholder="ISBN"
          required
        />
        <input
          type="number"
          min={1}
          name="total_copies"
          value={form.total_copies}
          onChange={handleFormChange}
          placeholder="Total Copies"
          required
        />
        <input
          type="number"
          min={0}
          name="available_copies"
          value={form.available_copies}
          onChange={handleFormChange}
          placeholder="Available Copies"
          required
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : submitLabel}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {message && <p style={{ color: "#047857" }}>{message}</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      <h2 style={{ marginTop: 20 }}>Book Inventory</h2>
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search by title, author, or ISBN"
          style={{ minWidth: 280 }}
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery("")}>
            Clear
          </button>
        )}
        <span style={{ color: "#6b7280" }}>{filteredBooks.length} result(s)</span>
      </div>

      {loading ? (
        <p>Loading books...</p>
      ) : filteredBooks.length === 0 ? (
        <p>No books found for the current search.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              allowAdminActions
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}
