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
import { baseURL, checkisEligible, createPreview } from "@/_utils/helpers";
import ToolTips from "../ToolTips";
import Select from "react-select";
import {
  addItemToBasket,
  getSelectedBasketById,
} from "@/Redux/addToBasketSlice";
import { ADD_TO_CART } from "@/_Api-Handlers/APIUrls";
import { imagePlaceholder } from "@/_Svgs/Svg";
import Wishlist from "../Wishlist";
import VariantSelect from "@/_components/VariantSelect";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { setShowCartSidebar } from "@/Redux/userSlice";
import { T } from "@/_utils/LanguageTranslator";

const UpdatedProductCard = ({
  product,
  item,
  addToWishlist,
  addToCart,
  addToBasket,
  page = "",
}) => {
  const pathname = usePathname();
  const is_favourite = page === "favourites";
  const router = useRouter();
  const product_image = is_favourite
    ? product?.product?.feature_image?.image || product?.images?.[0]?.image
    : product?.feature_image?.image || product?.product?.featured_image;
  console.log(product, "product_image");
  const product_tag = is_favourite
    ? product?.product?.product_tag?.length
      ? product.product.product_tag?.[0]
      : ""
    : product?.product_tag?.length
    ? product?.product_tag?.[0]
    : "";
  const product_name = is_favourite ? product?.product?.name : product?.name;

  // price info
  const currentDate = new Date();

  // Check if it's a favourite product
  const productDetail = is_favourite
    ? product?.product?.product_detail
    : product?.product_detail;

  const inventory = productDetail?.inventory;

  const saleFrom = inventory?.sale_price_dates_from
    ? new Date(inventory.sale_price_dates_from)
    : null;

  const saleTo = inventory?.sale_price_dates_to
    ? new Date(inventory.sale_price_dates_to)
    : null;

  // Check if sale is active
  const isSaleActive =
    saleFrom !== null &&
    saleTo !== null &&
    currentDate >= saleFrom &&
    currentDate <= saleTo;

  const regular_price = is_favourite
    ? product?.product?.product_detail?.inventory?.regular_price
    : product?.product_detail?.inventory?.regular_price;

  const sale_price = isSaleActive
    ? is_favourite
      ? product?.product?.product_detail?.inventory?.sale_price
      : product?.product_detail?.inventory?.sale_price
    : null;

  // price info
  const unit = product?.product_detail?.inventory?.unit;
  const variants = is_favourite
    ? product?.product?.product_detail?.variants
    : product?.product_detail?.variants;

  const { selectedBasket } = useSelector((state) => state.addToBasket);
  console.log(selectedBasket, "this is selected basket");

  const [currentVariant, setCurrentVariant] = useState(variants?.[0]);
  const [productQuantity, setProductQuantity] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [productVariant, setProductVariant] = useState();
  const [variantOption, setVariantOption] = useState();
  const [itemCount, setItemCount] = useState(1);
  const [cartItems, setCartItems] = useState();
  const dispatch = useDispatch();
  const [eligible, setEligible] = useState();
  console.log(product, "product inside favorite");

  useEffect(() => {
    // setCurrentVariant(variants?.[0]);
    // setCurrentVariant(item?.[0]);
    const isEligible = selectedBasket?.products_detail?.find(
      (itm) => itm?.id == currentVariant?.inventory?.id
    );
    setEligible(isEligible);
  }, [item, selectedBasket, currentVariant]);

  //   useEffect(() => {
  //     const options = item?.map((variant) => {
  //       return {
  //         value: variant?.inventory?.id,
  //         label: `${variant.inventory.weight} ${variant.inventory.unit}`,
  //       };
  //     });
  //     setVariantOption(options);
  //     setSelectedVariant(options[0]);
  //   }, []);

  const handleVariant = (variant) => {
    setSelectedVariant(variant);
    const selectedVariantWeight = variant?.label?.split(" ")[0];
    console.log(selectedVariantWeight, "selectedVariantWeight");
    const variantValue = item?.find(
      (variant) => variant.inventory.weight == selectedVariantWeight
    );
    setCurrentVariant(variantValue);
  };

  //   const addToCart = (product, count) => {
  //     callApi({
  //       endPoint: ADD_TO_CART,
  //       method: METHODS.post,
  //       instanceType: INSTANCE.authorize,
  //       payload: {
  //         product_variant: product?.inventory?.id,
  //         quantity: 3,
  //       },
  //     })
  //       .then((res) => {
  //         setCartItems(res.data.results);
  //         // setShowSelectBasketModal(!showSelectModal);
  //       })
  //       .catch((err) => {
  //         toastMessages(err.message || DEFAULT_ERROR_MESSAGE);
  //       });
  //   };

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
    <div className="p-2.5 bg-white rounded-[10px] relative shadow-md">
      <div className="flex absolute top-[14px] left-[15px] right-[10px] flex items-center whitespace-nowrap capitalize">
        {product_tag ? (
          <Badge
            badgeName={product_tag}
            textColor={"white"}
            bgColor={"gradient-to-r from-[#92C64E] to-[#4BAF50]"}
          />
        ) : (
          ""
        )}
      </div>
      <div
        className="image-section cursor-pointer"
        onClick={() => {
          const productId =
            pathname === "/baskets" ? product?.product?.id : product?.id;
          router.push(`/products/${productId}`);
        }}
      >
        {product_image ? (
          <img
            className="w-full h-48 object-contain rounded-[10px] "
            src={createPreview(product_image)}
            alt={product?.name || "product image"}
            width={63}
            height={63}
          />
        ) : (
          <div className="basket-imagePlaceholder w-full object-contain rounded-[10px]">
            {imagePlaceholder}
          </div>
        )}
      </div>

      <h2 className="capitalize text-[18px] font-bold text-center text-black mt-[15px]">
        {product_name || ""}
      </h2>
      <div className="flex justify-between items-baseline my-2.5">
        {pathname !== "/baskets" ? (
          <p className="text-3 text-[#9299A3] font-bold py-[15px] text-center md:pt-[0px] text-[17px] mx-auto w-1/2">
            {sale_price ? (
              <>
                <del className="text-[13px]">{regular_price || 0.0}</del>{" "}
                <span className="text-[#55B250] font-bold text-[15px]">
                  {sale_price || 0.0}
                </span>{" "}
              </>
            ) : (
              <span className="text-[15px] font-bold">
                {regular_price || 0.0}{" "}
              </span>
            )}
            SEK
            {/* {product?.product_detail?.inventory?.unit} */}
          </p>
        ) : (
          ""
        )}
        {/* commented variant section */}
        {/* <div className="flex justify-center">
          {variants?.length > 1 && !is_favourite ? (
            <div className="variant-select1 border border-[#C5C5C5] px-4 py-1 inline-block mb-2 rounded-md">
              <VariantSelect
                variants={variants}
                onvariantChange={(variant) => {
                  setCurrentVariant(variant);
                }}
              />
            </div>
          ) : (
            //   <Select
            //     options={createVariantOptions(variants)}
            //     onChange={(e) => handleVariant(e)}
            //     placeholder="Select a variant"
            //     value={selectedVariant}
            //   />
            ""
          )}
        </div> */}
      </div>

      {/* <Select
          options={variantOption}
          onChange={(e) => handleVariant(e)}
          placeholder="Select a variant"
          value={selectedVariant}
          /> */}

      <div className="flex items-center justify-end gap-[10px] mb-[30px] absolute top-[14px] right-[14px]">
        <Wishlist
          product={product}
          addToWishlist={addToWishlist}
          page={page}
          isArrival={false}
        />
      </div>
      {pathname === "/baskets" && !selectedBasket?.is_customizable ? (
        ""
      ) : (
        <div className="flex gap-2.5 justify-between">
          <div>
            <ItemCounter
              item={product}
              setItemCount={setItemCount}
              itemCount={itemCount}
            />
          </div>
          <div className="flex gap-2.5">
            {pathname !== "/baskets" ? (
              <ToolTips
                text={T["add_to_cart"]}
                position={pathname === "/products" ? "top" : "bottom"}
              >
                <span
                  className={
                    itemCount > 0
                      ? "enabled-cart cursor-pointer"
                      : "enabled-cart opacity-50 cursor-not-allowed cursor-pointer"
                  }
                  onClick={() => {
                    addToCart(currentVariant?.inventory?.id, itemCount);
                    setItemCount(1);
                  }}
                >
                  {CART}
                </span>
              </ToolTips>
            ) : (
              ""
            )}

            {pathname === "/baskets" &&
            selectedBasket?.id &&
            checkisEligible(
              selectedBasket,
              currentVariant?.id || product?.id
            ) ? (
              <span
                className="enabled-cart cursor-pointer"
                onClick={() => {
                  addToBasket(
                    currentVariant?.id ? currentVariant : product,
                    itemCount
                  );
                  setItemCount(1);
                }}
              >
                {CART1}
              </span>
            ) : (
              ""
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdatedProductCard;
