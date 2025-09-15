"use client";
import React, { useEffect, useState } from "react";
import Badge from "../Badge";
import ItemCounter from "../ItemCounter";
import Image from "next/image";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { setWishList } from "@/Redux/addToWishListSlice";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import { useDispatch, useSelector } from "react-redux";
import { CART, CART1 } from "@/Assets/Icons/Svg";
import { baseURL, createPreview } from "@/_utils/helpers";
import ToolTips from "../ToolTips";
import Select from "react-select";
import {
  addItemToBasket,
  getSelectedBasketById,
} from "@/Redux/addToBasketSlice";
import { ADD_TO_CART } from "@/_Api-Handlers/APIUrls";

const ProductCard = ({
  page,
  item,
  addToWishlist,
  handleItem,
  image,
  setShowBasket,
  setShowSelectBasketModal,
  setSelectedPremiumProduct,
}) => {
  const { selectedBasket } = useSelector((state) => state.addToBasket);
  const [currentVariant, setCurrentVariant] = useState();
  const [productQuantity, setProductQuantity] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productVariant, setProductVariant] = useState();
  const [variantOption, setVariantOption] = useState();
  const [itemCount, setItemCount] = useState(0);
  const [cartItems, setCartItems] = useState();
  const dispatch = useDispatch();
  const [eligible, setEligible] = useState();

  useEffect(() => {
    setProductVariant(item?.[0]);
    // setCurrentVariant(item?.[0]);
    const isEligible = selectedBasket?.products_detail?.find(
      (itm) => itm?.id == currentVariant?.inventory?.id
    );
    setEligible(isEligible);
  }, [item, selectedBasket, currentVariant]);

  useEffect(() => {
    const options = item?.map((variant) => {
      return {
        value: variant?.inventory?.id,
        label: `${variant.inventory.weight} ${variant.inventory.unit}`,
      };
    });
    setVariantOption(options);
    setSelectedVariant(options[0]);
  }, []);

  const handleVariant = (variant) => {
    setSelectedVariant(variant);
    const selectedVariantWeight = variant?.label?.split(" ")[0];
    console.log(selectedVariantWeight, "selectedVariantWeight");
    const variantValue = item?.find(
      (variant) => variant.inventory.weight == selectedVariantWeight
    );
    setCurrentVariant(variantValue);
  };

  const addToCart = (product, count) => {
    callApi({
      endPoint: ADD_TO_CART,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        product_variant: product?.inventory?.id,
        quantity: 3,
      },
    })
      .then((res) => {
        setCartItems(res.data.results);
        // setShowSelectBasketModal(!showSelectModal);
      })
      .catch((err) => {
        toastMessages(err.message || DEFAULT_ERROR_MESSAGE);
      });
  };

  const addToBasket = (selectedVariant, quantity) => {
    console.log(selectedVariant, "selectedVariant");
    // setShowBasket(false);
    // if (page === "home") {
    //   setShowSelectBasketModal(true);
    //   setSelectedPremiumProduct(selectedVariant);
    // }

    if (selectedBasket != "") {
      dispatch(
        addItemToBasket(
          selectedBasket?.id,
          selectedVariant?.inventory?.id,
          quantity,
          // () => {
          //   if (userBasket?.user_basket?.id) {
          //     dispatch(getSelectedBasketById(userBasket?.user_basket?.id));
          //   }
          // }
        )
      );
    }
  };

  // const addToWishlist = async (e, item, status) => {
  //   e.stopPropagation();
  //   const token = localStorage.getItem("token");
  //   if (!token) {
  //     setShowLoginModal(true);
  //   } else {
  //     setSelectedId(item?.id);
  //     setLike(!like);
  //     if (like == false) {
  //       try {
  //         const res = await callApi({
  //           endPoint: WISHLIST,
  //           method: METHODS.post,
  //           instanceType: INSTANCE.authorize,
  //           payload: {
  //             product_id: item?.id,
  //           },
  //         });
  //         dispatch(setWishList(res.data.products));
  //         toastMessages("Added To Wishlist", successType);
  //       } catch (err) {
  //         console.log(err, "err");
  //       }
  //       const res = await callApi({
  //         endPoint: PRODUCTS,
  //         method: METHODS.get,
  //         instanceType: INSTANCE.authorize,
  //         params: {
  //           page: "1",
  //         },
  //       });
  //       setWishListData(res.data);
  //     } else {
  //       callApi({
  //         endPoint: `wishlist/${item?.wishlist_id}/delete/`,
  //         method: METHODS.delete,
  //         instanceType: INSTANCE.authorize,
  //       })
  //         .then((res) => {
  //           toastMessages(res.data.message, successType);
  //         })
  //         .catch((err) => {
  //           console.log(err, "err");
  //         });
  //       const res = await callApi({
  //         endPoint: PRODUCTS,
  //         method: METHODS.get,
  //         instanceType: INSTANCE.authorize,
  //         params: {
  //           page: "1",
  //         },
  //       });
  //     }
  //   }
  // };

  return (
    <div className="p-2.5 bg-white rounded-[10px] relative">
      <div className="flex absolute top-[14px] left-[15px] right-[10px] flex items-center whitespace-nowrap">
        <Badge
          badgeName={"Fresh"}
          textColor={"white"}
          bgColor={"gradient-to-r from-[#92C64E] to-[#4BAF50]"}
        />
        <Badge
          badgeName={item.delivery_day}
          textColor={"[#BD6600]"}
          bgColor={"gradient-to-r from-[#FFD99F] to-[#FFD99F]"}
        />
      </div>
      <div className="image-section">
      <img
        src={
          page == "home" || "products"
            ? `${createPreview(image)}`
            : `${createPreview(item?.feature_image?.image)}`
        }
        className="w-full h-48 object-cover rounded-[10px]"
        width={250}
        height={250}
        onClick={() => handleItem(productVariant.id)}
      />

      </div>

      <h2 className="text-[18px] font-bold text-center text-black mt-[15px]">
        {page === "favorites"
          ? item?.product?.name
          : currentVariant
          ? currentVariant?.name
          : productVariant?.name}
      </h2>
      <div className="flex">
        <Select
          options={variantOption}
          onChange={(e) => handleVariant(e)}
          placeholder="Select a variant"
          value={selectedVariant}
        />

        <p className="text-3 text-[#9299A3] font-bold py-[15px] text-center md:pt-[0px]">
          $
          <del>
            {currentVariant == null
              ? productVariant?.inventory?.regular_price
              : currentVariant?.inventory?.regular_price}
          </del>
          <span className="text-[#55B250] font-bold ">
            $
            {currentVariant == null
              ? productVariant?.inventory?.sale_price
              : currentVariant?.inventory?.sale_price}
            unit
          </span>
        </p>
      </div>

      <div className="flex items-center justify-end gap-[10px] mb-[30px] absolute top-[14px] right-[14px]">
        <img
          className="text-transparent w-[50px] h-[50px] bg-[#F5F5F5] p-[13px] rounded-full cursor-pointer"
          src={
            productVariant?.wishlist_status == "added"
              ? "/images/likedImg.svg"
              : "/images/heart.svg"
          }
          alt="heartLogo"
          onClick={(e) =>
            addToWishlist(e, productVariant, productVariant?.wishlist_status)
          }
          width={20}
          height={20}
        />
      </div>
      <div className="flex gap-2.5 justify-between">
        <div>
          <ItemCounter
            item={currentVariant || productVariant}
            // productQuantity={productQuantity}
            setItemCount={setItemCount}
            itemCount={itemCount}
          />
        </div>
        <div className="flex gap-2.5">
          <ToolTips text="Add to cart">
            <span
              className={
                itemCount > 0
                  ? "enabled-cart"
                  : "enabled-cart opacity-50 cursor-not-allowed"
              }
              onClick={() => addToCart(currentVariant, itemCount)}
            >
              {CART}
            </span>
          </ToolTips>
          <span
            className={
              // selectedBasket && eligible !== undefined
              // ?
              "enabled-cart"
              // : "enabled-cart opacity-50 cursor-not-allowed"
            }
            onClick={() =>
              addToBasket(currentVariant || productVariant, itemCount)
            }
          >
            {CART1}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
