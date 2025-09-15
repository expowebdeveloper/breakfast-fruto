import { imagePlaceholder, trashIcon } from "@/_Svgs/Svg";
import { createPreview } from "@/_utils/helpers";
import React from "react";
import CartDeleteIcon from "./CartDeleteIcon";

const SingleCartItem = ({
  data,
  addToCart,
  addProductToBasket = () => {},
  isBasketNestedProduct = false,
  onRemoveItemClick = () => {},
}) => {
  console.log(data, "single cart data");
  const product_name = data?.product_variant?.product?.name || "";
  const product_price = data?.item_price || "0.00";
  const product_unit = data?.product_variant?.inventory?.unit || "";
  const product_weight = data?.product_variant?.inventory?.weight || "";
  const quantity = data?.quantity || 1;
  const product_image =
    data?.product_variant?.product?.featured_image ||
    data?.product_variant?.product?.featured_image?.image ||
    "";
  const handleQuantityChange = (newQuantity) => {
    // if (newQuantity < 1) return;
    if (isBasketNestedProduct) {
      addProductToBasket(data?.id, newQuantity, data?.id);
    } else {
      addToCart(data?.id, newQuantity, data?.id);
    }
    console.log(data?.id, newQuantity, "this is id and quantity");
  };
  return (
    <div>
      {" "}
      <div className="flex items-center justify-between rounded-lg p-[0.7rem] bg-[transparent] mb-[15px] p-3 border rounded-lg">
        <div className="flex items-center gap-[10px]">
          <div className="image">
            {product_image ? (
              <img
                src={createPreview(product_image)}
                alt={product_name}
                className="w-[56px] h-[56px] rounded-[20px]"
              />
            ) : (
              <div className="basket-imagePlaceholder">{imagePlaceholder}</div>
            )}
          </div>
          <div>
            <p className="font-bold text-black">{product_name}</p>
            <p className="text-green-500 text-lg">
              {product_price} SEK{" "}
              <span className="text-[#8C8C8C]">
                {product_weight && "/"} {product_weight} {product_unit}
              </span>
            </p>
          </div>
        </div>
        <div className="items-center bg-[#ffffff] border rounded-[8px] border-gray-100 gap-1 p-[4px] border border-black flex">
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
        <CartDeleteIcon
          onClick={() => {
            onRemoveItemClick(data?.id);
          }}
        />
      </div>
    </div>
  );
};

export default SingleCartItem;
