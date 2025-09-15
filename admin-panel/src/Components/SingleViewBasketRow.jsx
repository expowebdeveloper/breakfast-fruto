import React from "react";
import { imagePlaceholder, trashIcon } from "../assets/Icons/Svg";
import { ITEMS_PER_PAGE } from "../constant";
import { createPreview, renderSerialNumber } from "../utils/helpers";

const SingleViewBasketRow = ({ product, index, handleDeleteClick }) => {
  console.log(product, "this is prodcuts");
  return (
    <tr key={product.id} className="border-b">
      <td className="p-2 text-gray-600">
        {" "}
        {renderSerialNumber(1, ITEMS_PER_PAGE, index)}
      </td>
      <td className="p-2 font-semibold flex items-center gap-2">
        {product?.feature_image ? (
          <img
            src={createPreview(product?.feature_image)}
            alt={product?.name || "product image"}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="basket-imagePlaceholder">{imagePlaceholder}</div>
        )}

        {product?.name || "-"}
      </td>
      <td className="p-2 text-gray-600">{product?.inventory?.sku || "-"}</td>
      <td className="p-2 text-gray-600">
        {product?.inventory?.total_quantity} {product?.inventory?.unit || "-"}
      </td>
      <td className="p-2 text-gray-600">
        {product.inventory?.regular_price || "0.00"} SEK
      </td>
      <td className="p-2 text-gray-600 text-center">
        {product?.space_left || "1"}
      </td>
      <td className="p-2">
        <button
          className="text-red-500 hover:text-red-700 p-1 bg-[#FFECEC] rounded-md"
          onClick={() => handleDeleteClick(product)}
        >
          {/* <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth="1.5"
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg> */}
          {trashIcon}
        </button>
      </td>
    </tr>
  );
};

export default SingleViewBasketRow;
