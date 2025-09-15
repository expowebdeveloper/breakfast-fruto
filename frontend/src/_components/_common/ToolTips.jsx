import React from "react";

const ToolTips = ({ text, children, position = "bottom" }) => {
  const positionClasses = {
    top: "bottom-full mb-2",
    bottom: "top-full mt-2",
    left: "right-full mr-2",
    right: "left-full ml-2",
  };

  return (
    <div className="relative flex items-center group">
      {children}
      <div
        className={`absolute whitespace-nowrap bg-gray-800 text-white text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-0.5 sm:py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-w-[200px] sm:max-w-none break-words sm:whitespace-nowrap text-center sm:text-left lg:block hidden  ${positionClasses[position]}`}
      >
        {text}
      </div>
    </div>
  );
};

export default ToolTips;
