import { createPreview } from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import { CART } from "@/Assets/Icons/Svg";
import React, { useState } from "react";
import Badge from "./Badge";
import Wishlist from "./Wishlist";
import ToolTips from "./ToolTips";
import ItemCounter from "./ItemCounter";
import { usePathname } from "next/navigation";

const NewArrivalCard = ({ product, addToCart, addToWishlist }) => {
  const pathname = usePathname();
  const variants = product?.product_detail?.variants;
  const [itemCount, setItemCount] = useState(1);
  const [currentVariant, setCurrentVariant] = useState(variants[0]);
  const product_tag = product?.product_tag?.length
    ? product?.product_tag?.[0]
    : "";
  const product_image = product?.feature_image?.image;
  // product price info

  const currentDate = new Date();

  const inventory = product?.product_detail?.inventory;

  const saleFrom = inventory?.sale_price_dates_from
    ? new Date(inventory.sale_price_dates_from)
    : null;

  const saleTo = inventory?.sale_price_dates_to
    ? new Date(inventory.sale_price_dates_to)
    : null;

  // Check if sale price should be applied
  const isSaleActive =
    (saleFrom === null && saleTo === null) ||
    (saleFrom && saleTo && currentDate >= saleFrom && currentDate <= saleTo);

  const product_regular_price = inventory?.regular_price || "0.00";
  const product_sale_price = isSaleActive
    ? inventory?.sale_price || "0.00"
    : null;
  const product_price = inventory?.regular_price || "0.00";
  // product price info
  const unit = product?.product_detail?.inventory?.unit;
  console.log(product, "arrival prodcut");
  return (
    <div className="pl-2 sm:pl-4 md:pl-8 lg:pl-[200px] mb-4 sm:mb-6 md:mb-8 lg:mb-10">
      <div className="bg-white rounded-lg shadow-md p-2 sm:p-3 md:p-4 w-full relative h-full min-h-[200px] sm:min-h-[250px] md:min-h-[280px] lg:min-h-[330px] flex flex-col lg:flex-row items-center">
        {product_image ? (
          <img
            className="text-transparent lg:absolute lg:left-[-130px] max-w-[100px] sm:max-w-[140px] md:max-w-[180px] lg:max-w-[240px] lg:top-1/2 lg:-translate-y-1/2 lg:-mt-12 sm:mt-0"
            src={createPreview(product_image)}
            alt={product.name}
          />
        ) : (
          <img
            className="text-transparent lg:absolute lg:left-[-130px] max-w-[100px] sm:max-w-[140px] md:max-w-[180px] lg:max-w-[240px] lg:top-1/2 lg:-translate-y-1/2 lg:-mt-12 sm:mt-0"
            src={"/images/image-placeholder.png"}
            alt={product?.name || "product image"}
          />
        )}
        <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4">
          <Wishlist
            product={product}
            addToWishlist={addToWishlist}
            isArrival={true}
          />
        </div>
        <div className="w-full lg:pl-[120px]">
          {product_tag ? (
            <Badge
              badgeName={product_tag}
              textColor={"white"}
              className="capitalize text-xs sm:text-sm"
              bgColor="gradient-to-r from-[#92C64E] to-[#4BAF50]"
            />
          ) : (
            ""
          )}
          <h2 className="capitalize text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-black mt-2">
            {product?.name || ""}
          </h2>
          <div className="text-green-600 text-sm sm:text-base md:text-lg lg:text-xl font-semibold mt-1">
            <span className="text-[#55B250] font-bold">
              {product_sale_price ? (
                <>
                  <span className="text-green-500">{`${product_sale_price} SEK`}</span>{" "}
                  <span className="line-through text-[#B6B6B6]">{`${product_regular_price} SEK`}</span>
                </>
              ) : (
                <span className="text-green-500">{`${product_regular_price} SEK`}</span>
              )}
            </span>
            <p
              className="text-gray-500 mt-2 text-xs sm:text-sm md:text-base line-clamp-3"
              dangerouslySetInnerHTML={{ __html: product?.description || "" }}
            />
            <div className="flex products-center mt-2">
            </div>
            <div className="flex products-center justify-between mt-4">
              <ItemCounter
                item={product}
                setItemCount={setItemCount}
                itemCount={itemCount}
              />
              <div className="flex space-x-2">
                <ToolTips text={T["add_to_cart"]}>
                  <span
                    className={`${
                      itemCount > 0
                        ? "enabled-cart cursor-pointer"
                        : "enabled-cart opacity-50 cursor-not-allowed"
                    } text-base sm:text-lg md:text-xl`}
                    onClick={() => {
                      addToCart(currentVariant?.inventory?.id, itemCount);
                      setItemCount(1);
                    }}
                  >
                    {CART}
                  </span>
                </ToolTips>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewArrivalCard;
