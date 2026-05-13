import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Button from "../components/Button.jsx";
import { listAllBeamsRequest, listSellerBeamsRequest } from "../api/beams.js";
import { useCart } from "../context/CartContext.jsx";
import { translations } from "../i18n/translations.js";
import styles from "./MyListingsPage.module.css";

const t = translations.listings;
const allT = translations.allListings;
const common = translations.common;

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return common.emptyValue;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? String(value) : parsed.toLocaleString();
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return common.emptyValue;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return String(value);
  }

  return `€${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const hasCertificate = (beam) => {
  if (typeof beam?.has_certificate === "boolean") {
    return beam.has_certificate;
  }

  return Boolean(String(beam?.certificate_src || "").trim());
};

const AllListingsPage = () => {
  const { sellerId } = useParams();
  const [beams, setBeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  const loadBeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = sellerId ? await listSellerBeamsRequest(sellerId) : await listAllBeamsRequest();
      setBeams(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message);
      setBeams([]);
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    loadBeams();
  }, [loadBeams]);

  return (
    <section>
      <div className={styles.header}>
        <div>
          <h1>{sellerId ? "Pardavėjo skelbimai" : allT.title}</h1>
          <p className="muted">{allT.subtitle}</p>
        </div>
        <Button variant="secondary" onClick={() => {}}>
          {allT.filter}
        </Button>
      </div>

      {loading && <div className={styles.state}>{t.loading}</div>}

      {!loading && error && beams.length === 0 && (
        <div className={styles.error}>
          {error}
          <button type="button" className={styles.retry} onClick={loadBeams}>
            {t.retry}
          </button>
        </div>
      )}

      {!loading && beams.length === 0 && <div className={styles.state}>{t.emptyPrefix}</div>}

      {!loading && beams.length > 0 && (
        <ul className={styles.list}>
          {beams.map((beam) => {
            const certificatePresent = hasCertificate(beam);

            return (
            <li key={beam.id} className={styles.card}>
              <div className={styles.cardMedia}>
                <img
                  src={beam.image_src || "/tab-logo.png"}
                  alt={beam.title || t.untitledBeam}
                  className={styles.cardImage}
                />
              </div>

              <div className={styles.cardHeader}>
                <h3 className={styles.title}>{beam.title || t.untitledBeam}</h3>
                <span className={styles.price}>{formatPrice(beam.price_eur)}</span>
              </div>

              <dl className={styles.meta}>
                <div>
                  <dt>{t.profile}</dt>
                  <dd>{beam.profile_name || common.emptyValue}</dd>
                </div>
                <div>
                  <dt>{t.length}</dt>
                  <dd>{formatNumber(beam.length_mm)} mm</dd>
                </div>
                <div>
                  <dt>{t.condition}</dt>
                  <dd>{beam.condition || common.emptyValue}</dd>
                </div>
                <div>
                  <dt>{t.location}</dt>
                  <dd>{beam.location || common.emptyValue}</dd>
                </div>
              </dl>

              <div className={styles.cardActions}>
                <Link to={`/beams/all/${beam.id}`}>
                  <Button variant="ghost">{t.view}</Button>
                </Link>
                <button
                  type="button"
                  className={`${styles.certificateButton} ${
                    certificatePresent ? styles.certificateYes : styles.certificateNo
                  }`}
                >
                  <span className={styles.certificateLabel}>
                    <span
                      aria-hidden
                      className={certificatePresent ? styles.certificateIconYes : styles.certificateIconNo}
                    >
                      {certificatePresent ? "✓" : "✕"}
                    </span>
                    {certificatePresent ? t.withCertificate : t.withoutCertificate}
                  </span>
                </button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    addToCart({
                      id: beam.id,
                      title: beam.title || t.untitledBeam,
                      price_eur: beam.price_eur,
                      image_src: beam.image_src || "/tab-logo.png"
                    })
                  }
                >
                  {t.addToCart}
                </Button>
              </div>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default AllListingsPage;
