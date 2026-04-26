import { useMemo, useState } from "react";
import styles from "./ConstructionTypeSelector.module.css";

const defaultTypes = [
  {
    value: "Sija",
    title: "Sija",
    description: "Horizontalus konstrukcijos elementas, laikantis lenkimą.",
    image: "/assets/beam.png",
    icon: "🟰"
  },
  {
    value: "Kolona",
    title: "Kolona",
    description: "Vertikalus konstrukcijos elementas, laikantis gniuždymą.",
    image: "/assets/column.png",
    icon: "🧱"
  },
  {
    value: "Santvara",
    title: "Santvara",
    description: "Konstrukcija iš strypų, sujungtų į trikampius.",
    image: "/assets/truss.png",
    icon: "△"
  }
];

const ConstructionTypeSelector = ({ value, onSelect, options = defaultTypes }) => {
  const initialMissing = useMemo(
    () =>
      options.reduce((acc, option) => {
        acc[option.value] = false;
        return acc;
      }, {}),
    [options]
  );
  const [missingImages, setMissingImages] = useState(initialMissing);

  const markAsMissing = (optionValue) => {
    setMissingImages((prev) => ({ ...prev, [optionValue]: true }));
  };

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {options.map((option) => {
          const selected = value === option.value;
          const imageMissing = missingImages[option.value];

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className={[styles.card, selected ? styles.selected : ""].filter(Boolean).join(" ")}
              aria-pressed={selected}
            >
              {selected && <span className={styles.check}>✓</span>}

              <div className={styles.imageWrap}>
                {imageMissing ? (
                  <div className={styles.placeholder} aria-hidden="true">
                    <span>{option.icon}</span>
                  </div>
                ) : (
                  <img
                    src={option.image}
                    alt={option.title}
                    className={styles.image}
                    onError={() => markAsMissing(option.value)}
                  />
                )}
              </div>

              <h3 className={styles.title}>{option.title}</h3>
              <p className={styles.description}>{option.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConstructionTypeSelector;
