import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getBeamPublicRequest } from "../api/beams.js";
import { useCart } from "../context/CartContext.jsx";
import styles from "./BeamDetailsPage.module.css";

const TABS = [
  { id: "description", label: "Aprasymas" },
  { id: "defects", label: "Defektai" },
  { id: "usage_history", label: "Naudojimo istorija" },
  { id: "docs", label: "Breziniai ir dokumentai" }
];

const formatValue = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const parsed = Number(value);
  const text = Number.isNaN(parsed) ? String(value) : parsed.toLocaleString();
  return suffix ? `${text} ${suffix}` : text;
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return String(value);
  }
  return `${parsed.toLocaleString()} €`;
};

const BeamDetailsPage = () => {
  const { id } = useParams();
  const [beam, setBeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("description");
  const { addToCart } = useCart();

  useEffect(() => {
    const loadBeam = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBeamPublicRequest(id);
        setBeam(data || null);
      } catch (requestError) {
        setError(requestError.message);
        setBeam(null);
      } finally {
        setLoading(false);
      }
    };
    loadBeam();
  }, [id]);

  const specs = useMemo(
    () => [
      ["Ilgis", formatValue(beam?.length_mm, "mm")],
      ["Svoris", formatValue(beam?.weight_kg, "kg")],
      ["Aukstis", formatValue(beam?.height_mm, "mm")],
      ["Plotis", formatValue(beam?.width_mm, "mm")],
      ["Plieno klase", beam?.steel_grade || "-"],
      ["Bukle", beam?.condition || "-"],
      ["Kiekis", formatValue(beam?.quantity, "vnt.")],
      ["Vieta", beam?.location || "-"]
    ],
    [beam]
  );

  const tabContent = useMemo(() => {
    if (!beam) {
      return null;
    }
    if (activeTab === "description") {
      return <p>{beam.description || "-"}</p>;
    }
    if (activeTab === "defects") {
      return <p>{beam.defects || "-"}</p>;
    }
    if (activeTab === "usage_history") {
      return <p>{beam.usage_history || "-"}</p>;
    }
    return (
      <div className={styles.docsList}>
        {beam.drawings ? (
          <a href={beam.drawings} target="_blank" rel="noopener noreferrer">
            Atidaryti brezinio faila (PDF)
          </a>
        ) : (
          <span>Breziniai: -</span>
        )}
        {beam.certificate_src ? (
          <a href={beam.certificate_src} target="_blank" rel="noopener noreferrer">
            Atidaryti sertifikata (PDF)
          </a>
        ) : (
          <span>Sertifikatas: -</span>
        )}
      </div>
    );
  }, [activeTab, beam]);

  if (loading) {
    return <section className={styles.state}>Kraunama...</section>;
  }

  if (error || !beam) {
    return (
      <section className={styles.state}>
        <p>{error || "Skelbimas nerastas."}</p>
        <Link to="/beams/all" className={styles.backLink}>
          Grizti i skelbimus
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link to="/beams/all">Skelbimai</Link>
        <span>&gt;</span>
        <span>Sijos</span>
        <span>&gt;</span>
        <strong>{beam.title || "Sija"}</strong>
      </nav>

      <div className={styles.topGrid}>
        <div className={styles.mediaCol}>
          <div className={styles.imageWrap}>
            <span className={styles.badge}>Patvirtinta</span>
            <img src={beam.image_src || "/tab-logo.png"} alt={beam.title || "Sija"} className={styles.heroImage} />
          </div>
          <div className={styles.thumbRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <button key={index} type="button" className={styles.thumbBtn}>
                <img src={beam.image_src || "/tab-logo.png"} alt={`Miniatura ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>

        <div className={styles.infoCard}>
          <h1>{beam.title || "Sija"}</h1>
          <div className={styles.priceRow}>
            <p className={styles.price}>{formatPrice(beam.price_eur)}</p>
            <span>Kaina be PVM</span>
          </div>

          <dl className={styles.specTable}>
            {specs.map(([label, value]) => (
              <div key={label} className={styles.specRow}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() =>
                addToCart({
                  id: beam.id,
                  title: beam.title || "Sija",
                  price_eur: beam.price_eur,
                  image_src: beam.image_src || "/tab-logo.png"
                })
              }
            >
              I krepseli
            </button>
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.tabsSection}>
          <div className={styles.tabs}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={styles.tabPanel}>{tabContent}</div>
        </div>

        <aside className={styles.sellerCard}>
          <div className={styles.sellerTop}>
            <div className={styles.logo}>{(beam.seller_name || "P").slice(0, 1).toUpperCase()}</div>
            <div className={styles.sellerInfo}>
              <h3>{beam.seller_name || "Pardavejas"}</h3>
            </div>
          </div>
          <Link to={`/beams/seller/${beam.user_id}`} className={styles.sellerListingsLink}>
            Perziureti visus skelbimus
          </Link>
          <div className={styles.sellerContact}>
            <h4>Susisiekimas su pardaveju</h4>
            <p>
              <span>El. paštas</span>
              {beam.seller_email ? (
                <a href={`mailto:${beam.seller_email}`}>{beam.seller_email}</a>
              ) : (
                "-"
              )}
            </p>
            <p>
              <span>Tel.</span>
              {beam.seller_phone ? (
                <a href={`tel:${beam.seller_phone}`}>{beam.seller_phone}</a>
              ) : (
                "-"
              )}
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default BeamDetailsPage;
