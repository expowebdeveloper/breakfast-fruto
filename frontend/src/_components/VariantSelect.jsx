import React, { useEffect, useState } from "react";

const VariantSelect = ({ product, selectedVariant, onSelectVariant }) => {
  const [isLoading, setIsLoading] = useState(true);
  const mainInventory = product?.product_detail?.inventory;
  const variants = product?.product_detail?.variants || [];

  // Default option (main product)
  // const defaultOption = mainInventory
  //   ? {
  //       id: product.id || "main",
  //       label: `${mainInventory.weight} ${mainInventory.unit}`,
  //       inventory: mainInventory,
  //       isMain: true,
  //     }
  //   : null;
  const defaultOption = null;

  // Other variant options
  const variantOptions = variants.map((variant) => {
    const inv = variant?.inventory;
    return {
      id: inv?.id,
      label: `${inv?.weight} ${inv?.unit}`,
      inventory: inv,
      isMain: false,
    };
  });

  const allOptions = defaultOption
    ? [defaultOption, ...variantOptions]
    : variantOptions;

  useEffect(() => {
    // Check if main inventory is loaded
    if (!selectedVariant && variantOptions?.length) {
      onSelectVariant(variantOptions?.[0]); // Select the main product if no variant is selected
    }
    setIsLoading(false); // Set loading state to false once data is available
  }, [selectedVariant, product, onSelectVariant, mainInventory]);

  if (isLoading) {
    return <div>Loading...</div>; // Show loading message until data is available
  }

  return (
    <div className="mt-4">
      <label className="block mb-2 font-medium">Select Variant:</label>
      <select
        value={selectedVariant?.id || "main"}
        onChange={(e) => {
          const selected = allOptions.find(
            (opt) => String(opt.id) === e.target.value
          );
          onSelectVariant(selected);
        }}
        className="border border-gray-300 rounded-md px-4 py-2 w-full"
      >
        {allOptions.map((option, index) => (
          <option key={index} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VariantSelect;
