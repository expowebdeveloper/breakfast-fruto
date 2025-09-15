import React from "react";
import CommonButton from "./Common/CommonButton";

const DiscountOptionCard = ({ option, handleRedirection }) => {
  const { title, description, buttonText, icon } = option;
  return (
    <div>
      <div className="bg-[#F0F0F0] rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-base font-medium text-[#3E3232]">{title}</h3>
        <p className="text-[#000000] text-sm mb-4">{description}</p>
        <CommonButton
          text={buttonText}
          className="orange_btn"
          type="button"
          onClick={() => {
            handleRedirection(title);
          }}
          icon={icon}
        />
      </div>
    </div>
  );
};

export default DiscountOptionCard;
