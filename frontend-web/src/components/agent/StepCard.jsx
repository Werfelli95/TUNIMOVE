import React from "react";

const StepCard = ({ title, children, visible = true }) => {
  if (!visible) return null;

  return (
    <div className="step-card">
      <h3>{title}</h3>
      {children}
    </div>
  );
};

export default StepCard;
