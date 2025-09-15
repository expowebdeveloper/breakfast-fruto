"use client";
import {
  callApi,
  fetchCart,
  fetchWishList,
  METHODS,
} from "@/_Api-Handlers/apiFunctions";
import { ADD_TO_CART, ORDERS, WISHLIST } from "@/_Api-Handlers/APIUrls";
import ProductCard from "@/_components/_common/Card/ProductCard";
import UpdatedProductCard from "@/_components/_common/Card/UpdatedProductCard";
import PageLoader from "@/_components/_common/PageLoader";
import SortByFilter from "@/_components/_common/SortByFilter";
import Pagination from "@/_components/Pagination";
import { DEFAULT_ERROR_MESSAGE, PRODUCTS_SORT_BY } from "@/_constants/constant";
import {
  createProductParams,
  createWishlistParams,
  getWishlistMessage,
  onPageChange,
} from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { setWishList } from "@/Redux/addToWishListSlice";
import { useRouter } from "next/navigation";
import React, { Fragment, useEffect, useState } from "react";
import { useDispatch } from "react-redux";

function Page() {
  const dispatch = useDispatch();
  const router = useRouter();
  const [favourites, setFavourites] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [pageLoader, setPageLoader] = useState(false);
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    fetchFavorites();
  }, [currentPage, sortBy]);
  const fetchFavorites = () => {
    setPageLoader((prev) => true);
    const wishlistParams = createWishlistParams(sortBy);
    callApi({
      endPoint: WISHLIST,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: {
        page: currentPage,
        ...wishlistParams,
      },
    })
      .then((res) => {
        setFavourites(res.data.results || []);
        setTotalData(res.data.count || 0);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
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
        fetchWishList(dispatch, setPageLoader); // will update the redux state for wishlist
        fetchFavorites();
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

  const addToCart = (variant_id, quantity) => {
    console.log(variant_id, quantity, "product");
    const payload = {
      product_variant: variant_id,
      quantity: quantity,
    };
    console.log(payload, "payload");
    setPageLoader((prev) => true);
    callApi({
      endPoint: ADD_TO_CART,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: payload,
    })
      .then((res) => {
        console.log(res, "cart response");
        toastMessages(
          res?.data?.message || T["product_added_to_cart"],
          successType
        );
        fetchCart(dispatch, setPageLoader);
        // setShowSelectBasketModal(!showSelectModal);
      })
      .catch((err) => {
        console.log(err, "cart error");
        toastMessages(err.response.data.error || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };
  const addToBasket = (
    product,
    quantity,
    customId = null,
    userBasketId = null
  ) => {
    console.log(product, quantity, customId, userBasketId, "product");
  };

  return (
    <>
      {pageLoader && <PageLoader />}
      {!favourites?.length ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center w-full">
          {/* <h2 className="text-2xl font-semibold mb-4"></h2> */}
          <p className="mb-6 text-gray-600">{T["no_favourites_yet"]}</p>
          <button
            onClick={() => router.push("/products")}
            className="bg-green-500 text-white py-2 px-4 rounded-md"
          >
            {T["start_shopping"]}
          </button>
        </div>
      ) : (
        <div className=" p-6 ">
          <div className="mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {T["favorite_products"]}
              <span className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {favourites?.length || 0}
              </span>
            </h2>
          </div>
          <div className="sort-by-filter">
            <SortByFilter
              handleSortBy={(val) => setSortBy(val)}
              sortByOptions={PRODUCTS_SORT_BY}
              value={sortBy}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 text-black mt-[20px]">
            {favourites?.length > 0 ? (
              favourites.map((item, idx) => (
                <Fragment key={idx}>
                  <UpdatedProductCard
                    product={item}
                    addToWishlist={addToWishlist}
                    addToCart={addToCart}
                    addToBasket={addToBasket}
                    page="favourites"
                  />
                </Fragment>
              ))
            ) : (
              <div className="w-full text-center py-8">
                {T["no_favourite_item_found"]}
              </div>
            )}
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
              <Pagination
                totalData={totalData}
                itemsPerPage={10}
                currentPage={currentPage}
                onPageChange={(page) => onPageChange(page, setCurrentPage)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Page;
