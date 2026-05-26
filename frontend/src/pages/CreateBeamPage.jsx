import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Button from "../components/Button.jsx";
import ConstructionTypeSelector from "../components/ConstructionTypeSelector.jsx";
import FormField from "../components/FormField.jsx";
import { createBeamRequest, getBeamRequest, updateBeamRequest } from "../api/beams.js";
import { uploadDrawingPdfRequest, uploadListingPhotoRequest } from "../api/uploads.js";
import { translations } from "../i18n/translations.js";
import { BEAM_CONDITION_OPTIONS, normalizeBeamCondition } from "../utils/beamCondition.js";
import { toAbsoluteMediaUrl } from "../utils/mediaUrl.js";
import styles from "./CreateBeamPage.module.css";

const t = translations.createBeam;
const editT = translations.editBeam;

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
    certificate_src: "",
    location: "",
    length_mm: "",
    weight_kg: "",
    height_mm: "",
    width_mm: "",
    web_thickness_mm: "",
    flange_thickness_mm: "",
    quantity: "",
    price_eur: "",
    image_src: ""
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

const LAST_STEP_INDEX = 3;

const numberFields = [
  "length_mm",
  "weight_kg",
  "height_mm",
  "width_mm",
  "web_thickness_mm",
  "flange_thickness_mm",
  "quantity",
  "price_eur"
];

const beamToForm = (beam) => {
  const form = buildInitialState();

  Object.keys(form).forEach((key) => {
    const value = beam[key];
    if (value === null || value === undefined) {
      return;
    }
    if (numberFields.includes(key)) {
      form[key] = String(value);
      return;
    }
    if (key === "condition") {
      form[key] = normalizeBeamCondition(value);
      return;
    }
    form[key] = String(value);
  });

  return form;
};

const CreateBeamPage = () => {
  const navigate = useNavigate();
  const { id: beamId } = useParams();
  const isEditing = Boolean(beamId);
  const drawingFileRef = useRef(null);
  const certificateFileRef = useRef(null);
  const listingPhotoRef = useRef(null);
  const stepRef = useRef(0);
  const [form, setForm] = useState(buildInitialState);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [drawingUploading, setDrawingUploading] = useState(false);
  const [drawingUploadError, setDrawingUploadError] = useState(null);
  const [certificateUploading, setCertificateUploading] = useState(false);
  const [certificateUploadError, setCertificateUploadError] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loadingBeam, setLoadingBeam] = useState(isEditing);

  useEffect(() => {
    stepRef.current = currentStep;
  }, [currentStep]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    let cancelled = false;

    const loadBeam = async () => {
      setLoadingBeam(true);
      setError(null);

      try {
        const beam = await getBeamRequest(beamId);
        if (!cancelled) {
          setForm(beamToForm(beam));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message || t.loadError);
        }
      } finally {
        if (!cancelled) {
          setLoadingBeam(false);
        }
      }
    };

    loadBeam();

    return () => {
      cancelled = true;
    };
  }, [beamId, isEditing]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "drawings") {
      setDrawingUploadError(null);
    }
    if (name === "certificate_src") {
      setCertificateUploadError(null);
    }
    if (name === "image_src") {
      setPhotoUploadError(null);
    }
  };

  const handleDrawingFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setDrawingUploadError(null);
    setError(null);

    try {
      setDrawingUploading(true);
      const { url } = await uploadDrawingPdfRequest(file);
      setForm((prev) => ({ ...prev, drawings: url }));
    } catch (uploadErr) {
      setDrawingUploadError(uploadErr.message);
    } finally {
      setDrawingUploading(false);
      event.target.value = "";
    }
  };

  const clearStoredDrawing = () => {
    setForm((prev) => ({ ...prev, drawings: "" }));
    setDrawingUploadError(null);
    if (drawingFileRef.current) {
      drawingFileRef.current.value = "";
    }
  };

  const handleCertificateFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setCertificateUploadError(null);
    setError(null);

    try {
      setCertificateUploading(true);
      const { url } = await uploadDrawingPdfRequest(file);
      setForm((prev) => ({ ...prev, certificate_src: url }));
    } catch (uploadErr) {
      setCertificateUploadError(uploadErr.message);
    } finally {
      setCertificateUploading(false);
      event.target.value = "";
    }
  };

  const clearStoredCertificate = () => {
    setForm((prev) => ({ ...prev, certificate_src: "" }));
    setCertificateUploadError(null);
    if (certificateFileRef.current) {
      certificateFileRef.current.value = "";
    }
  };

  const handleListingPhotoChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setPhotoUploadError(null);
    setError(null);

    try {
      setPhotoUploading(true);
      const { url } = await uploadListingPhotoRequest(file);
      setForm((prev) => ({ ...prev, image_src: url }));
    } catch (photoErr) {
      setPhotoUploadError(photoErr.message);
    } finally {
      setPhotoUploading(false);
      event.target.value = "";
    }
  };

  const clearListingPhoto = () => {
    setForm((prev) => ({ ...prev, image_src: "" }));
    setPhotoUploadError(null);
    if (listingPhotoRef.current) {
      listingPhotoRef.current.value = "";
    }
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
      if (!String(form.title || "").trim()) {
        nextErrors.title = requiredMessage;
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

  const handleFormKeyDown = (event) => {
    if (event.key !== "Enter") {
      return;
    }
    if (event.target?.tagName?.toLowerCase() === "textarea") {
      return;
    }
    if (stepRef.current >= LAST_STEP_INDEX) {
      return;
    }
    event.preventDefault();
    handleNextStep();
  };

  const handlePublish = async () => {
    if (stepRef.current !== LAST_STEP_INDEX || currentStep !== LAST_STEP_INDEX) {
      return;
    }

    if (submitting) {
      return;
    }

    if (!validateStep(currentStep) || !validateStep(0) || !validateStep(1)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const payload = normalizePayload(form);

      if (isEditing) {
        await updateBeamRequest(beamId, payload);
        setSuccess(editT.success);
        setTimeout(() => navigate("/beams"), 700);
      } else {
        await createBeamRequest(payload);
        setSuccess(t.success);
        setForm(buildInitialState());
        setCurrentStep(0);
        setFieldErrors({});
        if (drawingFileRef.current) {
          drawingFileRef.current.value = "";
        }
        if (certificateFileRef.current) {
          certificateFileRef.current.value = "";
        }
        if (listingPhotoRef.current) {
          listingPhotoRef.current.value = "";
        }

        setTimeout(() => navigate("/beams/all"), 700);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingBeam) {
    return (
      <section className={styles.page}>
        <div className={styles.state}>{editT.loading}</div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <h1>{isEditing ? editT.title : t.title}</h1>
      <p className="muted">{isEditing ? editT.subtitle : t.subtitle}</p>

      <form className={styles.formCard} onKeyDown={handleFormKeyDown} noValidate>
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

              <FormField htmlFor="profile_name" label="Profilis">
                <input
                  id="profile_name"
                  name="profile_name"
                  value={form.profile_name}
                  onChange={handleChange}
                  className={styles.input}
                />
                {renderError("profile_name")}
              </FormField>

              <FormField htmlFor="steel_grade" label="Plieno klasė">
                <input
                  id="steel_grade"
                  name="steel_grade"
                  value={form.steel_grade}
                  onChange={handleChange}
                  className={styles.input}
                />
                {renderError("steel_grade")}
              </FormField>

              <FormField htmlFor="condition" label="Būklė">
                <select
                  id="condition"
                  name="condition"
                  value={form.condition}
                  onChange={handleChange}
                  className={styles.input}
                >
                  <option value="">Pasirinkite būklę</option>
                  {BEAM_CONDITION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
                <FormField htmlFor="location" label="Vieta">
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
              <FormField htmlFor="length_mm" label="Ilgis (mm)">
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

              <FormField htmlFor="quantity" label="Kiekis">
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

              <div className={styles.fullWidth}>
                <FormField htmlFor="listing-photo" label="Nuotrauka">
                  <input
                    ref={listingPhotoRef}
                    id="listing-photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                    className={styles.hiddenFileInput}
                    onChange={handleListingPhotoChange}
                    disabled={photoUploading || submitting}
                  />
                  <button
                    type="button"
                    className={styles.uploadPlaceholder}
                    onClick={() => listingPhotoRef.current?.click()}
                    disabled={photoUploading || submitting}
                  >
                    <div className={styles.uploadIcon}>↑</div>
                    <p>{photoUploading ? "Įkeliama…" : "Paspauskite ir pasirinkite nuotrauką"}</p>
                    <small>JPG, PNG, WEBP arba GIF, iki 10 MB</small>
                  </button>
                  {photoUploadError && (
                    <span className={styles.fieldError} role="alert">
                      {photoUploadError}
                    </span>
                  )}
                  {form.image_src ? (
                    <div className={styles.photoPreviewBlock}>
                      <img
                        src={toAbsoluteMediaUrl(form.image_src)}
                        alt="Skelbimo nuotrauka"
                        className={styles.photoPreview}
                      />
                      <div className={styles.uploadMeta}>
                        <button type="button" className={styles.clearDrawingBtn} onClick={clearListingPhoto}>
                          Pašalinti nuotrauką
                        </button>
                      </div>
                    </div>
                  ) : null}
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

              <FormField htmlFor="drawing-file" label="Brėžiniai / failai (PDF)">
                <input
                  ref={drawingFileRef}
                  id="drawing-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  className={styles.hiddenFileInput}
                  onChange={handleDrawingFileChange}
                  disabled={drawingUploading || submitting}
                />
                <button
                  type="button"
                  className={styles.uploadPlaceholder}
                  onClick={() => drawingFileRef.current?.click()}
                  disabled={drawingUploading || submitting}
                >
                  <div className={styles.uploadIcon}>↑</div>
                  <p>{drawingUploading ? "Įkeliama…" : "Paspauskite ir pasirinkite PDF"}</p>
                  <small>Tik PDF formatas, iki 10 MB</small>
                </button>
                {drawingUploadError && (
                  <span className={styles.fieldError} role="alert">
                    {drawingUploadError}
                  </span>
                )}
                {form.drawings ? (
                  <div className={styles.uploadMeta}>
                    <a
                      href={toAbsoluteMediaUrl(form.drawings)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.uploadLink}
                    >
                      Peržiūrėti įkeltą PDF
                    </a>
                    <button type="button" className={styles.clearDrawingBtn} onClick={clearStoredDrawing}>
                      Pašalinti
                    </button>
                  </div>
                ) : null}
                <label htmlFor="drawings" className={styles.optionalLinkLabel}>
                  Arba įveskite nuorodą / užrašą (nebūtina)
                </label>
                <input
                  id="drawings"
                  name="drawings"
                  value={form.drawings}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Pvz. nuoroda į išorinį failą"
                  disabled={drawingUploading}
                />
              </FormField>

              <FormField htmlFor="certificate-file" label="Sertifikatas (PDF)">
                <input
                  ref={certificateFileRef}
                  id="certificate-file"
                  type="file"
                  accept="application/pdf,.pdf"
                  className={styles.hiddenFileInput}
                  onChange={handleCertificateFileChange}
                  disabled={certificateUploading || submitting}
                />
                <button
                  type="button"
                  className={styles.uploadPlaceholder}
                  onClick={() => certificateFileRef.current?.click()}
                  disabled={certificateUploading || submitting}
                >
                  <div className={styles.uploadIcon}>↑</div>
                  <p>{certificateUploading ? "Įkeliama…" : "Paspauskite ir pasirinkite sertifikato PDF"}</p>
                  <small>Tik PDF formatas, iki 10 MB</small>
                </button>
                {certificateUploadError && (
                  <span className={styles.fieldError} role="alert">
                    {certificateUploadError}
                  </span>
                )}
                {form.certificate_src ? (
                  <div className={styles.uploadMeta}>
                    <a
                      href={toAbsoluteMediaUrl(form.certificate_src)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.uploadLink}
                    >
                      Peržiūrėti įkeltą sertifikatą
                    </a>
                    <button type="button" className={styles.clearDrawingBtn} onClick={clearStoredCertificate}>
                      Pašalinti
                    </button>
                  </div>
                ) : null}
              </FormField>

              <FormField htmlFor="price_eur" label="Kaina (EUR)">
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
            <Button type="button" onClick={handlePublish} disabled={submitting}>
              {submitting ? t.saving : isEditing ? editT.submit : "Paskelbti skelbimą"}
            </Button>
          )}
        </div>
      </form>
    </section>
  );
};

export default CreateBeamPage;
