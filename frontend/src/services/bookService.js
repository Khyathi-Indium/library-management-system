import axiosClient from "../api/axiosClient";

const BOOKS_BASE = "/api/v1/books";

export async function getBooks() {
  const { data } = await axiosClient.get(`${BOOKS_BASE}/`);
  return data;
}

export async function searchAvailableBooks(query = "") {
  const { data } = await axiosClient.get(`${BOOKS_BASE}/search_avail_books`, {
    params: { query },
  });
  return data;
}

export async function getBookById(bookId) {
  const { data } = await axiosClient.get(`${BOOKS_BASE}/${bookId}`);
  return data;
}

export async function createBook(payload) {
  const { data } = await axiosClient.post(`${BOOKS_BASE}/`, payload);
  return data;
}

export async function updateBook(bookId, payload) {
  const { data } = await axiosClient.put(`${BOOKS_BASE}/${bookId}`, payload);
  return data;
}

export async function deleteBook(bookId) {
  await axiosClient.delete(`${BOOKS_BASE}/${bookId}`);
}
