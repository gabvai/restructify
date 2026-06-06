import Card from "./Card.jsx";

const Checklist = ({ title, items }) => {
  return (
    <Card>
      <h2>{title}</h2>
      <ul className="edu-checklist">
        {items.map((item) => (
          <li key={item}>
            <span className="edu-tick" aria-hidden>
              ✓
            </span>
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default Checklist;
