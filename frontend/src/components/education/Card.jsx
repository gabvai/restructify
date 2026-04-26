const Card = ({ children, className = "", as: Component = "article" }) => {
  const classes = ["edu-card", className].filter(Boolean).join(" ");
  return <Component className={classes}>{children}</Component>;
};

export default Card;
