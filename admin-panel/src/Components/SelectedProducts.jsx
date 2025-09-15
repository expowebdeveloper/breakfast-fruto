import React from "react";
import { crossIcon, imagePlaceholder, selectedCrossIcon } from "../assets/Icons/Svg";
import { createPreview } from "../utils/helpers";

const SelectedProducts = ({ selectedProducts, onRemove, formConfig }) => {
  console.log(selectedProducts, "feature image");

  return (
    <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
      {selectedProducts.map((product, index) => (
        <div
          key={index}
          className="flex items-center gap-2 bg-white px-2 py-1 rounded-full shadow-sm border"
        >
          {product?.feature_image?.image ||
          product?.feature_image ||
          product?.product?.featured_image ? (
            <img
              src={createPreview(
                product?.feature_image?.image ||
                  product?.feature_image ||
                  product?.product?.featured_image
              )}
              alt={product?.name || "product image"}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="basket-imagePlaceholder">{imagePlaceholder}</div>
          )}
          <span className="text-sm text-gray-700">{product?.name}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const result = selectedProducts.filter(
                (item) => item.id !== product.id
              );
              formConfig.setValue("eligible_products", result, {
                shouldValidate: true,
              });
            }}
            type="button"
            className="text-gray-500 hover:text-red-500 product-cross"
          >
            {selectedCrossIcon}
          </button>
        </div>
      ))}

      {selectedProducts.length > 5 && (
        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          +{selectedProducts.length - 5}
        </div>
      )}
    </div>
  );
};

export default SelectedProducts;
