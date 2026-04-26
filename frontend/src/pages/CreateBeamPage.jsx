import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import Input from "../components/Input.jsx";
import { createBeamRequest } from "../api/beams.js";
import { translations } from "../i18n/translations.js";
import styles from "./CreateBeamPage.module.css";

const t = translations.createBeam;

const textFields = [
  { name: "title", label: t.fields.title, required: true },
  { name: "description", label: t.fields.description },
  { name: "beam_name", label: t.fields.beam_name, required: true },
  { name: "beam_type", label: t.fields.beam_type, required: true },
  { name: "profile_name", label: t.fields.profile_name },
  { name: "steel_grade", label: t.fields.steel_grade },
  { name: "surface_coating", label: t.fields.surface_coating },
  { name: "condition", label: t.fields.condition },
  { name: "defects", label: t.fields.defects },
  { name: "usage_history", label: t.fields.usage_history },
  { name: "drawings", label: t.fields.drawings },
  { name: "location", label: t.fields.location }
];

const numberFields = [
  { name: "length_mm", label: t.fields.length_mm, step: "1" },
  { name: "weight_kg", label: t.fields.weight_kg, step: "0.01" },
  { name: "height_mm", label: t.fields.height_mm, step: "1" },
  { name: "width_mm", label: t.fields.width_mm, step: "1" },
  { name: "web_thickness_mm", label: t.fields.web_thickness_mm, step: "0.1" },
  { name: "flange_thickness_mm", label: t.fields.flange_thickness_mm, step: "0.1" },
  { name: "quantity", label: t.fields.quantity, step: "1" },
  { name: "price_eur", label: t.fields.price_eur, step: "0.01" }
];

const buildInitialState = () => {
  const initial = {};
  [...textFields, ...numberFields].forEach((field) => {
    initial[field.name] = "";
  });
  return initial;
};

const normalizePayload = (form) => {
  const payload = {};
  const numberFieldNames = new Set(numberFields.map((field) => field.name));

  Object.entries(form).forEach(([key, rawValue]) => {
    const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (value === "" || value === null || value === undefined) {
      return;
    }

    if (numberFieldNames.has(key)) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        payload[key] = parsed;
      }
      return;
    }

    payload[key] = value;
  });

  return payload;
};

const CreateBeamPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(buildInitialState);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const payload = normalizePayload(form);
      await createBeamRequest(payload);
      setSuccess(t.success);
      setForm(buildInitialState());

      setTimeout(() => navigate("/beams"), 700);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section>
      <h1>{t.title}</h1>
      <p className="muted">{t.subtitle}</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid}>
          {textFields.map((field) => (
            <FormField
              key={field.name}
              htmlFor={field.name}
              label={field.label + (field.required ? " *" : "")}
            >
              <Input
                id={field.name}
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                required={field.required}
              />
            </FormField>
          ))}

          {numberFields.map((field) => (
            <FormField
              key={field.name}
              htmlFor={field.name}
              label={field.label}
            >
              <Input
                id={field.name}
                name={field.name}
                type="number"
                step={field.step}
                min="0"
                value={form[field.name]}
                onChange={handleChange}
              />
            </FormField>
          ))}
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/beams")}
          >
            {t.cancel}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t.saving : t.submit}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default CreateBeamPage;
