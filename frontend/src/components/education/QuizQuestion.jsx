import Card from "./Card.jsx";

const QuizQuestion = ({ question, questionIndex, totalQuestions, selectedOptionId, onSelect }) => {
  const answered = selectedOptionId !== null;
  const selectedOption = question.options.find((option) => option.id === selectedOptionId);

  return (
    <Card className="edu-quiz-card">
      <div className="edu-quiz-top">
        <h2>Testas zinioms</h2>
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
        </div>
      )}
    </Card>
  );
};

export default QuizQuestion;
