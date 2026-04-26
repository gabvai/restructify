import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../components/Button.jsx";
import ConstructionTypeSelector from "../components/ConstructionTypeSelector.jsx";
import FormField from "../components/FormField.jsx";
import { createBeamRequest } from "../api/beams.js";
import { translations } from "../i18n/translations.js";
import styles from "./CreateBeamPage.module.css";

const t = translations.createBeam;

const stepDefinitions = [
  {
    title: "1. Pasirinkite konstrukcijos tipą",
    description: "Pasirinkite, kokio tipo konstrukciją norite paskelbti."
  },
  {
    title: "2. Pagrindinė informacija",
    description: "Įveskite pagrindinius konstrukcijos duomenis."
  },
  {
    title: "3. Matmenys",
    description: "Įveskite konstrukcijos matmenis ir kiekį."
  },
  {
    title: "4. Papildoma informacija",
    description: "Papildoma informacija padės pirkėjams geriau įvertinti konstrukciją."
  }
];

const buildInitialState = () => {
  return {
    title: "",
    description: "",
    beam_name: "",
    beam_type: "",
    profile_name: "",
    steel_grade: "",
    surface_coating: "",
    condition: "",
    defects: "",
    usage_history: "",
    drawings: "",
    location: "",
    length_mm: "",
    weight_kg: "",
    height_mm: "",
    width_mm: "",
    web_thickness_mm: "",
    flange_thickness_mm: "",
    quantity: "",
    price_eur: ""
  };
};

const normalizePayload = (form) => {
  const payload = {};
  const numberFieldNames = new Set([
    "length_mm",
    "weight_kg",
    "height_mm",
    "width_mm",
    "web_thickness_mm",
    "flange_thickness_mm",
    "quantity",
    "price_eur"
  ]);

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
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const getStepErrors = (step) => {
    const requiredMessage = "Šis laukas yra privalomas.";
    const nextErrors = {};

    if (step === 0) {
      if (!form.beam_type.trim()) {
        nextErrors.beam_type = requiredMessage;
      }
    }

    if (step === 1) {
      ["title", "beam_type", "profile_name", "steel_grade", "condition", "location"].forEach((name) => {
        if (!String(form[name] || "").trim()) {
          nextErrors[name] = requiredMessage;
        }
      });
    }

    if (step === 2) {
      ["length_mm", "quantity"].forEach((name) => {
        if (!String(form[name] || "").trim()) {
          nextErrors[name] = requiredMessage;
        }
      });
    }

    if (step === 3) {
      if (!String(form.price_eur || "").trim()) {
        nextErrors.price_eur = requiredMessage;
      }
    }

    return nextErrors;
  };

  const validateStep = (step) => {
    const stepErrors = getStepErrors(step);
    if (Object.keys(stepErrors).length) {
      setFieldErrors((prev) => ({ ...prev, ...stepErrors }));
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, stepDefinitions.length - 1));
  };

  const handlePrevStep = () => {
    if (currentStep === 0) {
      navigate("/beams");
      return;
    }
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleTypeSelect = (selectedType) => {
    setForm((prev) => ({
      ...prev,
      beam_type: selectedType
    }));
    setFieldErrors((prev) => ({ ...prev, beam_type: "" }));
  };

  const renderError = (name) => {
    if (!fieldErrors[name]) {
      return null;
    }
    return <span className={styles.fieldError}>{fieldErrors[name]}</span>;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateStep(currentStep) || !validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const payload = normalizePayload(form);
      await createBeamRequest(payload);
      setSuccess(t.success);
      setForm(buildInitialState());
      setCurrentStep(0);
      setFieldErrors({});

      setTimeout(() => navigate("/beams"), 700);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <h1>{t.title}</h1>
      <p className="muted">{t.subtitle}</p>

      <form className={styles.formCard} onSubmit={handleSubmit}>
        <div className={styles.stepper}>
          {stepDefinitions.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            return (
              <div key={step.title} className={styles.stepperItem}>
                <div
                  className={[
                    styles.stepCircle,
                    isActive ? styles.stepCircleActive : "",
                    isCompleted ? styles.stepCircleCompleted : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span className={styles.stepLabel}>{step.title.replace(/^\d+\.\s/, "")}</span>
                {index < stepDefinitions.length - 1 && <div className={styles.stepLine} />}
              </div>
            );
          })}
        </div>

        <div className={styles.contentDivider} />

        <div className={styles.stepContent}>
          <h2>{stepDefinitions[currentStep].title}</h2>
          <p>{stepDefinitions[currentStep].description}</p>

          {currentStep === 0 && (
            <>
              <ConstructionTypeSelector value={form.beam_type} onSelect={handleTypeSelect} />
              {renderError("beam_type")}
            </>
          )}

          {currentStep === 1 && (
            <div className={styles.grid}>
              <FormField htmlFor="title" label="Pavadinimas *">
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className={styles.input}
                />
                {renderError("title")}
              </FormField>

              <FormField htmlFor="beam_type" label="Konstrukcijos tipas *">
                <input
                  id="beam_type"
                  name="beam_type"
                  value={form.beam_type}
                  readOnly
                  disabled
                  className={styles.input}
                />
                {renderError("beam_type")}
              </FormField>

              <FormField htmlFor="profile_name" label="Profilis *">
                <input
                  id="profile_name"
                  name="profile_name"
                  value={form.profile_name}
                  onChange={handleChange}
                  className={styles.input}
                />
                {renderError("profile_name")}
              </FormField>

              <FormField htmlFor="steel_grade" label="Plieno klasė *">
                <input
                  id="steel_grade"
                  name="steel_grade"
                  value={form.steel_grade}
                  onChange={handleChange}
                  className={styles.input}
                />
                {renderError("steel_grade")}
              </FormField>

              <FormField htmlFor="condition" label="Būklė *">
                <input
                  id="condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className={styles.input}
                />
                {renderError("condition")}
              </FormField>

              <FormField htmlFor="surface_coating" label="Paviršiaus padengimas">
                <input
                  id="surface_coating"
                  name="surface_coating"
                  value={form.surface_coating}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <div className={styles.fullWidth}>
                <FormField htmlFor="location" label="Vieta *">
                  <input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    className={styles.input}
                  />
                  {renderError("location")}
                </FormField>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className={styles.grid}>
              <FormField htmlFor="length_mm" label="Ilgis (mm) *">
                <input
                  id="length_mm"
                  name="length_mm"
                  type="number"
                  min="0"
                  step="1"
                  value={form.length_mm}
                  onChange={handleChange}
                  className={styles.input}
                />
                {renderError("length_mm")}
              </FormField>

              <FormField htmlFor="height_mm" label="Aukštis (mm)">
                <input
                  id="height_mm"
                  name="height_mm"
                  type="number"
                  min="0"
                  step="1"
                  value={form.height_mm}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <FormField htmlFor="width_mm" label="Plotis (mm)">
                <input
                  id="width_mm"
                  name="width_mm"
                  type="number"
                  min="0"
                  step="1"
                  value={form.width_mm}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <FormField htmlFor="web_thickness_mm" label="Sienelės storis (mm)">
                <input
                  id="web_thickness_mm"
                  name="web_thickness_mm"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.web_thickness_mm}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <FormField htmlFor="flange_thickness_mm" label="Lentynos storis (mm)">
                <input
                  id="flange_thickness_mm"
                  name="flange_thickness_mm"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.flange_thickness_mm}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <FormField htmlFor="weight_kg" label="Svoris (kg)">
                <input
                  id="weight_kg"
                  name="weight_kg"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.weight_kg}
                  onChange={handleChange}
                  className={styles.input}
                />
              </FormField>

              <FormField htmlFor="quantity" label="Kiekis *">
                <div className={styles.suffixInputWrap}>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={handleChange}
                    className={styles.input}
                  />
                  <span className={styles.suffix}>vnt.</span>
                </div>
                {renderError("quantity")}
              </FormField>
            </div>
          )}

          {currentStep === 3 && (
            <div className={styles.grid}>
              <div className={styles.fullWidth}>
                <FormField htmlFor="description" label="Aprašymas">
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className={styles.textarea}
                  />
                </FormField>
              </div>

              <FormField htmlFor="defects" label="Defektai">
                <textarea
                  id="defects"
                  name="defects"
                  value={form.defects}
                  onChange={handleChange}
                  className={styles.textarea}
                />
              </FormField>

              <FormField htmlFor="usage_history" label="Naudojimo istorija">
                <textarea
                  id="usage_history"
                  name="usage_history"
                  value={form.usage_history}
                  onChange={handleChange}
                  className={styles.textarea}
                />
              </FormField>

              <FormField htmlFor="drawings" label="Brėžiniai / failai">
                <div className={styles.uploadPlaceholder}>
                  <div className={styles.uploadIcon}>↑</div>
                  <p>Įkelkite brėžinius</p>
                  <small>PDF, DWG, JPG (maks. 10 MB)</small>
                </div>
                <input
                  id="drawings"
                  name="drawings"
                  value={form.drawings}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Nuoroda arba failo pavadinimas (nebūtina)"
                />
              </FormField>

              <FormField htmlFor="price_eur" label="Kaina (EUR) *">
                <input
                  id="price_eur"
                  name="price_eur"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_eur}
                  onChange={handleChange}
                  className={styles.input}
                />
                {renderError("price_eur")}
              </FormField>
            </div>
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrevStep}
          >
            {currentStep === 0 ? t.cancel : "Atgal"}
          </Button>

          {currentStep < stepDefinitions.length - 1 ? (
            <Button type="button" onClick={handleNextStep}>
              Kitas žingsnis
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? t.saving : "Paskelbti skelbimą"}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
};

export default CreateBeamPage;
