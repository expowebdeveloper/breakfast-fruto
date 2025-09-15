"use client";
import { X_Mark } from "@/_Svgs/Svg";
import { T } from "@/_utils/LanguageTranslator";
import React from "react";
import CommonButton from "./_common/CommonButton";
import { getCurrentUserBasket, getTotalQuantity } from "@/_utils/helpers";
import { useSelector } from "react-redux";

const AddMoreProductModal = ({
  onClose,
  onAddMore,
  onContinue,
  remainingPrice,
  currentAvailableSpace,
}) => {
  const { selectedBasket, userBasket } = useSelector(
    (state) => state?.addToBasket
  );
  const currentUserBasket = getCurrentUserBasket(userBasket, selectedBasket);
  const remainingSpace =
    currentAvailableSpace - getTotalQuantity(currentUserBasket?.products);

    
  console.log(remainingPrice, "remainingSpace");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white p-8 rounded-xl max-w-[700px] w-full text-center border-2 border-green-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
          aria-label="Close"
        >
          {X_Mark}
        </button>

        {/* Headline */}
        <h2 className="text-[24px] sm:text-[28px] font-bold text-green-600 leading-tight">
          {T["add_this_basket_to_cart"]}
        </h2>

        <p className="text-gray-700 mt-5 text-base leading-relaxed">
          {remainingSpace > 0 && (
            <>
              {T["you_still_have"]} <strong>{remainingSpace}</strong> {remainingSpace > 1 ? T["items"] : T["item"]} {T["of_space"]}
              {remainingPrice > 0 && <> {T["and"]} </>}
            </>
          )}
          {remainingPrice > 0 && (
            <>{T["you_still_have"]}{" "}
              <strong>{remainingPrice} SEK</strong> {T["in_your_budget"]}
            </>
          )}
          {(remainingPrice > 0 || remainingSpace > 0) && <br />}
          {T["would_you_like_to"]} <strong>{T["add_more_products"]}</strong> {T["or_continue_by"]}{" "}
          <strong>{T["adding_this_basket_to_your_cart"]}</strong>?
        </p>

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <CommonButton
            text={T["add_more_products_button"]}
            onClick={onClose}
            className="bg-transparent border border-green-600 text-green-600 hover:bg-green-50 text-lg font-semibold py-2 px-6 rounded-md"
          />
          <CommonButton
            text={T["add_to_cart"]}
            onClick={onContinue}
            className="bg-green-600 hover:bg-green-700 text-white text-lg font-semibold py-2 px-6 rounded-md"
          />
        </div>
      </div>
    </div>
  );
};

export default AddMoreProductModal;
