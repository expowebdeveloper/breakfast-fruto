"use client";
import React, { useEffect, useState } from "react";
import Badge from "./_common/Badge";
import { CART1 } from "@/Assets/Icons/Svg";
import ToolTips from "./_common/ToolTips";
import { useParams, usePathname } from "next/navigation";
import { imagePlaceholder } from "@/_Svgs/Svg";
import { createPreview } from "@/_utils/helpers";
import truncate from "html-truncate";
import CommonButton from "./_common/CommonButton";
import { useDispatch } from "react-redux";
import { setSelectedBasket } from "@/Redux/addToBasketSlice";
import { T } from "@/_utils/LanguageTranslator";

const BasketCard = ({ basket, chooseBasket, loader }) => {
  const dispatch = useDispatch();
  const truncatedHTML = truncate(basket?.content || "", 40); // 100 characters

  const { is_customizable } = basket;
  console.log(basket, "basket inside");
  const pathname = usePathname();
  const todayUtc = new Date();
  const start = new Date(basket.start_sale);
  const end = new Date(basket.end_sale);

  const isSaleActive =
    todayUtc.getTime() >= start.getTime() &&
    todayUtc.getTime() <= end.getTime();

  return (
    <div className="p-2 sm:p-2.5 bg-white rounded-[10px] relative shadow-md">
      <div className="flex absolute top-2 sm:top-[14px] left-2 sm:left-[15px] right-2 sm:right-[10px] flex items-center whitespace-nowrap capitalize">
        <Badge
          badgeName={is_customizable ? "Anpassningsbar" : "Ej anpassningsbar"} 
          textColor={"white"}
          bgColor={"gradient-to-r from-[#92C64E] to-[#4BAF50]"}
        />
      </div>
      <div
        className="image-section cursor-pointer"
      >
        {basket?.featured_image ? (
          <img
            className="w-full h-32 sm:h-40 md:h-48 object-contain rounded-[10px]"
            src={createPreview(basket?.featured_image)}
            alt={basket?.basket_name || "Basket image"}
            width={63}
            height={63}
          />
        ) : (
          <div className="basket-imagePlaceholder w-full h-32 sm:h-40 md:h-48 object-contain rounded-[10px]">
            {imagePlaceholder}
          </div>
        )}
      </div>

      <h2 className="capitalize text-base sm:text-[18px] font-bold text-center text-black mt-3 sm:mt-[15px]">
        {basket?.basket_name || "-"}
      </h2>
      <div className="flex justify-between items-baseline my-2 sm:my-2.5">
        <p className="text-sm sm:text-[17px] text-[#9299A3] font-bold py-2 sm:py-[15px] text-center md:pt-[0px] mx-auto w-1/2">
          {isSaleActive ? (
            <>
              <del className="text-xs sm:text-[13px]">{basket?.basket_price || "-"}</del>{" "}
              <span className="text-[#55B250] font-bold text-sm sm:text-[15px]">
                {basket?.offer_price || 0.0}
              </span>{" "}
            </>
          ) : (
            <span className="text-[#55B250] text-sm sm:text-[15px] font-bold">
              {basket?.basket_price || 0.0}
            </span>
          )}{" "}
          SEK
        </p>
      </div>
      {basket?.content ? (
        <div className="text-center text-sm sm:text-base" dangerouslySetInnerHTML={{ __html: truncatedHTML }}></div>
      ) : (
        ""
      )}

      <div className="flex gap-2 sm:gap-2.5 justify-center mt-4">
        <div className="flex px-2 sm:px-4 gap-2 sm:gap-2.5 basket-card w-full sm:w-auto">
          <CommonButton
            text={T["choose_basket"]}
            type="button"
            onClick={()=>{chooseBasket(basket)}}
            icon={CART1}
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default BasketCard;
