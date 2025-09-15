import React from "react";
import CommonButton from "./CommonButton";
import { useLocation, useNavigate } from "react-router-dom";
import { backArrow } from "../../assets/Icons/Svg";

const BackButton = ({ text = "Go Back", prevRoute }) => {
  const navigate = useNavigate();
  const location = useLocation();
  console.log(location?.pathname, "this is pathname");
  return (
    <div>
      <CommonButton
        text={text}
        className="flex mr-4 mb-2 white-nowrap items-center gap-2 px-4 py-2 text-white bg-[#01A933] hover:bg-[#01A933] active:bg-[#01A933] rounded-lg shadow-md transition-all duration-300"
        type="button"
        onClick={() => navigate(prevRoute)}
        icon={backArrow}
      />
    </div>
  );
};

export default BackButton;
