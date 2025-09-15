import { createPreview } from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import React from "react";

const CategoriesSection = ({
  categories,
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <>
      {categories?.length === 0 ? (
        <p className="text-center text-gray-500">{T["no_categories_available"]}</p>
      ) : categories.length > 5 ? (
        <Slider {...categorySettings}>
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex gap-3 flex-row justify-center items-center cursor-pointer"
              onClick={() => setSelectedCategory(category?.name)}
            >
              {category?.category_image ? (
                <img
                  className="w-[40px] bg-[#EAEAEA] p-[10px] h-[40px] object-contain rounded-full"
                  src={createPreview(category?.category_image)}
                  alt={category?.name}
                  width={63}
                  height={63}
                />
              ) : (
                <img
                  className="w-[40px] bg-[#EAEAEA] p-[10px] h-[40px] object-contain rounded-full"
                  src={"/images/image-placeholder.png"}
                  alt={category.name}
                  width={63}
                  height={63}
                />
              )}
              <h5 className="capitalize text-[15px] font-bold text-black">
                {category?.name}
              </h5>
            </div>
          ))}
        </Slider>
      ) : (
        <ul className="flex flex-wrap gap-[30px] justify-center primium-product-mobimg">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex flex-row gap-3 justify-center items-center cursor-pointer"
              onClick={() => setSelectedCategory(category?.name)}
            >
              {category?.category_image ? (
                <img
                  className={`w-[40px] bg-[#EAEAEA] h-[40px] object-contain rounded-full border-2 ${
                    selectedCategory == category?.name ||
                    selectedCategory?.name == category?.name
                      ? "border-green-500"
                      : ""
                  }`}
                  src={createPreview(category?.category_image)}
                  alt={category.name}
                  width={63}
                  height={63}
                />
              ) : (
                <img
                  className={`w-[40px] bg-[#EAEAEA] h-[40px] object-contain rounded-full border-2 ${
                    selectedCategory == category?.name ? "border-green-500" : ""
                  }`}
                  src={"/images/image-placeholder.png"}
                  alt={category.name}
                  width={63}
                  height={63}
                />
              )}
              <h5 className="capitalize text-[15px] font-bold text-black">
                {category.name}
              </h5>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default CategoriesSection;
