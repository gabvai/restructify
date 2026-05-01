import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { translations } from "../i18n/translations.js";
import styles from "./Navbar.module.css";

const t = translations.nav;

const navItems = [
  { to: "/", label: t.home, end: true },
  { to: "/education", label: t.education },
  { to: "/beams/all", label: t.allListings },
  { to: "/beams/new", label: t.createBeam },
  { to: "/beams", label: t.myListings }
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { items, itemCount, isCartOpen, openCart, closeCart, removeFromCart, clearCart } = useCart();
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
        <div className={styles.brand}>
          <img src="/tab-logo.png" alt={t.brand} className={styles.brandLogo} />
        </div>

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
                <span className={styles.linkContent}>
                  <span>{item.label}</span>
                </span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className={styles.userArea}>
          <button type="button" className={styles.cartIconButton} onClick={openCart} aria-label={t.cart}>
            <svg
              className={styles.cartIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M3 4H5L7.4 14.2C7.5 14.7 7.9 15 8.4 15H18.2C18.7 15 19.1 14.7 19.2 14.2L21 7H6.2"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="19" r="1.7" fill="currentColor" />
              <circle cx="17" cy="19" r="1.7" fill="currentColor" />
            </svg>
            <span className={styles.cartBadge}>{itemCount}</span>
          </button>
          {user?.email && <span className={styles.userEmail}>{user.email}</span>}
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            {t.logOut}
          </button>
        </div>
      </div>

      {isCartOpen && (
        <div className={styles.cartOverlay} role="presentation">
          <div className={styles.cartBackdrop} onClick={closeCart} />
          <div className={styles.cartModal} role="dialog">
            <h3>{translations.cart.title}</h3>

            {items.length === 0 ? (
              <p className={styles.cartEmpty}>{translations.cart.empty}</p>
            ) : (
              <ul className={styles.cartList}>
                {items.map((item) => (
                  <li key={item.id} className={styles.cartItem}>
                    <img
                      src={item.image_src || "/tab-logo.png"}
                      alt={item.title}
                      className={styles.cartItemImage}
                    />
                    <div>
                      <p className={styles.cartItemTitle}>{item.title}</p>
                      <p className={styles.cartItemMeta}>
                        {translations.cart.qty}: {item.quantity}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.cartRemove}
                      onClick={() => removeFromCart(item.id)}
                    >
                      {translations.cart.remove}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.cartActions}>
              <button type="button" className={styles.cartSecondary} onClick={clearCart}>
                {translations.cart.clear}
              </button>
              <button type="button" className={styles.cartPay} onClick={() => {}}>
                {translations.cart.pay}
              </button>
              <button type="button" className={styles.cartSecondary} onClick={closeCart}>
                {translations.cart.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
