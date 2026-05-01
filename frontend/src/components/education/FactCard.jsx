import Card from "./Card.jsx";

const FactCard = ({ icon, value, title, text, source, sourceUrl }) => {
  return (
    <Card className="edu-fact-card">
      <div className="edu-fact-icon" aria-hidden>
        {icon}
      </div>
      <p className="edu-fact-value">{value}</p>
      <h3>{title}</h3>
      <p>{text}</p>
      <p className="edu-source">
        Šaltinis:{" "}
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          {source}
        </a>
      </p>
    </Card>
  );
};

export default FactCard;
