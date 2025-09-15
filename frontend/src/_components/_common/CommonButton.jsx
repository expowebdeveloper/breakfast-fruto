"use client";
import React from "react";
import { BUTTON_TYPE } from "@/_constants/constant";
import { BUTTON_LOADER } from "@/_Svgs/Svg";

const CommonButton = ({
  loader,
  type = BUTTON_TYPE.button,
  className = "auth-btn",
  disabled = false,
  onClick,
  text,
  icon = "",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {/* <span className="flex-none icon-back">{icon}</span> */}
      {loader && BUTTON_LOADER}
      {text}
    </button>
  );
};

export default CommonButton;
