import React, { useState } from "react";
import { createPreview } from "../utils/helpers";
import { imagePlaceholder } from "../assets/Icons/Svg";
import { T } from "../utils/languageTranslator";

const SingleProductCard = ({
  product,
  selectedProducts,
  setSelectedProducts,
  handleSelectProduct,
}) => {
  const currentDate = new Date();

  const variants = product?.product_detail?.variants || [];
  const defaultVariant = variants[0];

  const [selectedVariant, setSelectedVariant] = useState(defaultVariant);
  const saleFrom = selectedVariant?.inventory?.sale_price_dates_from
    ? new Date(selectedVariant?.inventory?.sale_price_dates_from)
    : null;

  const saleTo = selectedVariant?.inventory?.sale_price_dates_to
    ? new Date(selectedVariant?.inventory?.sale_price_dates_to)
    : null;

    const isSaleActive =
    saleFrom !== null &&
    saleTo !== null &&
    currentDate >= saleFrom &&
    currentDate <= saleTo;
    console.log(saleFrom, saleTo, isSaleActive, selectedVariant?.id,"log this");

  const handleVariantChange = (e) => {
    const selected = variants.find((v) => v?.inventory?.id == e.target.value);
    setSelectedVariant(selected);
  };
  console.log(selectedVariant, "selected variant");
  console.log(selectedProducts, "these are selected products");

  return (
    <div
      key={product.id}
      className="cursor-pointer shadow-md p-4 relative bg-white rounded-[12px]"
    >
      {/* Container for image and checkbox */}
      <label className="relative block cursor-pointer">
        {product?.feature_image ? (
          <img
            src={createPreview(
              product?.feature_image?.image || product?.feature_image
            )}
            alt={product.name}
            className="w-full h-32 rounded-md"
          />
        ) : (
          <div className="dummy-image">{imagePlaceholder}</div>
        )}

        {/* Checkbox (Hidden but clickable through label) */}
        <input
          type="checkbox"
          className="absolute top-0 left-0 opacity-0 w-full h-full"
          //   checked={selectedProducts.some((elem) => elem?.id === product?.id || elem?.product?.id == product?.id)}
          checked={selectedProducts.some(
            (elem) => elem?.id === product?.product?.id
          )}
          onChange={(e) => handleSelectProduct(e, product, selectedVariant)}
        />

        {/* Custom Checkbox UI */}
        <div className="absolute top-2 left-2 w-5 h-5 bg-white border border-gray-400 rounded flex items-center justify-center">
          {selectedProducts.some((elem) => elem?.id === product?.id) && (
            <span className="text-green-500">✔</span>
          )}
        </div>
      </label>

      <div className="mt-2">
        <div className="flex justify-center">
          <div className="font-bold text-sm capitalize">{product?.name}</div>
        </div>

        {/* Variant Selector */}
        {variants.length > 1 && (
          <div className="mt-2">
            <select
              value={selectedVariant?.inventory?.id}
              onChange={handleVariantChange}
              className="border border-gray-300 text-sm rounded-md px-2 py-1 w-full"
            >
              {variants.map((variant) => (
                <option key={variant.sku} value={variant?.inventory?.id}>
                  {`${variant?.inventory?.weight} ${variant?.inventory?.unit}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price Section */}
        <div className="flex justify-center">
          <div className="text-sm text-[#16a34a] mb-[20px]">
            {isSaleActive
              ? selectedVariant?.inventory?.sale_price
              : selectedVariant?.inventory?.regular_price || "0.00"}{" "}
            SEK
          </div>
        </div>

        {/* Space Occupied Section */}
        <div className="flex items-center bg-green-100 text-green-600 font-semibold px-3 py-1 rounded-full w-fit">
          <span className="mr-2 text-[12px] font-medium">
            {T["space_occupy"]}
          </span>
          <span className="bg-green-500 text-white w-6 h-6 flex items-center justify-center rounded-full text-[10px]">
            {selectedVariant?.inventory?.weight || 1}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SingleProductCard;
