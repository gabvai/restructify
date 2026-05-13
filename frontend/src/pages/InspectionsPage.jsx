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

const InspectionsPage = () => {
  const [beams, setBeams] = useState([]);
  const [selectedBeamId, setSelectedBeamId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(t.locations[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadBeams = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await listBeamsRequest();
        const allBeams = Array.isArray(data) ? data : [];
        const uncertified = allBeams.filter((beam) => !hasCertificate(beam));
        setBeams(uncertified);
        setSelectedBeamId(uncertified[0]?.id ? String(uncertified[0].id) : "");
      } catch (requestError) {
        setBeams([]);
        setSelectedBeamId("");
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
  const unitPrice = selectedLocation?.price || 0;
  const totalPrice = unitPrice * Math.max(1, Number(quantity) || 1);

  const handleSubmit = (event) => {
    event.preventDefault();
    setSuccess(t.success);
  };

  return (
    <section className={styles.page}>
      <h1>{t.title}</h1>
      <p className="muted">{t.subtitle}</p>

      <form className={styles.formCard} onSubmit={handleSubmit}>
        {loading && <p className={styles.state}>Kraunama...</p>}
        {!loading && error && <p className={styles.error}>{error}</p>}

        {!loading && !error && beams.length === 0 && <p className={styles.state}>{t.empty}</p>}

        {!loading && !error && beams.length > 0 && (
          <div className={styles.grid}>
            <FormField htmlFor="inspection-beam" label={t.constructionLabel}>
              <div id="inspection-beam" className={styles.beamList}>
                {beams.map((beam, index) => {
                  const beamId = String(beam.id);
                  const isSelected = selectedBeamId === beamId;
                  const image = beam.image_src || "/tab-logo.png";

                  return (
                    <button
                      key={beam.id}
                      type="button"
                      className={`${styles.beamCard} ${isSelected ? styles.beamCardSelected : ""}`}
                      onClick={() => setSelectedBeamId(beamId)}
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

            {success && <div className={styles.success}>{success}</div>}

            <div className={styles.actions}>
              <Button type="submit">{t.orderButton}</Button>
            </div>
          </div>
        )}
      </form>
    </section>
  );
};

export default InspectionsPage;
