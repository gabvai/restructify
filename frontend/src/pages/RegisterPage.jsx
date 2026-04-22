import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import Input from "../components/Input.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import styles from "./AuthPage.module.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: ""
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || null
      });
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1>Create account</h1>
        <p className="muted">Register to start creating beam listings.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <FormField label="Name" htmlFor="name">
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </FormField>

          <FormField label="Email" htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </FormField>

          <FormField label="Password" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </FormField>

          <FormField label="Phone" htmlFor="phone" hint="Optional">
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
          </FormField>

          {error && <div className={styles.error}>{error}</div>}

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className={styles.footer}>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
