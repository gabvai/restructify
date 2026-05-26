import { useEffect, useMemo, useState } from "react";

import Button from "../components/Button.jsx";
import FormField from "../components/FormField.jsx";
import { listBeamsRequest } from "../api/beams.js";
import { translations } from "../i18n/translations.js";
import styles from "./InspectionsPage.module.css";

const t = translations.inspections;

const hasCertificate = (beam) => {
  if (typeof beam?.has_certificate === "boolean") {
    return beam.has_certificate;
  }

  return Boolean(String(beam?.certificate_src || "").trim());
};

const formatMoney = (amount) =>
  `€${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const buildInspectionEmail = (selectedBeams, location, quantity) => {
  const constructionLines = selectedBeams
    .map((beam) => {
      const title = beam.title || t.constructionPlaceholder;
      const profile = beam.profile_name || "Profilis nenurodytas";
      return `- ${title} (${profile})`;
    })
    .join("\n");

  return [
    "Sveiki,",
    "",
    "noriu užsisakyti konstrukcijų patikrinimą.",
    "",
    "Konstrukcijos:",
    constructionLines,
    "",
    `Tikrinimo vieta: ${location.name}`,
    `Tikrinamų vienetų kiekis: ${quantity}`
  ].join("\n");
};

const InspectionsPage = () => {
  const [beams, setBeams] = useState([]);
  const [selectedBeamIds, setSelectedBeamIds] = useState(() => new Set());
  const [selectedLocationId, setSelectedLocationId] = useState(t.locations[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null);

  useEffect(() => {
    const loadBeams = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await listBeamsRequest();
        const allBeams = Array.isArray(data) ? data : [];
        const uncertified = allBeams.filter((beam) => !hasCertificate(beam));
        setBeams(uncertified);
        setSelectedBeamIds(uncertified[0]?.id ? new Set([String(uncertified[0].id)]) : new Set());
      } catch (requestError) {
        setBeams([]);
        setSelectedBeamIds(new Set());
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    };

    loadBeams();
  }, []);

  const selectedLocation = useMemo(
    () => t.locations.find((location) => location.id === selectedLocationId) || null,
    [selectedLocationId]
  );

  const selectedBeams = useMemo(
    () => beams.filter((beam) => selectedBeamIds.has(String(beam.id))),
    [beams, selectedBeamIds]
  );

  const unitPrice = selectedLocation?.price || 0;
  const totalPrice = unitPrice * Math.max(1, Number(quantity) || 1);

  const emailBody = useMemo(() => {
    if (!selectedLocation || selectedBeams.length === 0) {
      return "";
    }

    return buildInspectionEmail(selectedBeams, selectedLocation, Math.max(1, Number(quantity) || 1));
  }, [selectedBeams, selectedLocation, quantity]);

  const toggleBeamSelection = (beamId) => {
    setFormError(null);
    setSelectedBeamIds((current) => {
      const next = new Set(current);
      const id = String(beamId);

      if (next.has(id)) {
        if (next.size === 1) {
          return next;
        }
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const handleOpenEmailModal = (event) => {
    event.preventDefault();
    setFormError(null);

    if (selectedBeams.length === 0) {
      setFormError(t.noSelection);
      return;
    }

    setCopyFeedback(null);
    setIsEmailModalOpen(true);
  };

  const handleCloseEmailModal = () => {
    setIsEmailModalOpen(false);
    setCopyFeedback(null);
  };

  const copyToClipboard = async (value, feedbackKey) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyFeedback(feedbackKey);
      window.setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback("error");
    }
  };

  return (
    <section className={styles.page}>
      <h1>{t.title}</h1>
      <p className="muted">{t.subtitle}</p>

      <form className={styles.formCard} onSubmit={handleOpenEmailModal}>
        {loading && <p className={styles.state}>Kraunama...</p>}
        {!loading && error && <p className={styles.error}>{error}</p>}

        {!loading && !error && beams.length === 0 && <p className={styles.state}>{t.empty}</p>}

        {!loading && !error && beams.length > 0 && (
          <div className={styles.grid}>
            <FormField htmlFor="inspection-beam" label={t.constructionLabel}>
              <p className={styles.selectHint}>{t.selectHint}</p>
              <div id="inspection-beam" className={styles.beamList}>
                {beams.map((beam) => {
                  const beamId = String(beam.id);
                  const isSelected = selectedBeamIds.has(beamId);
                  const image = beam.image_src || "/tab-logo.png";

                  return (
                    <button
                      key={beam.id}
                      type="button"
                      className={`${styles.beamCard} ${isSelected ? styles.beamCardSelected : ""}`}
                      onClick={() => toggleBeamSelection(beam.id)}
                      aria-pressed={isSelected}
                    >
                      <img src={image} alt={beam.title || t.constructionPlaceholder} className={styles.beamImage} />
                      <div className={styles.beamBody}>
                        <p className={styles.beamTitle}>{beam.title || t.constructionPlaceholder}</p>
                        <p className={styles.beamMeta}>{beam.profile_name || "Profilis nenurodytas"}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </FormField>

            <FormField htmlFor="inspection-location" label={t.locationLabel}>
              <select
                id="inspection-location"
                value={selectedLocationId}
                onChange={(event) => setSelectedLocationId(event.target.value)}
                className={styles.input}
                required
              >
                {t.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField htmlFor="inspection-quantity" label={t.quantityLabel} hint={t.quantityHint}>
              <input
                id="inspection-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className={styles.input}
                required
              />
            </FormField>

            <div className={styles.prices}>
              <p>
                <span>{t.priceLabel}:</span> <strong>{formatMoney(unitPrice)}</strong>
              </p>
              <p>
                <span>{t.totalLabel}:</span> <strong>{formatMoney(totalPrice)}</strong>
              </p>
            </div>

            {formError && <p className={styles.error}>{formError}</p>}

            <div className={styles.actions}>
              <Button type="submit">{t.orderButton}</Button>
            </div>
          </div>
        )}
      </form>

      {isEmailModalOpen && selectedLocation && (
        <div className={styles.modalOverlay} role="presentation" onClick={handleCloseEmailModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-labelledby="inspection-email-title"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="inspection-email-title" className={styles.modalTitle}>
              {t.emailModal.title}
            </h2>

            <div className={styles.recipientBlock}>
              <span className={styles.fieldLabel}>{t.emailModal.recipientLabel}</span>
              <div className={styles.recipientRow}>
                <a href={`mailto:${selectedLocation.email}`} className={styles.recipientEmail}>
                  {selectedLocation.email}
                </a>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyToClipboard(selectedLocation.email, "email")}
                >
                  {copyFeedback === "email" ? t.emailModal.copied : t.emailModal.copyEmail}
                </Button>
              </div>
            </div>

            <div className={styles.bodyBlock}>
              <div className={styles.bodyHeader}>
                <span className={styles.fieldLabel}>{t.emailModal.bodyLabel}</span>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => copyToClipboard(emailBody, "body")}
                >
                  {copyFeedback === "body" ? t.emailModal.copied : t.emailModal.copyBody}
                </Button>
              </div>
              <textarea
                className={styles.emailTextarea}
                readOnly
                value={emailBody}
                rows={12}
                onFocus={(event) => event.target.select()}
              />
            </div>

            <div className={styles.modalActions}>
              <Button type="button" onClick={handleCloseEmailModal}>
                {t.emailModal.close}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default InspectionsPage;
