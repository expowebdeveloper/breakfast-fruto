import { baseURL } from "@/_Api-Handlers/apiConfig";
import { ITEM_CATEGORY } from "@/_constants/constant";
import { imagePlaceholder } from "@/_Svgs/Svg";
import { createPreview } from "@/_utils/helpers";
import Image from "next/image";

const ItemSubCategory = ({ subCategory, handleClick }) => {
  console.log(subCategory, "subCategory inside chilf");
  const categoryImage = subCategory?.category_image;

  return (
    <div className="flex gap-4 category-mob-screen mx-auto w-full m-0 box-border overflow-auto flex justify-start pb-[20px]">
      <div
        className="flex flex-col items-center rounded-full p-6 w-[100px] h-35 bg-gradient-to-b from-[#ffffff] to-[#E5E5E5] flex-none cursor-pointer"
        onClick={() => handleClick(subCategory)}
      >
        {categoryImage ? (
          <Image
            src={createPreview(categoryImage)}
            className="shoptop-card-img"
            alt={"card_image"}
            width={100}
            height={100}
          />
        ) : (
          <div className="basket-imagePlaceholder">{imagePlaceholder}</div>
        )}
        <h3 className="mt-4 text-[0.8rem] text-black font-semibold text-center truncate">
          {subCategory.name}
        </h3>
      </div>
    </div>
  );
};
export default ItemSubCategory;
