import Card from "./Card.jsx";

const FactCard = ({ icon, title, text, source }) => {
  return (
    <Card className="edu-fact-card">
      <div className="edu-fact-icon" aria-hidden>
        {icon}
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <p className="edu-source">{source}</p>
    </Card>
  );
};

export default FactCard;
