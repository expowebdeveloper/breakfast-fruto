"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import item4 from "../../../../../public/images/item4.png";
import ExclusiveOfferBanner from "@/_components/_common/ExclusiveOfferBanner";
import Button from "@/_components/_common/Button";
import ItemCounter from "@/_components/_common/ItemCounter";
import {
  callApi,
  fetchCart,
  fetchUserBasket,
  fetchWishList,
  METHODS,
} from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import SimpleSlider from "@/_components/_common/Slider";
import { T } from "@/_utils/LanguageTranslator";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import { DEFAULT_ERROR_MESSAGE, EMAIL_ADDRESS } from "@/_constants/constant";
import { ADD_TO_CART, SEARCH_ZIPCODE, WISHLIST } from "@/_Api-Handlers/APIUrls";
import {
  checkisEligible,
  extractImageUrls,
  getWishlistMessage,
} from "@/_utils/helpers";
import { imagePlaceholder } from "@/_Svgs/Svg";
import { useRouter } from "next/navigation";
import axios from "axios";
import AddLoginModal from "@/_components/_common/Modals/AddLoginModal";
import PageLoader from "@/_components/_common/PageLoader";
import { usePreviousRoute } from "@/contexts/PreviosuRouteProvider";
import Breadcrumb from "@/_components/BreadcrumbSection";
import BreadcrumbSection from "@/_components/BreadcrumbSection";
import VariantSelect from "@/_components/VariantSelect";
import UpdatedProductCard from "@/_components/_common/Card/UpdatedProductCard";
import { setShowCartSidebar } from "@/Redux/userSlice";
// import CommonAutoComplete from "@/_components/_common/CommonAutoComplete";

const Page = () => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [isSaleActive, setIsSaleActive] = useState(false);
  const previousPath = usePreviousRoute();
  const token = localStorage.getItem("token");
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const { selectedBasket } = useSelector((state) => state.addToBasket);
  const [cartButtonLoader, setCartButtonLoader] = useState(false);
  const [pageLoader, setPageLoader] = useState(false);
  const dispatch = useDispatch();
  const pathname = usePathname();
  const [showModal, setShowModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [itemCount, setItemCount] = useState(1);
  const [zipcode, setZipcode] = useState("");
  const [basketLoader, setBasketLoader] = useState(false);
  const [locationLoader, setLocationLoader] = useState(false);
  const product_id = pathname.split("/")[2];
  const [productDetail, setProductDetail] = useState();
  const product_name = productDetail?.name || "";
  // product price info
  const currentDate = new Date();

  const inventory = productDetail?.product_detail?.inventory;

  const saleFrom = inventory?.sale_price_dates_from
    ? new Date(inventory.sale_price_dates_from)
    : null;

  const saleTo = inventory?.sale_price_dates_to
    ? new Date(inventory.sale_price_dates_to)
    : null;

  // Check if sale price should be applied
  // const isSaleActive =
  //   (saleFrom === null && saleTo === null) ||
  //   (saleFrom && saleTo && currentDate >= saleFrom && currentDate <= saleTo);

  // const product_regular_price = inventory?.regular_price || "0.00";
  // const product_sale_price = isSaleActive
  //   ? inventory?.sale_price || "0.00"
  //   : null;

  // product price info
  const product_variant_id =
    productDetail?.product_detail?.variants?.[0]?.inventory?.id;
  const feature_image = productDetail?.feature_image?.image;
  const product_images = extractImageUrls(productDetail?.images);
  const images = feature_image
    ? [feature_image, ...product_images]
    : product_images;
  const router = useRouter();
  useEffect(() => {
    if (product_id) {
      setPageLoader((prev) => true);
      callApi({
        endPoint: `/products/${product_id}`,
        method: METHODS.get,
        instanceType: INSTANCE.authorize,
      })
        .then((res) => {
          setProductDetail(res.data);
        })
        .catch((err) => {
          toastMessages(
            err?.response?.data?.message || T["invalid_product_id"]
          );
          router.push("/products");
        })
        .finally(() => {
          setPageLoader((prev) => false);
        });
    }
  }, []);

  useEffect(() => {
    console.log(productDetail, "productDetail inside useEffect");
    fetchProducts();
  }, [productDetail]);

  const fetchProducts = () => {
    callApi({
      endPoint: `/products`,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: { search: productDetail?.category?.[0]?.name },
    })
      .then((res) => {
        const filteredProducts = res.data?.results?.filter(
          (item) => item.id !== productDetail.id
        );
        setRelatedProducts(filteredProducts ?? []);
      })
      .catch((err) => {})
      .finally(() => {});
  };

  console.log(relatedProducts, "these are related products");

  const handleChangeLocation = (data) => {
    setLocationLoader((prev) => true);
    callApi({
      endPoint: SEARCH_ZIPCODE,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        zipcode: zipcode || "",
      },
    })
      .then((res) => {
        toastMessages(T["location_updated_successfully"], successType);
        setZipcode("");
      })
      .catch((err) => {
        console.log(err?.response?.data, "zipcode err");
        toastMessages(err.response.data.message || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setLocationLoader((prev) => false);
      });
  };
  useEffect(() => {
    if (
      selectedVariant?.inventory?.sale_price_dates_from &&
      selectedVariant?.inventory?.sale_price_dates_to
    ) {
      const saleStartDate = new Date(
        selectedVariant.inventory.sale_price_dates_from
      );
      const saleEndDate = new Date(
        selectedVariant.inventory.sale_price_dates_to
      );
      const currentDate = new Date();

      if (currentDate >= saleStartDate && currentDate <= saleEndDate) {
        setIsSaleActive(true);
      } else {
        setIsSaleActive(false);
      }
    } else {
      setIsSaleActive(false);
    }
  }, [selectedVariant]);

  const addToCart = async (variant_id, quantity) => {
    console.log(variant_id, quantity, "product");

    const token = localStorage?.getItem("token");
    const apiUrl = `${baseURL}/cart/item/`;
    const payload = {
      product_variant: variant_id,
      quantity: quantity,
    };

    console.log(payload, "payload");
    setCartButtonLoader((prev) => true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await axios.post(apiUrl, payload, {
        headers,
        withCredentials: true,
      });

      toastMessages(
        response?.data?.message || T["product_added_to_cart"],
        successType
      );

      fetchCart(dispatch, setPageLoader, () => {
        dispatch(setShowCartSidebar(true));
      });
      // setShowSelectBasketModal(!showSelectModal);
    } catch (err) {
      console.log(err, "cart error");

      toastMessages(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          DEFAULT_ERROR_MESSAGE
      );
    } finally {
      setCartButtonLoader((prev) => false);
    }
  };
  console.log(productDetail, "these are product details");

  const addToBasket = (
    product,
    quantity,
    customId = null,
    userBasketId = null
  ) => {
    const token = localStorage.getItem("token");
    if (token) {
      if (selectedBasket?.id) {
        setBasketLoader((prev) => true);
        const payload = {
          products: [
            {
              product_variant_id: customId
                ? customId
                : String(product?.id || product?.inventory?.id),
              quantity: quantity,
            },
          ],
        };

        callApi({
          endPoint: `/user-basket/${
            userBasketId ? userBasketId : selectedBasket?.id
          }/`,
          method: customId ? METHODS.patch : METHODS.post,
          instanceType: INSTANCE.authorize,
          payload: payload,
        })
          .then((res) => {
            console.log(res, "basket response");
            toastMessages(
              res?.data?.message || T["product_added_to_basket"],
              successType
            );
            fetchUserBasket(dispatch, setBasketLoader);
          })
          .catch((err) => {
            console.log(err, "basket errs");
            toastMessages(
              err?.response?.data?.message || DEFAULT_ERROR_MESSAGE
            );
          })
          .finally(() => {
            setBasketLoader((prev) => false);
          });
      } else {
        setShowModal(true);
      }
    } else {
      setShowLoginModal(true);
    }
  };

  const addToWishlist = (e, item, isArrival) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    const isLiked = item?.is_favourite;
    // const product_id = item?.product_detail?.variants?.[0]?.inventory?.id;
    const product_id = item?.id;
    const payload = {
      product: product_id,
    };
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    setPageLoader((prev) => true);
    callApi({
      endPoint: isLiked ? `/favourite-item/` : WISHLIST,
      method: isLiked ? METHODS.delete : METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: payload,
    })
      .then((res) => {
        toastMessages(
          getWishlistMessage(isLiked),
          successType
        );
        fetchProducts();
        fetchWishList(dispatch, setPageLoader); // will update the redux state for wishlist
      })
      .catch((err) => {
        toastMessages(
          err?.response?.data?.error ||
            err?.response?.data?.non_field_errors?.[0] ||
            DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };

  console.log(selectedVariant, "selectedVariant");
  return (
    <>
      {pageLoader && <PageLoader />}
      <div className="p-16 bg-white">
        <BreadcrumbSection product_name={product_name} />
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-1/2">
            {images?.length ? (
              <SimpleSlider imageUrls={images} />
            ) : (
              <div>{imagePlaceholder}</div>
            )}
          </div>
          <div className="lg:w-1/2">
            {/* <div className="flex gap-2">
            <span className="underline">Home</span>
            <span className="underline">Breads</span>
            <span className="underline">Croissant</span>
          </div> */}
            <div className="flex ">
              <h1 className="text-[35px] font-normal mb-2 capitalize">
                {product_name}
              </h1>
              {/* <span>⭐⭐⭐⭐⭐</span>
            <span>(01)</span> */}
            </div>
            <span className="common-small-text text-[16px] font-normal text-black">{`${
              selectedVariant?.label || "-"
            }`}</span>
            <div className="text-[25px] font-extrabold mt-[10px] space-x-2">
              {isSaleActive ? (
                <>
                  <span className="text-green-500">
                    {`${selectedVariant?.inventory?.sale_price || "0.00"} SEK`}
                  </span>
                  <span className="line-through text-[#B6B6B6]">
                    {`${
                      selectedVariant?.inventory?.regular_price || "0.00"
                    } SEK`}
                  </span>
                </>
              ) : (
                <span>
                  {`${selectedVariant?.inventory?.regular_price || "0.00"} SEK`}
                </span>
              )}
            </div>

            <VariantSelect
              product={productDetail}
              selectedVariant={selectedVariant}
              onSelectVariant={setSelectedVariant}
            />
            <span className="text-[14px] font-normal text-black">
              (Inclusive of all taxes)
            </span>
            <ItemCounter
              itemCount={itemCount}
              setItemCount={setItemCount}
              item={productDetail}
            />
            <div className="flex items-center gap-4 mt-4">
              {previousPath !== "/baskets" && (
                <Button
                  className="px-4 py-2 border border-green-500  text-[18px] font-normal bg-[#22c55e] text-white p-2 rounded"
                  btnText={T["add_to_cart"]}
                  btnType="button"
                  btnClick={() => addToCart(selectedVariant?.id, itemCount)}
                  btnLoader={cartButtonLoader}
                />
              )}

              {/* {selectedBasket?.id &&
              checkisEligible(selectedBasket, productDetail?.id) ? (
              <Button
                className="px-4 py-2 border border-green-500 text-green-500 rounded text-[18px] font-normal p-2"
                btnText={T["add_to_basket"]}
                btnType="button"
                btnClick={() => addToBasket(productDetail, itemCount)}
                btnLoader={basketLoader}
              />
            ) : (
              ""
            )} */}

              {previousPath === "/baskets" &&
              selectedBasket?.is_customizable ? (
                <Button
                  className="px-4 py-2 border border-green-500 text-green-500 rounded text-[18px] font-normal p-2"
                  btnText={T["add_to_basket"]}
                  btnType="button"
                  btnClick={() => addToBasket(productDetail, itemCount)}
                  btnLoader={basketLoader}
                />
              ) : (
                ""
              )}
            </div>
            {/*  */}
            {/* {token ? (
              <>
                <h1 className="text-[14px] font-normal mt-[15px]">
                  {T["delivery_location"]}
                </h1>
                <div className="flex space-x-1 pt-2 border-b border-[#EAEAEA] pb-[30px]">
                  <input
                    className="border border-black px-[10px] py-0 bg-transparent rounded-[6px]"
                    placeholder={T["enter_zipcode"]}
                    value={zipcode}
                    onChange={(e) => {
                      const numbersOnly = e.target.value.replace(/[^0-9]/g, "");
                      setZipcode(numbersOnly);
                    }}
                    maxLength={5}
                  />
                  <Button
                    className={"common-btn w-32 rounded-md bg-[#22c55e]"}
                    btnText={T["change"]}
                    disabled={!zipcode || locationLoader}
                    btnType="button"
                    btnClick={() => handleChangeLocation()}
                    btnLoader={buttonLoader}
                  />
                </div>
              </>
            ) : (
              ""
            )} */}

            <div className="mt-6">
              <h2 className="text-[20px] font-bold">Why shop from us?</h2>
              <ul className="space-y-4 text-sm mt-2">
                <li className="text-[18px] font-semibold">
                  Superfast Delivery
                  <p className="text-[16px] font-normal mt-1">
                    Freshly baked croissants. Please check the package for all
                    details before purchase.
                  </p>
                </li>
                <li className="text-[18px] font-semibold">
                  Exclusive offers on quality items
                  <p className="text-[16px] font-normal mt-1">
                    Freshly baked croissants. Please check the package for all
                    details before purchase.
                  </p>
                </li>
                <li className="text-[18px] font-semibold">
                  Always fresh & in stock
                  <p className="text-[16px] font-normal mt-1">
                    Freshly baked croissants. Please check the package for all
                    details before purchase.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
        {/* commented for future use */}
        {relatedProducts?.length ? (
          <div className="related-product-section pt-8">
            <h2 className="text-center text-[45px] text-black font-bold mb-3">
              Similar Items You Might also Like
            </h2>
            <img
              class="w-[153px] mx-auto"
              alt="headingImg"
              src="/images/headingline.png"
            ></img>
            <div className="grid grid-cols-3 lg:grid-cols-3 gap-6">
              {relatedProducts?.slice(0, 6)?.map((curElem, idx) => (
                <UpdatedProductCard
                  key={idx}
                  product={curElem}
                  addToWishlist={addToWishlist}
                  addToCart={addToCart}
                  addToBasket={addToBasket}
                />
              ))}
            </div>
          </div>
        ) : (
          ""
        )}

        <div className="w-24 mt-5">
          <Image
            src={item4}
            alt="Croissant"
            className="w-full border border-[#C7C7C7] rounded-[10px] p-[10px]"
            width={500}
          />
        </div>
        <div className="mt-6 product-details-sec">
          <h2 className="text-[22px] font-bold">Product Details</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ul className="space-y-2 text-sm mt-2">
              <li className="text-[18px] font-semibold text-black mb-[5px]">
                Unit
              </li>
              <span className="text-[16px] font-normal text-[#505050]">{`${selectedVariant?.label}`}</span>

              <li className="text-[18px] font-semibold text-black mb-[5px]">
                Country of Origin
              </li>
              <span className="text-[16px] font-normal text-[#505050]">
                Sweden
              </span>
            </ul>
            <ul className="space-y-2 text-sm">
              <li className="text-[18px] font-semibold text-black mb-[5px]">
                How to use
              </li>
              <span className="text-[16px] font-normal text-[#505050]">
                Snacks, Breads
              </span>
              <li className="text-[18px] font-semibold text-black mb-[5px]">
                Health Benefits
              </li>
              <span className="text-[16px] font-normal text-[#505050]">
                Vitamin A, C & B6 Rich
              </span>
              <li className="text-[18px] font-semibold text-black mb-[5px]">
                Customer Care Details
              </li>
              <span className="text-[16px] font-normal text-[#505050]">
                Email:{EMAIL_ADDRESS}
              </span>
            </ul>
          </div>
          <h2 className="text-[18px] font-semibold text-black mb-[5px]">
            Return Policy
          </h2>
          <p className="text-[16px] font-normal text-[#505050] mt-1">
            Freshly baked croissants. Please check the package for all details
            before purchase.
          </p>
          <h2 className="text-[18px] font-semibold text-black mb-[5px]">
            Disclaimer
          </h2>
          <p className="text-[16px] font-normal text-[#505050] mt-1">
            This image is shown as a representation and may slightly vary from
            the actual product. Every effort is made to maintain the accuracy of
            all information displayed.
          </p>
        </div>

        <ExclusiveOfferBanner />
        {showLoginModal && (
          <AddLoginModal
            closeModal={() => setShowLoginModal(false)}
            setShowLoginModal={setShowLoginModal}
          />
        )}
      </div>
    </>
  );
};

export default Page;
