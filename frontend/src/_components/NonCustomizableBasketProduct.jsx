import { useEffect, useState } from "react";
import CartDeleteIcon from "./CartDeleteIcon";
import { imagePlaceholder } from "@/_Svgs/Svg";
import { createPreview } from "@/_utils/helpers";

export default function NonCustomizableBasketProduct({
  product,
  addToBasket,
  currentUserBasket,
  onRemoveProduct = () => {},
}) {
  const product_name = product?.product?.name || "Product Name";
  const product_image = product?.product?.featured_image;

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md w-full mt-2">
      <div className="flex justify-around w-full items-center gap-4">
        {/* Product Image */}
        <div className="w-[56px] h-[56px] rounded-[20px] overflow-hidden">
          {product_image ? (
            <img
              src={createPreview(product_image)}
              alt={product_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="basket-imagePlaceholder w-full h-full bg-gray-200 flex items-center justify-center rounded-[20px]">
              {imagePlaceholder}
            </div>
          )}
        </div>

        {/* Product Name */}
        <div className="text-lg font-semibold capitalize text-gray-800">
          {product_name}
        </div>
      </div>
    </div>
  );
}
