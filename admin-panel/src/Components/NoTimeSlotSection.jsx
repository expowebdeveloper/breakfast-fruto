import React from "react";
import { T } from "../utils/languageTranslator";
import CommonButton from "./Common/CommonButton";

const NoTimeSlotSection = ({ onClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-xl font-semibold">{T["no_time_slot_configured"]}</h1>
      <p className="text-sm text-gray-500">
        {T["no_time_slot_configured_description"]}
      </p>
      <CommonButton
        text={T["add_time_slot"]}
        onClick={onClick}
        className="mt-4 orange_btn"
      />
    </div>
  );
};

export default NoTimeSlotSection;
