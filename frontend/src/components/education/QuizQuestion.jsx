import Card from "./Card.jsx";

const QuizQuestion = ({ title, question, questionIndex, totalQuestions, selectedOptionId, onSelect }) => {
  const answered = selectedOptionId !== null;
  const selectedOption = question.options.find((option) => option.id === selectedOptionId);

  return (
    <Card className="edu-quiz-card">
      <div className="edu-quiz-top">
        {title ? <h2>{title}</h2> : <span />}
        <span className="edu-progress">
          {questionIndex + 1}/{totalQuestions}
        </span>
      </div>

      <p className="edu-question">{question.question}</p>

      <div className="edu-options">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          const isCorrect = option.id === question.correctOptionId;
          const stateClass = answered
            ? isCorrect
              ? "is-correct"
              : isSelected
                ? "is-wrong"
                : "is-idle"
            : "";

          return (
            <button
              key={option.id}
              type="button"
              className={`edu-option ${stateClass}`}
              disabled={answered}
              onClick={() => onSelect(option.id)}
            >
              <span className="edu-option-letter">{option.id}</span>
              {option.text}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="edu-feedback">
          <p className={selectedOption?.id === question.correctOptionId ? "edu-good" : "edu-bad"}>
            {selectedOption?.id === question.correctOptionId ? "Teisingai!" : "Ne visai."}
          </p>
          <p>{question.explanation}</p>
          {question.sourceUrl && (
            <p className="edu-feedback-source">
              Šaltinis:{" "}
              <a href={question.sourceUrl} target="_blank" rel="noreferrer">
                {question.sourceLabel ?? question.sourceUrl}
              </a>
            </p>
          )}
        </div>
      )}
    </Card>
  );
};

export default QuizQuestion;
