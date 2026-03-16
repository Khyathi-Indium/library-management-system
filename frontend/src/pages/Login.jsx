import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function getErrorMessage(error) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    "Unable to login. Please try again."
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const profile = await login(email, password);
      const roleHomePath = profile?.role === "admin" ? "/admin/books" : "/dashboard";
      const nextPath = location.state?.from?.pathname || roleHomePath;
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ maxWidth: 420, margin: "32px auto" }}>
      <h1>Login</h1>
      <p>Sign in to manage books and borrowing records.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ fontWeight: 600, fontSize: 14, display: "flex", flexDirection: "column", gap: 4 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>


        <label style={{ display: "flex", flexDirection: "column", gap: 4 , fontWeight: 600, fontSize: 14}}>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Signing In..." : "Login"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        New user? <Link to="/register">Create an account</Link>
      </p>
    </section>
  );
}
