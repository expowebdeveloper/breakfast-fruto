import React from "react";

const Badge = ({ badgeName, bgColor, textColor }) => {
  return (
    <div>
      <span
        className={`bg-${bgColor} text-${textColor} text-xs font-medium me-2 px-2.5 py-1.5 rounded-full dark:bg-${bgColor}-900 dark:text-white-300`}
      >
        {badgeName}
      </span>
    </div>
  );
};

export default Badge;
