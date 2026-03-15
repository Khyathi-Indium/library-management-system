import axiosClient from "../api/axiosClient";

const BORROW_BASE = "/api/v1/borrow-records";

export async function borrowBook(payload) {
  const { data } = await axiosClient.post(`${BORROW_BASE}/borrow`, payload);
  return data;
}

export async function returnBook(recordId) {
  const { data } = await axiosClient.post(`${BORROW_BASE}/${recordId}/return`);
  return data;
}

export async function getMyBorrowRecords() {
  const { data } = await axiosClient.get(`${BORROW_BASE}/me`);
  return data;
}

export async function getMyOverdueRecords() {
  const { data } = await axiosClient.get(`${BORROW_BASE}/me/overdue`);
  return data;
}

export async function getMyActiveRecords() {
  const { data } = await axiosClient.get(`${BORROW_BASE}/me/active`);
  return data;
}

export async function getMyActiveRecordsWithBooks() {
  const { data } = await axiosClient.get(`${BORROW_BASE}/me/active-with-books`);
  return data;
}

export async function getAdminActiveRecords() {
  const { data } = await axiosClient.get(`${BORROW_BASE}/admin/active`);
  return data;
}

export async function getAdminOverdueRecords() {
  const { data } = await axiosClient.get(`${BORROW_BASE}/admin/overdue`);
  return data;
}

export async function previewFine(recordId) {
  const { data } = await axiosClient.get(`${BORROW_BASE}/me/${recordId}/preview-fine`);
  return data;
}

export async function getOverdueSummary() {
  const { data } = await axiosClient.get(`${BORROW_BASE}/me/overdue-summary`);
  return data;
}
