import React from "react";
import Button from "./Button";

function AddressCard({ address, btnClick }) {
  return (
    <div className="rounded-lg shadow-sm border border-gray-300 p-4 ">
      <span>{address}</span>
      <div className="flex justify-between mt-4 ">
        <Button
          btnClick={btnClick}
          btnText={"Deliver Here"}
          className={"common-btn rounded-lg px-2"}
          btnType={"button"}
        />
        <span className="text-gray-500 text-sm mt-4">22 Mins</span>
      </div>
    </div>
  );
}

export default AddressCard;
