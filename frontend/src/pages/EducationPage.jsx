import { useMemo, useState } from "react";

import steelStructureImage from "../assets/images/steel-structure.png";
import Checklist from "../components/education/Checklist.jsx";
import FactCard from "../components/education/FactCard.jsx";
import ImageChoiceCard from "../components/education/ImageChoiceCard.jsx";
import QuizQuestion from "../components/education/QuizQuestion.jsx";
import styles from "./EducationPage.module.css";

const facts = [
  {
    icon: "♻",
    title: "Statybos atliekos",
    text: "Statybos ir griovimo atliekos sudaro didele visu atlieku dali Europoje.",
    source: "Saltinis: European Commission"
  },
  {
    icon: "☁",
    title: "CO2 emisijos",
    text: "Pastatu sektorius turi didele itaka pasaulinems CO2 emisijoms.",
    source: "Saltinis: UNEP"
  },
  {
    icon: "🔁",
    title: "Pakartotinis panaudojimas",
    text: "Tinkamai ivertintos konstrukcijos gali buti naudojamos pakartotinai.",
    source: "Saltinis: Circular construction reports"
  }
];

const quizQuestions = [
  {
    id: 1,
    question: "Koks pagrindinis pernaudojimo privalumas statybose?",
    correctOptionId: "B",
    explanation: "Pakartotinis panaudojimas taupo zaliavas ir mazina atliekas.",
    options: [
      { id: "A", text: "Padideja nauju medziagu poreikis" },
      { id: "B", text: "Maziau atlieku ir mazesne CO2 tarsa" },
      { id: "C", text: "Statyba visada uztrunka ilgiau" }
    ]
  },
  {
    id: 2,
    question: "Ka reikia pirmiausia patikrinti pries naudojant sena sija?",
    correctOptionId: "A",
    explanation: "Svarbiausia ivertinti konstrukcijos bukle ir nesancias savybes.",
    options: [
      { id: "A", text: "Bukle, deformacijos ir pazeidimai" },
      { id: "B", text: "Tik spalva" },
      { id: "C", text: "Tik kaina" }
    ]
  },
  {
    id: 3,
    question: "Ar pakartotinis panaudojimas gali buti legalus?",
    correctOptionId: "C",
    explanation: "Taip, jei atitinkami standartai ir atliktas reikalingas vertinimas.",
    options: [
      { id: "A", text: "Ne, visada draudziama" },
      { id: "B", text: "Tik gyvenamuosiuose pastatuose" },
      { id: "C", text: "Taip, laikantis reikalavimu" }
    ]
  }
];

const conditionChoices = [
  { id: "A", label: "Netinkama", isCorrect: false },
  { id: "B", label: "Tinkama po valymo", isCorrect: true }
];

const reusableStructures = [
  { id: 1, label: "Plienines sijos" },
  { id: 2, label: "Betonines kolonos" },
  { id: 3, label: "Perdangos plokstes" },
  { id: 4, label: "Santvaros" }
];

const EducationPage = () => {
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
        <h1>Edukacija</h1>
        <p className="muted">Trumpai, aiskiai ir praktiskai apie konstrukciju pernaudojima.</p>
      </header>

      <section className={styles.grid}>
        <article className={styles.fullWidth}>
          <h2 className={styles.sectionTitle}>Ar zinojai?</h2>
          <div className={styles.factGrid}>
            {facts.map((fact) => (
              <FactCard key={fact.title} {...fact} />
            ))}
          </div>
        </article>

        <article className={styles.fullWidth}>
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

        <ImageChoiceCard
          title="Atspek bukle"
          imageSrc={steelStructureImage}
          imageAlt="Rudziu paveikta plienine sija"
          question="Kaip vertini sia konstrukcija?"
          choices={conditionChoices}
          selectedId={conditionAnswer}
          onSelect={setConditionAnswer}
          explanation={
            selectedCondition?.isCorrect
              ? "Teisingai. Esant pavirsinei korozijai, konstrukcija daznai gali buti naudojama po valymo ir ivertinimo."
              : "Ne visada. Jei pazeidimas pavirsinis, po valymo ir inzinerinio ivertinimo konstrukcija daznai tinkama."
          }
        />

        <Checklist
          title="Kada galima naudoti pakartotinai?"
          items={[
            "Nera deformaciju",
            "Nera giliu pazeidimu",
            "Nera stiprios korozijos",
            "Zinoma kilme (pageidautina)"
          ]}
        />

        <article className="edu-card">
          <h2>Ar tai legalu?</h2>
          <p>
            Taip, pakartotinis konstrukciju naudojimas galimas, taciau turi atitikti taikomus
            standartus ir norminius reikalavimus.
          </p>
          <p>Daznai reikalingas inzinerinis ivertinimas ir dokumentacija.</p>
          <p className={styles.legalIcon} aria-label="Balanso svarstykliu ikona">
            ⚖
          </p>
        </article>
      </section>

      <section className={styles.scrollerSection}>
        <h2 className={styles.sectionTitle}>Dazniausiai pernaudojamos konstrukcijos</h2>
        <div className={styles.scroller}>
          {reusableStructures.map((item) => (
            <article key={item.id} className={styles.scrollCard}>
              <img src={steelStructureImage} alt={item.label} />
              <p>{item.label}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export default EducationPage;
