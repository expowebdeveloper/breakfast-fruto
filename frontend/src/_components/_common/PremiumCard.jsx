"use client";
import { PREMIUM_CARD } from "@/app/_constant/Constant";
import Image from "next/image";
import heartImg from "../../../public/images/heart.svg";
import shoppingcartImg from "../../../public/images/shopping-cart.svg";
import arrowImg from "../../../public/images/arrow.svg";
import React, { useState } from "react";
import { CART, CART1 } from "../../../public/images/SvgIcons";
import ItemCounter from "./ItemCounter";
import Badge from "./Badge";
import Button from "./Button";
import dummyImg from "../../../public/images/breadimg.jpg";

const PremiumCard = ({
  PREMIUM_CARD_DATA,
  page,
  handleItem,
  handleViewAll,
}) => {
  return (
    <div>
      <section className="pt-[20px]">
        <div className="max-w-screen-xl w-full px-0 mx-auto">
          <div
            className={
              page == "home"
                ? "grid-cols-4 text-black grid gap-[15px] home-card-mob"
                : "grid-cols-3 text-black grid gap-[15px] product-card-mob"
            }
          >
            {PREMIUM_CARD_DATA?.slice(0, 4)?.map((item) => (
              <div
                className="p-2.5 bg-white rounded-[10px] relative"
                key={item.id}
                onClick={() =>
                  page == "home" ? undefined : handleItem(item.id)
                }
              >
                <div className="flex absolute top-[10px] left-[10px] right-[10px] flex justify-between items-center whitespace-nowrap">
                  <Badge
                    badgeName={"Fresh"}
                    textColor={"white"}
                    bgColor={"gradient-to-r from-[#92C64E] to-[#4BAF50]"}
                  />
                  <Badge
                    badgeName={item.delivery_day}
                    textColor={"brown"}
                    bgColor={"orange"}
                  />
                  <div></div>
                </div>
                {item.images && item.images.length > 0 ? (
                  item.images.map((img, index) => (
                    <img key={index} src={img.image} alt="breadImg" />
                  ))
                ) : (
                  <img src="/images/breadimg.jpg" alt="breadImg" />
                )}

                <h5 className="text-[18px] font-bold text-center text-black mt-[15px]">
                  {item.name}
                </h5>
                <p className="text-[12px] text-[#9299A3] font-bold py-[15px] text-center md:pt-[0px]">
                  <del>{item.old_price}</del>
                  <span className="text-[#55B250] font-bold">
                    {/* {stripHtmlTags(item.description)} */}
                  </span>
                  unit
                </p>
                {/* {page == "home" ? ( */}
                <div className="flex items-center justify-center gap-[10px] mb-[30px]">
                  <a
                    href="#"
                    // onClick={addToWishList}
                  >
                    <Image
                      className="text-transparent w-[50px] h-[50px] bg-[#F5F5F5] p-[13px] rounded-full"
                      src={heartImg}
                      alt="heartLogo"
                      width={500}
                    />
                  </a>
                  <a
                    href="#"
                    //  onClick={addToCart}
                  >
                    <Image
                      className="text-transparent w-[50px] h-[50px] bg-[#F5F5F5] p-[13px] rounded-full"
                      src={shoppingcartImg}
                      alt="shoppingImg"
                      width={500}
                    />
                  </a>
                </div>
                {/* ) : ( */}
                <div className="flex gap-2.5 justify-between">
                  <div>
                    <ItemCounter
                    // count={itemCount}
                    // handleDecrease={handleDecrease}
                    // handleIncrease={handleIncrease}
                    />
                  </div>
                  <div className="flex gap-2.5">
                    <span className="text-black flex items-center justify-center">
                      {CART}
                    </span>
                    <span className="text-black flex items-center justify-center">
                      {CART1}
                    </span>
                  </div>
                </div>
                {/* )} */}
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <Button
              btnType="button"
              btnText="View All"
              className="flex gap-[10px] bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[10px_30px] rounded-full text-white font-semibold items-center mt-[30px]"
              btnClick={handleViewAll}
              icon={
                <Image
                  className="bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[6px] rounded-full w-[25px] h-[25px]"
                  src={arrowImg}
                  alt="arrowImg"
                  width={500}
                />
              }
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default PremiumCard;
