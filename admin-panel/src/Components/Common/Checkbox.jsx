import React from "react";

const Checkbox = ({
  onClick,
  checked = false,
  disabled = false,
  isProduct = false,
}) => {
  return (
    <input
      type="checkbox"
      disabled={disabled}
      id="checkbox"
      className={`${
        isProduct && "ml-4"
      }   w-6 h-6 text-blue-600 border-gray-300 rounded focus:ring-blue-500`}
      onClick={onClick}
      checked={checked}
    />
  );
};

export default Checkbox;
