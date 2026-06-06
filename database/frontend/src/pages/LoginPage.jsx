import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import Input from "../components/Input.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { translations } from "../i18n/translations.js";
import styles from "./AuthPage.module.css";

const LoginPage = () => {
  const t = translations.auth.login;
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
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
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h1>{t.title}</h1>
        <p className="muted">{t.subtitle}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <FormField label={t.email} htmlFor="email">
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

          <FormField label={t.password} htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </FormField>

          {error && <div className={styles.error}>{error}</div>}

          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? t.submitting : t.submit}
          </Button>
        </form>

        <p className={styles.footer}>
          {t.noAccount} <Link to="/register">{t.register}</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
