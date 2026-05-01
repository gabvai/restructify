import { useCallback, useEffect, useState } from "react";

import Button from "../components/Button.jsx";
import { listAllBeamsRequest } from "../api/beams.js";
import { useCart } from "../context/CartContext.jsx";
import { translations } from "../i18n/translations.js";
import productImage1 from "../assets/images/product-1.png";
import productImage2 from "../assets/images/product-2.png";
import productImage3 from "../assets/images/product-3.png";
import productImage4 from "../assets/images/product-4.png";
import styles from "./MyListingsPage.module.css";

const t = translations.listings;
const allT = translations.allListings;
const common = translations.common;
const homeT = translations.home;
const demoProductImages = [productImage1, productImage2, productImage3, productImage4];

const parsePriceValue = (priceText) => {
  const normalized = String(priceText).replace(/[^\d.,]/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const fakeBeams = homeT.products.map((product, index) => ({
  id: `fake-${index + 1}`,
  title: product.name,
  profile_name: product.name,
  length_mm: Number(product.length.replace(/[^\d.,]/g, "").replace(",", ".")) * 1000,
  condition: "used",
  location: "Lietuva",
  price_eur: parsePriceValue(product.price),
  image_src: demoProductImages[index] ?? demoProductImages[0]
}));

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

const AllListingsPage = () => {
  const [beams, setBeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  const loadBeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listAllBeamsRequest();
      const realBeams = Array.isArray(data) ? data : [];
      setBeams([...fakeBeams, ...realBeams]);
    } catch (requestError) {
      setError(requestError.message);
      // Keep demo data visible even if backend call fails.
      setBeams(fakeBeams);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBeams();
  }, [loadBeams]);

  return (
    <section>
      <div className={styles.header}>
        <div>
          <h1>{allT.title}</h1>
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
          {beams.map((beam) => (
            <li key={beam.id} className={styles.card}>
              <img
                src={beam.image_src || demoProductImages[0]}
                alt={beam.title || t.untitledBeam}
                className={styles.cardImage}
              />

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
                <Button variant="ghost" onClick={() => {}}>
                  {t.view}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    addToCart({
                      id: beam.id,
                      title: beam.title || t.untitledBeam,
                      price_eur: beam.price_eur,
                      image_src: beam.image_src || demoProductImages[0]
                    })
                  }
                >
                  {t.addToCart}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default AllListingsPage;
