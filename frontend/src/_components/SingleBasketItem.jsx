import { ARROW_ICON, imagePlaceholder, trashIcon } from "@/_Svgs/Svg";
import { createPreview } from "@/_utils/helpers";
import React, { useState } from "react";
import SingleBasketNestedProduct from "./SingleBasketNestedProduct";
import CartDeleteIcon from "./CartDeleteIcon";
import {
  BASKET_CLOSED_EYE,
  BASKET_OPEN_EYE,
} from "../../public/images/SvgIcons";

const SingleBasketItem = ({
  data,
  addBasketToCart,
  addProductToBasket,
  onRemoveItemClick = () => {},
}) => {
  const is_customizable = data?.basket_details?.is_customizable;
  console.log(is_customizable, "is_customizableis_customizable");
  const [isExpanded, setIsExpanded] = useState(false);
  const basket_details = data?.basket_details;
  const user_basket_id = basket_details?.id;
  const basket_name = basket_details?.basket_name || "";
  const price = data?.item_price || "0.00";
  const quantity = data?.quantity || "0";
  const basket_image = basket_details?.image || "";
  const basket_products = data?.basket_products || [];

  const handleQuantityChange = (newQuantity) => {
    addBasketToCart(basket_details?.id, newQuantity, data?.id);
  };

  return (
    <div className="p-0 flex flex-col rounded-lg border mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-3 sm:p-4">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto mb-3 sm:mb-0">
          <div className="image flex-shrink-0">
            {basket_image ? (
              <img
                src={createPreview(basket_image)}
                alt={basket_name}
                className="w-[56px] h-[56px] rounded-lg object-cover"
              />
            ) : (
              <div className="basket-imagePlaceholder w-[56px] h-[56px] rounded-lg">
                {imagePlaceholder}
              </div>
            )}
          </div>
          <div className="flex items-start gap-2 flex-grow sm:flex-grow-0">
            <div className="name-price">
              <p className="font-bold text-black capitalize text-sm sm:text-base">{basket_name}</p>
              <p className="text-green-500 text-base sm:text-lg">{price} SEK</p>
            </div>
            <span
              className="cursor-pointer text-base sm:text-lg text-gray-600 bg-[#4BAF50] py-1 px-2 sm:py-[2px] sm:px-[10px] rounded-sm eye-icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? BASKET_CLOSED_EYE : BASKET_OPEN_EYE}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {is_customizable && (
            <div className="items-center bg-white border rounded-lg border-gray-100 gap-1 p-1 sm:p-[4px] border-black flex">
              <span
                onClick={() => handleQuantityChange(quantity - 1)}
                className={`cursor-pointer text-xl sm:text-2xl w-6 sm:w-[1rem] h-6 sm:h-[1rem] flex-none flex items-center justify-center rounded-full text-[14px] sm:text-[16px] m-0 ${
                  quantity === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                -
              </span>
              <span className="w-6 sm:w-[1rem] h-6 sm:h-[1rem] flex items-center justify-center text-[14px] sm:text-[16px] m-0">
                {quantity}
              </span>
              <span
                onClick={() => handleQuantityChange(quantity + 1)}
                className="cursor-pointer text-xl sm:text-2xl w-6 sm:w-[1rem] h-6 sm:h-[1rem] flex-none flex items-center justify-center text-[14px] sm:text-[16px] m-0 text-[#4BAF50]"
              >
                +
              </span>
            </div>
          )}

          <CartDeleteIcon
            onClick={() => {
              onRemoveItemClick(data?.id);
            }}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="rounded-lg w-full p-3 sm:p-4 border-t">
          {basket_products.length > 0 ? (
            basket_products.map((product) => (
              <SingleBasketNestedProduct
                key={product.id}
                data={product}
                addProductToBasket={addProductToBasket}
                user_basket_id={user_basket_id}
                isCustomizable={is_customizable}
              />
            ))
          ) : (
            <p className="text-gray-500 text-sm sm:text-base">
              No products available in this basket.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SingleBasketItem;
