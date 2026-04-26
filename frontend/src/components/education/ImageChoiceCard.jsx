import Card from "./Card.jsx";

const ImageChoiceCard = ({ title, imageSrc, imageAlt, question, choices, selectedId, onSelect, explanation }) => {
  const answered = selectedId !== null;

  return (
    <Card>
      <h2>{title}</h2>
      <div className="edu-image-wrap">
        <img src={imageSrc} alt={imageAlt} />
      </div>
      <p className="edu-question">{question}</p>
      <div className="edu-choice-buttons">
        {choices.map((choice) => {
          const isSelected = selectedId === choice.id;
          const isCorrect = choice.isCorrect;
          const stateClass = answered
            ? isCorrect
              ? "is-correct"
              : isSelected
                ? "is-wrong"
                : "is-idle"
            : "";

          return (
            <button
              key={choice.id}
              type="button"
              className={`edu-option ${stateClass}`}
              onClick={() => onSelect(choice.id)}
              disabled={answered}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      {answered && <p className="edu-feedback">{explanation}</p>}
    </Card>
  );
};

export default ImageChoiceCard;
