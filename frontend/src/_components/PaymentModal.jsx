import { cautionIcon, X_Mark } from "@/_Svgs/Svg";
import React from "react";
import { T } from "@/_utils/LanguageTranslator";
import CommonButton from "./_common/CommonButton";
import { paymentIcon } from "@/Assets/Icons/Svg";

const PaymentModal = ({ onPayByCard, onGenerateInvoice, onCancel, loader }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-10 w-full shadow-lg max-w-[800px] relative delete_modal">
        {/* Close Icon */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
          aria-label="Close"
        >
          {/* Or use: <span className="text-2xl">&times;</span> */}
          {X_Mark}
        </button>

        {/* Caution Icon */}
        <div className="flex justify-center">
          <div className="rounded-full w-20 h-20 flex items-center justify-center">
            {/* {paymentIcon} */}
            <img src="/images/card-payment.png"/>
            
          </div>
        </div>

        {/* Title */}
        <h2 className="text-[27px] mb-0 font-semibold text-center text-gray-900 mt-4">
          {T["confirm_your_order"]}
        </h2>

        {/* Description */}
        <p className="text-base text-center text-gray-600 mt-1">
          {T["payment_proceed_message"]}
        </p>

        {/* Buttons */}
        <div className="flex justify-center mt-6 space-x-3">
          <CommonButton
            text={T["pay_by_card"] || "Pay by Card"}
            onClick={onPayByCard}
            type="button"
            className="bg-green-600 text-white py-2 px-4 rounded-md flex items-center gap-2 flex-row-reverse"
            disabled={loader}
            loader={loader}
          />

          <CommonButton
            text={T["generate_invoice"] || "Generate Invoice"}
            onClick={onGenerateInvoice}
            type="button"
            className="bg-green-500 text-white py-2 px-4 rounded-md flex items-center gap-2 flex-row-reverse"
            disabled={loader}
            loader={loader}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
