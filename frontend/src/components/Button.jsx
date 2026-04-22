import styles from "./Button.module.css";

const Button = ({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  onClick,
  fullWidth = false
}) => {
  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : ""
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;
