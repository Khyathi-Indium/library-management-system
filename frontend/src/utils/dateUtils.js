export function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
}

export function formatCurrency(amount) {
  const value = Number(amount || 0);
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

export function getDueStatusText(record) {
  if (!record) {
    return "";
  }

  if (record.status === "returned") {
    return "Returned";
  }

  if (record.is_overdue) {
    return `${record.days_overdue} day(s) overdue`;
  }

  return `${record.days_remaining} day(s) left`;
}