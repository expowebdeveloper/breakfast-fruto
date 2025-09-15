import { BUTTON_LOADER } from "@/_Svgs/Svg";
import React from "react";

const Button = ({ className, btnText, btnType, btnClick,btnLoader, disabled ,icon}) => {
  return (
    <div>
      <button
      className={className}
      type={btnType}
      onClick={btnClick}
      disabled={disabled}
    >
      <span className="flex-none icon-back">{icon}</span>
      {btnText}
      {btnLoader && BUTTON_LOADER}
    </button>
    </div>
  );
};

export default Button;
