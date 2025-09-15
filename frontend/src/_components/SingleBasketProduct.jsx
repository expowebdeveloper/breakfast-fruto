import { useEffect, useState } from "react";
import CartDeleteIcon from "./CartDeleteIcon";

export default function SingleBasketProduct({
  product,
  addToBasket,
  currentUserBasket,
  onRemoveProduct = () => {},
}) {
  const [quantity, setQuantity] = useState(1);
  const product_name = product?.product_name || "";
  const product_price =
    product?.product_variant?.inventory?.regular_price || "0.00";
  const product_unit = product?.product_variant?.inventory?.unit || "";
  const product_quantity = product?.quantity || 0;

  useEffect(() => {
    setQuantity(product_quantity);
  }, [product_quantity]);

  const handleQuantityChange = (quantity, type) => {
    const customId = product?.product_variant?.id;
    addToBasket(product, quantity, customId, currentUserBasket?.user_basket_id);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md w-[100%] mt-2">
      <div>
        <h3 className="font-semibold text-lg capitalize">{product_name}</h3>
        {/* commented single basket price  */}
        {/* <p className="text-green-600 font-semibold">
          {product_price} SEK{" "}
          <span className="text-gray-500 text-sm">/{product_unit}</span>
        </p> */}
      </div>
      <div
        className="flex flex-row gap-[11px] items-center border rounded-full px-2 py-1 shadow bg-white"
      >
        <button
          className="text-gray-700 text-lg"
          onClick={() => handleQuantityChange(quantity - 1, "decrease")}
        >
          -
        </button>
        <span className="font-semibold">{product_quantity}</span>
        <button
          className="text-green-600 text-lg"
          onClick={() => handleQuantityChange(quantity + 1, "increase")}
        >
          +
        </button>
        <CartDeleteIcon
          onClick={() => {
            const customId = product?.product_variant?.id;
            onRemoveProduct(
              product,
              customId,
              currentUserBasket?.user_basket_id
            );
          }}
          showBorder={false}
          showTooltip={false}
        />
      </div>
    </div>
  );
}
