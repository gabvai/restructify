import styles from "./Input.module.css";

const Input = ({
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  step,
  min,
  autoComplete
}) => {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value ?? ""}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      step={step}
      min={min}
      autoComplete={autoComplete}
      className={styles.input}
    />
  );
};

export default Input;
