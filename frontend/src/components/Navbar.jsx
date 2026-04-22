import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import styles from "./Navbar.module.css";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/beams/new", label: "Create Beam" },
  { to: "/beams", label: "My Listings" }
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
        <div className={styles.brand}>Restructify</div>

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
            Log out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
