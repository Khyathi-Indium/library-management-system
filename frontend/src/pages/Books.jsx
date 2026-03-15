import { useEffect, useState } from "react";
import BookCard from "../components/BookCard";
import { getBooks, searchAvailableBooks } from "../services/bookService";
import { borrowBook } from "../services/borrowService";

function getErrorMessage(error) {
  return error?.response?.data?.detail || "Unable to load books.";
}

export default function Books() {
  const [books, setBooks] = useState([]);
  const [query, setQuery] = useState("");
  const [borrowDays, setBorrowDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAllBooks() {
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
    loadAllBooks();
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!query.trim()) {
        await loadAllBooks();
        return;
      }
      const data = await searchAvailableBooks(query.trim());
      setBooks(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleBorrow(book) {
    setMessage("");
    setError("");

    try {
      await borrowBook({
        book_id: book.id,
        borrow_days: Number(borrowDays),
      });
      setMessage(`Borrowed '${book.title}' successfully.`);
      await loadAllBooks();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <section>
      <h1>Books</h1>

      <form
        onSubmit={handleSearch}
        style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or author"
        />
        <input
          type="number"
          min={1}
          max={60}
          value={borrowDays}
          onChange={(event) => setBorrowDays(event.target.value)}
          style={{ width: 120 }}
          title="Borrow days"
        />
        <button type="submit">Search Available</button>
        <button type="button" onClick={loadAllBooks}>
          Reset
        </button>
      </form>

      {message && <p style={{ color: "#047857" }}>{message}</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {loading ? (
        <p>Loading books...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {books.map((book) => (
            <BookCard key={book.id} book={book} allowBorrow onBorrow={handleBorrow} />
          ))}
        </div>
      )}
    </section>
  );
}
