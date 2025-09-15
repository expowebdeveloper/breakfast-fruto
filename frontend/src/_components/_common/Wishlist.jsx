import React from "react";
import Image from "next/image";

const Wishlist = ({ addToWishlist, product, page = "" ,isArrival=false}) => {
  const likedImage = "/images/likedImg.svg";
  const heartImage = "/images/heart.svg";
  const productVariant = product?.product_variants?.[0];
  const isFavourite =
    page === "favourites"
      ? product?.product?.is_favourite
      : product?.is_favourite;
  const prod = page === "favourites" ? product?.product : product;
  return (
    // <Tooltip
    //   title={
    //     product?.wishlist_status === "added"
    //       ? "Remove from wishlist"
    //       : "Add to wishlist"
    //   }
    // >
    <Image
      className="text-transparent w-[50px] h-[50px] bg-[#F5F5F5] p-[13px] rounded-full cursor-pointer"
      src={isFavourite ? likedImage : heartImage}
      alt="heartLogo"
      onClick={(e) => addToWishlist(e, prod, isArrival)}
      width={50}
      height={50}
    />
    // </Tooltip>
  );
};

export default Wishlist;
