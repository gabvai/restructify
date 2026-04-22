import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../components/Button.jsx";
import { listBeamsRequest } from "../api/beams.js";
import styles from "./MyListingsPage.module.css";

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? String(value) : parsed.toLocaleString();
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return String(value);
  }

  return `€${parsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const MyListingsPage = () => {
  const [beams, setBeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBeams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listBeamsRequest();
      setBeams(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(requestError.message);
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
          <h1>My Listings</h1>
          <p className="muted">All beams you have created.</p>
        </div>
        <Link to="/beams/new">
          <Button>New beam</Button>
        </Link>
      </div>

      {loading && <div className={styles.state}>Loading...</div>}

      {!loading && error && (
        <div className={styles.error}>
          {error}
          <button type="button" className={styles.retry} onClick={loadBeams}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && beams.length === 0 && (
        <div className={styles.state}>
          No listings yet. <Link to="/beams/new">Create your first beam</Link>.
        </div>
      )}

      {!loading && !error && beams.length > 0 && (
        <ul className={styles.list}>
          {beams.map((beam) => (
            <li key={beam.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.title}>{beam.title || "Untitled beam"}</h3>
                <span className={styles.price}>{formatPrice(beam.price_eur)}</span>
              </div>

              <dl className={styles.meta}>
                <div>
                  <dt>Profile</dt>
                  <dd>{beam.profile_name || "—"}</dd>
                </div>
                <div>
                  <dt>Length</dt>
                  <dd>{formatNumber(beam.length_mm)} mm</dd>
                </div>
                <div>
                  <dt>Condition</dt>
                  <dd>{beam.condition || "—"}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{beam.location || "—"}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default MyListingsPage;
