import styles from "./FormField.module.css";

const FormField = ({ label, htmlFor, hint, children }) => {
  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={htmlFor} className={styles.label}>
          {label}
        </label>
      )}
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};

export default FormField;
