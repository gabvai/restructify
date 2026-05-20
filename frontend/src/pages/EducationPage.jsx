import { useMemo, useState } from "react";

import steelStructureImage from "../assets/images/education-condition-rusted-beam.png";
import Checklist from "../components/education/Checklist.jsx";
import FactCard from "../components/education/FactCard.jsx";
import ImageChoiceCard from "../components/education/ImageChoiceCard.jsx";
import QuizQuestion from "../components/education/QuizQuestion.jsx";
import { translations } from "../i18n/translations.js";
import styles from "./EducationPage.module.css";

const conditionChoices = [
  { id: "A", label: "Netinkama", isCorrect: false },
  { id: "B", label: "Tinkama po valymo", isCorrect: true }
];

const EducationPage = () => {
  const t = translations.education;
  const quizQuestions = t.quiz.questions;
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [conditionAnswer, setConditionAnswer] = useState(null);

  const currentQuestion = quizQuestions[quizIndex];
  const selectedOptionId = quizAnswers[currentQuestion.id] ?? null;
  const selectedCondition = useMemo(
    () => conditionChoices.find((choice) => choice.id === conditionAnswer),
    [conditionAnswer]
  );

  const handleQuizSelect = (optionId) => {
    setQuizAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const goToNextQuestion = () => {
    setQuizIndex((prev) => Math.min(prev + 1, quizQuestions.length - 1));
  };

  const goToPreviousQuestion = () => {
    setQuizIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <aside className={styles.quoteImageCard}>
          <img src="/education-quote-hero.png" alt={t.quoteImageAlt} className={styles.quoteImage} />
        </aside>
      </header>

      <section className={styles.grid}>
        <article className={styles.fullWidth}>
          <h2 className={`${styles.sectionTitle} ${styles.centeredSectionTitle}`}>{t.factsTitle}</h2>
          <div className={styles.factGrid}>
            {t.facts.map((fact) => (
              <FactCard key={fact.title} {...fact} />
            ))}
          </div>
        </article>

        <article className={styles.fullWidth}>
          <section className={styles.examplesSection} aria-labelledby="realus-pavyzdziai-title">
            <h2
              id="realus-pavyzdziai-title"
              className={`${styles.sectionTitle} ${styles.centeredSectionTitle}`}
            >
              {t.examples.title}
            </h2>
            <p className={styles.examplesIntro}>{t.examples.description}</p>

            <article className={styles.exampleCard}>
              <img
                src="/education-real-example.png"
                alt={t.examples.card.imageAlt}
                className={styles.exampleImage}
              />

              <div className={styles.exampleBody}>
                <h3>{t.examples.card.title}</h3>
                <p>{t.examples.card.text}</p>

                <p className={styles.exampleSubheading}>{t.examples.card.processTitle}</p>
                <ul className={styles.exampleProcessList}>
                  {t.examples.card.process.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>

                <p className={styles.exampleSubheading}>{t.examples.card.impactTitle}</p>
                <ul className={styles.exampleProcessList}>
                  {t.examples.card.impact.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <p className={styles.exampleSource}>
                  Šaltinis:{" "}
                  <a href={t.examples.card.sourceUrl} target="_blank" rel="noreferrer">
                    {t.examples.card.source}
                  </a>
                </p>
              </div>
            </article>
          </section>
        </article>

        <article className={styles.fullWidth}>
          <section className={styles.quizSection}>
            <h2 className={`${styles.sectionTitle} ${styles.centeredSectionTitle}`}>{t.quiz.title}</h2>
          </section>

          <QuizQuestion
            question={currentQuestion}
            questionIndex={quizIndex}
            totalQuestions={quizQuestions.length}
            selectedOptionId={selectedOptionId}
            onSelect={handleQuizSelect}
          />
          <div className={styles.quizNav}>
            <button
              type="button"
              onClick={goToPreviousQuestion}
              className={styles.navButton}
              disabled={quizIndex === 0}
            >
              Atgal
            </button>
            <button
              type="button"
              onClick={goToNextQuestion}
              className={styles.navButton}
              disabled={quizIndex === quizQuestions.length - 1}
            >
              Kitas
            </button>
          </div>
        </article>

        <div className={styles.conditionGuess}>
          <ImageChoiceCard
            title="Atspėk būklę"
            imageSrc={steelStructureImage}
            imageAlt="Rūdžių paveikta plieninė sija"
            question="Kaip vertini šią konstrukciją?"
            choices={conditionChoices}
            selectedId={conditionAnswer}
            onSelect={setConditionAnswer}
            explanation={
              selectedCondition?.isCorrect
                ? "Teisingai. Esant paviršinei korozijai, konstrukcija dažnai gali būti naudojama po valymo ir įvertinimo."
                : "Ne visada. Jei pažeidimas paviršinis, po valymo ir inžinerinio įvertinimo konstrukcija dažnai būna tinkama."
            }
          />
        </div>

        <div className={styles.plainChecklist}>
          <Checklist
            title="Kada galima naudoti pakartotinai?"
            items={[
              "Nėra deformacijų",
              "Nėra gilių pažeidimų",
              "Nėra stiprios korozijos",
              "Žinoma kilmė (pageidautina)"
            ]}
          />
        </div>

        <article className={styles.legalSection}>
          <h2>Ar tai legalu?</h2>
          <p>
            Taip, pakartotinis konstrukcijų naudojimas galimas, tačiau turi atitikti taikomus
            standartus ir norminius reikalavimus.
          </p>
          <p>Dažnai reikalingas inžinerinis įvertinimas ir dokumentacija.</p>
          <p className={styles.legalIcon} aria-label="Balanso svarstyklių ikona">
            ⚖
          </p>
        </article>
      </section>
    </section>
  );
};

export default EducationPage;
