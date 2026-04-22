import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import styles from "./HomePage.module.css";

const HomePage = () => {
  const { user } = useAuth();

  return (
    <section>
      <h1>Welcome{user?.name ? `, ${user.name}` : ""}</h1>
      <p className="muted">
        Manage your beam inventory from a single clean workspace.
      </p>

      <div className={styles.grid}>
        <Link to="/beams/new" className={styles.card}>
          <h3>Create Beam</h3>
          <p className="muted">Add a new beam listing with full specifications.</p>
        </Link>

        <Link to="/beams" className={styles.card}>
          <h3>My Listings</h3>
          <p className="muted">Browse and review the beams you have listed.</p>
        </Link>
      </div>
    </section>
  );
};

export default HomePage;
