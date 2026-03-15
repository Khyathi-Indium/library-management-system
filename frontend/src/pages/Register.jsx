import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function getErrorMessage(error) {
  return error?.response?.data?.detail || "Unable to register. Please try again.";
}

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register({ name, email, password });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section style={{ maxWidth: 420, margin: "32px auto" }}>
      <h1>Register</h1>
      <p>Create your account to borrow and return books.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Full Name
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>

        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
        </label>

        {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating Account..." : "Register"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </section>
  );
}
