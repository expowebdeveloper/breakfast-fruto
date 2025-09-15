import { imagePlaceholder } from "@/_Svgs/Svg";
import { createPreview } from "@/_utils/helpers";
import React, { useState } from "react";
import CartDeleteIcon from "./CartDeleteIcon";

const SingleBasketNestedProduct = ({
  data,
  addProductToBasket = () => {},
  user_basket_id,
  isCustomizable,
}) => {
  console.log(data, "single nested data");

  const product_name = data?.product_variant?.product?.name || "";
  const product_unit = data?.product_variant?.inventory?.unit || "";
  const product_weight = data?.product_variant?.inventory?.weight || "";
  const quantity = data?.quantity || 1;
  const product_image =
    data?.product_variant?.product?.featured_image?.image ||
    data?.product_variant?.product?.featured_image ||
    "";

  const handleQuantityChange = (newQuantity) => {
    // if (newQuantity < 1) return;
    addProductToBasket(data?.id, newQuantity, user_basket_id);
  };

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg p-[0.7rem] bg-[#ffffff] mb-[15px]">
        <div className="flex items-center justify-between w-full">
          <div className="image">
            {product_image ? (
              <img
                src={createPreview(product_image)}
                alt={product_name}
                className="w-[50px] h-[50px] rounded-full"
              />
            ) : (
              <div className="basket-imagePlaceholder">{imagePlaceholder}</div>
            )}
          </div>
          <div className="flex items-start gap-2">
            <div className="name-price">
              <p className="font-bold text-black">{product_name}</p>
              {/* Hide price if isCustomizable is true */}
              {isCustomizable && (
                <p className="text-green-500 text-lg">
                  {data?.product_variant?.inventory?.regular_price || "0.00"}{" "}
                  SEK{" "}
                  <span className="text-[#8C8C8C]">
                    {product_weight && "/"} {product_weight} {product_unit}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCustomizable && (
            <div className="flex items-center bg-[#ffffff] border rounded-lg border-gray-100 gap-1 p-[4px]">
              <span
                onClick={() => handleQuantityChange(quantity - 1)}
                className={`cursor-pointer text-2xl w-[1rem] h-[1rem] flex-none flex items-center justify-center rounded-full text-[16px] m-0 ${
                  quantity === 1 ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                -
              </span>
              <span className="w-[1rem] h-[1rem] flex items-center justify-center text-[16px] m-0">
                {quantity}
              </span>
              <span
                onClick={() => handleQuantityChange(quantity + 1)}
                className="cursor-pointer text-2xl w-[1rem] h-[1rem] flex-none flex items-center justify-center text-[16px] m-0 text-[#4BAF50]"
              >
                +
              </span>
            </div>
          )}

          {/* Show the delete icon if is_customizable is true */}
          {isCustomizable && <CartDeleteIcon onClick={() => {}} />}
        </div>
      </div>
    </div>
  );
};

export default SingleBasketNestedProduct;
