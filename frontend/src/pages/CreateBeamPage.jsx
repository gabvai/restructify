import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import Input from "../components/Input.jsx";
import { createBeamRequest } from "../api/beams.js";
import styles from "./CreateBeamPage.module.css";

const textFields = [
  { name: "title", label: "Title", required: true },
  { name: "description", label: "Description" },
  { name: "beam_name", label: "Beam name", required: true },
  { name: "beam_type", label: "Beam type", required: true },
  { name: "profile_name", label: "Profile name" },
  { name: "steel_grade", label: "Steel grade" },
  { name: "surface_coating", label: "Surface coating" },
  { name: "condition", label: "Condition" },
  { name: "defects", label: "Defects" },
  { name: "usage_history", label: "Usage history" },
  { name: "drawings", label: "Drawings" },
  { name: "location", label: "Location" }
];

const numberFields = [
  { name: "length_mm", label: "Length (mm)", step: "1" },
  { name: "weight_kg", label: "Weight (kg)", step: "0.01" },
  { name: "height_mm", label: "Height (mm)", step: "1" },
  { name: "width_mm", label: "Width (mm)", step: "1" },
  { name: "web_thickness_mm", label: "Web thickness (mm)", step: "0.1" },
  { name: "flange_thickness_mm", label: "Flange thickness (mm)", step: "0.1" },
  { name: "quantity", label: "Quantity", step: "1" },
  { name: "price_eur", label: "Price (EUR)", step: "0.01" }
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
      setSuccess("Beam created successfully.");
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
      <h1>Create Beam</h1>
      <p className="muted">Fill in the beam specifications and submit.</p>

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
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Create beam"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default CreateBeamPage;
