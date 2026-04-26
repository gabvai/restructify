import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { translations } from "../i18n/translations.js";
import styles from "./Navbar.module.css";

const t = translations.nav;

const navItems = [
  { to: "/", label: t.home, end: true },
  { to: "/education", label: t.education },
  { to: "/beams/new", label: t.createBeam },
  { to: "/beams", label: t.myListings }
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.brand}>{t.brand}</div>

        <ul className={styles.links}>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [styles.link, isActive ? styles.linkActive : ""]
                    .filter(Boolean)
                    .join(" ")
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className={styles.userArea}>
          {user?.email && <span className={styles.userEmail}>{user.email}</span>}
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            {t.logOut}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
