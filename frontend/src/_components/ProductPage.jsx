"use client";
import Basket from "@/_components/_common/Basket";
import ExclusiveOfferBanner from "@/_components/_common/ExclusiveOfferBanner";
import Sidebar from "@/_components/SideBar";
import React, { Fragment, use, useEffect, useState } from "react";
import {
  callApi,
  fetchCart,
  fetchUserBasket,
  fetchWishList,
  METHODS,
} from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import ItemCategory from "@/_components/_common/ItemSubCategory";
import { usePathname, useRouter } from "next/navigation";
import { successType, toastMessages } from "@/_utils/toastMessage";
import ScreenLoader from "@/_components/_common/ScreenLoader";
import ProductCard from "@/_components/_common/Card/ProductCard";
import ItemSubCategory from "@/_components/_common/ItemSubCategory";
import NoDataFound from "@/_components/_common/NoDataFound";
import { setWishList } from "@/Redux/addToWishListSlice";
import {
  ADD_TO_CART,
  BASKETS,
  CATEGORIES,
  CATEGORIES_PRODUCTS,
  PRODUCTS,
  WISHLIST,
} from "@/_Api-Handlers/APIUrls";
import { useDispatch, useSelector } from "react-redux";
import AddLoginModal from "@/_components/_common/Modals/AddLoginModal";
import {
  BASKET_TYPE_OPTIONS,
  DEFAULT_ERROR_MESSAGE,
  PRODUCTS_SORT_BY,
} from "@/_constants/constant";
import {
  addItemToBasket,
  getSelectedBasketById,
  setSelectedBasket,
} from "@/Redux/addToBasketSlice";
import {
  createProductParams,
  getCurrentUserBasket,
  getTotalQuantity,
  getWishlistMessage,
  onPageChange,
} from "@/_utils/helpers";
import PageLoader from "@/_components/_common/PageLoader";
import SortByFilter from "@/_components/_common/SortByFilter";
import SubcategorySection from "@/_components/_common/SubcategorySection";
import UpdatedProductCard from "@/_components/_common/Card/UpdatedProductCard";
import Pagination from "@/_components/Pagination";
import UpdatedBasketSection from "@/_components/UpdatedBasketSection";
import axios from "axios";
import { T } from "@/_utils/LanguageTranslator";
import Banner from "@/_components/Banner";
import DeleteConfirmationModal from "./_common/DeleteConfirmationModal";
import { setShowCartSidebar, setShowCategories } from "@/Redux/userSlice";
import CategoriesSection from "./CategoriesSection";
import BasketCard from "./BasketCard";
import AddMoreProductModal from "./AddMoreProductModal";

const ProductPage = () => {
  const pathname = usePathname();
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const router = useRouter();
  const { showCategories } = useSelector((state) => state?.user);

  const [pageLoader, setPageLoader] = useState(false);
  const [categories, setCategories] = useState([]);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [removeProductInfo, setRemoveProductInfo] = useState({
    show: false,
    id: null,
  });

  const [like, setLike] = useState(false);
  const [likedProducts, setLikedProducts] = useState([]);
  const [selectedId, setSelectedId] = useState();
  const [loader, setLoader] = useState(false);
  // for the categories shown in the sidebar
  const [sideBarOptions, setSideBarOptions] = useState();
  const [categoryPage, setCategoryPage] = useState(1);
  const [totalCategories, setTotalCategories] = useState(0);
  // for the categories shown in the sidebar

  // for products
  const [productDetails, setProductDetails] = useState([]);
  const [productPage, setProductPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [sortBy, setSortBy] = useState("");

  // for products

  // for baskets
  const [baskets, setBaskets] = useState([]);
  const [basketPage, setBasketPage] = useState(1);
  const [totalBaskets, setTotalBaskets] = useState(0);
  const [basketSortBy, setBasketSortBy] = useState("");
  const [basketType, setBasketType] = useState("");
  console.log(basketType, "basketType");

  // for baskets

  const { selectedBasket, userBasket } = useSelector(
    (state) => state.addToBasket
  );
  const [currentAvailableSpace, setCurrentAvailableSpace] = useState(
    selectedBasket?.space_left
  );
  const currentUserBasket = getCurrentUserBasket(userBasket, selectedBasket);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddMoreProductModal, setShowAddMoreProductModal] = useState(false);
  const dispatch = useDispatch();

  const [showModal, setShowModal] = useState(false);

  // fetch products

  useEffect(() => {
    fetchProducts();
  }, [
    selectedCategory,
    productPage,
    sortBy,
    selectedSubCategory,
    selectedBasket,
  ]);

  const fetchProducts = () => {
    setPageLoader((prev) => true);
    const productParams = createProductParams(
      selectedCategory,
      productPage,
      sortBy,
      selectedSubCategory
    );
    console.log(productParams, "inside fetch products");
    const apiParams = {
      ...productParams,
      //   only pass basket_id param if page is /baskets and there is some selected basket there
      ...(location.pathname === "/baskets" &&
        selectedBasket?.id && { basket_id: selectedBasket.id }),
    };

    callApi({
      endPoint: pathname === "/baskets" ? "/showproductfrombasket/" : PRODUCTS,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: apiParams,
    })
      .then((res) => {
        console.log(res, "sfafsd");
        setProductDetails(
          pathname === "/baskets" ? res?.data || [] : res?.data?.results || []
        );
        setTotalProducts(res?.data?.total_products || 0);
      })
      .catch((err) => {
        setProductDetails([]);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };
  // fetch products
  console.log(selectedCategory, "this is selected category");
  // fetch categories

  useEffect(() => {
    setButtonLoader((prev) => true);
    callApi({
      endPoint: CATEGORIES,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: {
        page: categoryPage,
      },
    })
      .then((res) => {
        const categories = res?.data?.results?.length ? res?.data?.results : [];
        setCategories(categories.slice(0, 5));
        setSideBarOptions(categories);
        setTotalCategories(res?.data?.count || 0);
      })
      .catch((err) => { })
      .finally(() => {
        setButtonLoader((prev) => false);
      });
  }, [categoryPage]);

  console.log(categories, "categories");

  // fetch baskets
  useEffect(() => {
    // can be used for creating basket params too
    setPageLoader((prev) => true);
    const params = createProductParams("", basketPage, basketSortBy, "");

    callApi({
      endPoint: BASKETS,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: { ...params, is_customizable: basketType },
    })
      .then((res) => {
        console.log(res?.data?.results, "basketList");
        // setBasketList(res?.data?.results || []);
        setBaskets(res?.data?.results || []);
        setTotalBaskets(res?.data?.count || 0);
      })
      .catch((err) => {
        toastMessages(err?.message || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  }, [basketPage, basketSortBy, basketType]);

  const handleItemCategory = (subCat) => {
    callApi({
      endPoint: CATEGORIES_PRODUCTS,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: {
        // page: "1",
        category: selectedCategory.name,
        subcategory: subCat.name,
      },
    })
      .then((res) => {
        setProductDetails(res.data.results);
      })
      .catch((err) => {
        toastMessages(err.message || DEFAULT_ERROR_MESSAGE);
      });
  };

  const handleItem = (product_id) => {
    router.push(`/products/${product_id}`);
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

  const addToCart = async (variant_id, quantity) => {
    const token = localStorage?.getItem("token");

    const apiUrl = `${baseURL}/cart/item/`;
    const payload = {
      product_variant: variant_id,
      quantity: quantity,
    };

    setPageLoader(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await axios.post(apiUrl, payload, {
        headers,
        withCredentials: true,
      });

      toastMessages(
        T["product_added_to_cart"],
        successType
      );

      fetchCart(dispatch, setPageLoader, () => {
        dispatch(setShowCartSidebar(true));
      }); // setShowSelectBasketModal(!showSelectModal);
    } catch (err) {
      toastMessages(
        err?.response?.data?.error?.toLowerCase().includes('sorry! we are out of stock')
          ? T["out_of_stock"]
          : err?.response?.data?.error || DEFAULT_ERROR_MESSAGE
      );
    } finally {
      setPageLoader(false);
    }
  };

  // const addToBasket = (selectedVariant, quantity) => {
  //   setShowBasket(false);
  //   dispatch(
  //     addItemToBasket(
  //       selectedBasket?.id,
  //       selectedVariant?.inventory?.id,
  //       quantity,
  //       () => {
  //         if (userBasket?.user_basket?.id) {
  //           dispatch(getSelectedBasketById(userBasket?.user_basket?.id));
  //         }
  //       }
  //     )
  //   );
  // };

  const fetchMoreBaskets = () => {
    if (baskets.length >= totalBaskets) return;
    setPageLoader((prev) => true);
    callApi({
      endPoint: BASKETS,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: { page: basketPage + 1 },
    })
      .then((res) => {
        setBaskets((prev) => [...prev, ...res?.data?.results]);
        setBasketPage((prev) => prev + 1);
        setTotalBaskets(res?.data?.count || 0);
      })
      .catch((err) => { })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };

  const addToBasket = (
    product,
    quantity,
    customId = null,
    userBasketId = null,
    isRemove = false
  ) => {
    const token = localStorage.getItem("token");
    if (token) {
      // if basket is non customizable then don't allow user to add items in the basket
      if (!selectedBasket?.is_customizable) {
        toastMessages(T["basket_not_customizable"], "error", 4000);
        return;
      }

      if (selectedBasket?.id) {
        isRemove
          ? setButtonLoader((prev) => true)
          : setPageLoader((prev) => true);
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
          endPoint: `/user-basket/${userBasketId ? userBasketId : selectedBasket?.id
            }/`,
          method: customId ? METHODS.patch : METHODS.post,
          instanceType: INSTANCE.authorize,
          payload: payload,
        })
          .then((res) => {
            toastMessages(
              T["product_added_to_basket"],
              successType
            );
            fetchUserBasket(dispatch, setPageLoader);
          })
          .catch((err) => {
            toastMessages(
              err?.response?.data?.message || DEFAULT_ERROR_MESSAGE
            );
          })
          .finally(() => {
            isRemove
              ? setButtonLoader((prev) => false)
              : setPageLoader((prev) => false);
            setRemoveProductInfo({
              show: false,
              id: null,
            });
          });
      } else {
        setShowModal(true);
      }
    } else {
      setShowLoginModal(true);
    }
  };

  const removeBasket = (basketId) => {
    if (basketId) {
      setPageLoader((prev) => true);
      callApi({
        endPoint: `/user-basket/${basketId}/`,
        method: METHODS.delete,
        instanceType: INSTANCE.authorize,
      })
        .then(() => {
          dispatch(setSelectedBasket({}));
        })
        .catch((err) => { })
        .finally(() => {
          setPageLoader((prev) => false);
        });
    } else {
      dispatch(setSelectedBasket({}));
    }
  };

  const addBasketToCart = (basketId, checkforShowingModal = true) => {
    if (
      checkforShowingModal &&
      currentAvailableSpace - getTotalQuantity(currentUserBasket?.products) &&
      selectedBasket?.is_customizable &&
      calculateRemainingPrice()
    ) {
      // price validation required  (add condition for price as well)
      setShowAddMoreProductModal({
        show: true,
        basketId: basketId,
      });
      return;
    }
    const payload = {
      user_basket_id: basketId,
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
          T["basket_added_to_cart"],
          successType
        );
        fetchCart(dispatch, setPageLoader, () => {
          dispatch(setShowCartSidebar(true));
        });
        // setShowSelectBasketModal(!showSelectModal);
      })
      .catch((err) => {
        console.log(err, "cart error");
        toastMessages(
          err.response.data.error ||
          err.response.data.message ||
          DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        setPageLoader((prev) => false);
        if (!checkforShowingModal) {
          setShowAddMoreProductModal({
            show: false,
            basketId: null,
          });
        }
      });
  };
  const createUserBasket = (basket) => {
    setButtonLoader((prev) => true);
    callApi({
      endPoint: `/clone-user-basket/`,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        basket_id: basket?.id,
      },
    })
      .then((res) => {
        setCurrentAvailableSpace(basket?.space_left);
        dispatch(setSelectedBasket(basket));
      })
      .catch((err) => {
        toastMessages(
          err.response.data.error ||
          err.response.data.message ||
          DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        setButtonLoader((prev) => false);
      });
  };
  const calculateRemainingPrice = () => {
    const basketPrice = currentUserBasket?.basket_price || 0; // Default to 0 if undefined
    const totalProductPrice = currentUserBasket?.product_total_price || 0; // Default to 0 if undefined

    const remainingPrice = basketPrice - totalProductPrice;

    // Round the remaining price to two decimal places
    const roundedRemainingPrice = remainingPrice.toFixed(2);

    // Format the remaining price with the currency (SEK)
    return roundedRemainingPrice || 0;
  };

  return (
    <>
      {pageLoader && <PageLoader />}
      <Banner />
      <div className="bg-gray-50">
        {/* for products page show this section , for baskets page only show when basket is selected and product listinf  is showing */}
        {pathname === "/products" ||
          (pathname === "/baskets" && selectedBasket?.id) ? (
          <div className="flex flex-col sm:flex-row items-center category-container-wrapper gap-4 sm:gap-0">
            <button
              onClick={() => dispatch(setShowCategories(!showCategories))}
              className="w-full sm:w-auto flex items-center justify-center bg-gradient-to-r from-[#92C64E] to-[#4BAF50] text-white px-4 py-2 rounded-full font-semibold hover:bg-green-600 transition all-category-btn"
            >
              <span className="mr-2">☰</span>
              Alla kategorier
            </button>
            <CategoriesSection
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </div>
        ) : (
          ""
        )}
        <div className="flex flex-col lg:flex-row px-2">
          {(pathname !== "/baskets" && showCategories) ||
            (pathname === "/baskets" && selectedBasket?.id && showCategories) ? (
            <div className="w-full lg:w-auto">
              <Sidebar
                sideBarOptions={sideBarOptions}
                totalCategories={totalCategories}
                handleLoadMore={() => setCategoryPage((prev) => prev + 1)}
                selectedCategory={selectedCategory}
                handleSideBar={(cat) => {
                  setSelectedCategory(cat);
                  setSelectedSubCategory("");
                }}
                buttonLoader={buttonLoader}
              />
            </div>
          ) : null}

          <main
            className={`px-4 sm:px-8 w-full ${
              pathname === "/baskets" && selectedBasket?.id
                ? "lg:w-[calc(100%-320px)]"
                : ""
            } desktop-calc1200`}
          >
            <SubcategorySection
              subcategories={selectedCategory?.subcategories}
              handleItemCategory={(cat) => setSelectedSubCategory(cat)}
            />

            {/* prodcuts section  */}
            {/* on products page show products but on baskets page only show products when basket is selected */}
            {pathname !== "/baskets" ||
              (pathname === "/baskets" && selectedBasket?.id) ? (
              productDetails?.length > 0 ? (
                <>
                  <h4 className="heading-title">{T["products"]}</h4>
                  <SortByFilter
                    handleSortBy={(val) => setSortBy(val)}
                    sortByOptions={PRODUCTS_SORT_BY}
                    value={sortBy}
                  />
                  <div className="products-card-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[20px] mt-[20px]">
                    {productDetails.map((item, idx) => (
                      <Fragment key={idx}>
                        <UpdatedProductCard
                          product={item}
                          addToWishlist={addToWishlist}
                          addToCart={addToCart}
                          addToBasket={addToBasket}
                        />
                      </Fragment>
                    ))}
                  </div>
                  <Pagination
                    totalData={totalProducts}
                    itemsPerPage={10}
                    currentPage={productPage}
                    onPageChange={(page) => onPageChange(page, setProductPage)}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center w-full h-1/2">
                  <NoDataFound />
                </div>
              )
            ) : null}

            {/* prodcuts section for product page */}

            {/* when page is baskets and n basket is selected then show basket listing*/}
            {pathname === "/baskets" && !selectedBasket?.id ? (
              baskets?.length > 0 ? (
                <>
                  <h4 className="heading-title">{"korgar"}</h4>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
                    <SortByFilter
                      handleSortBy={(val) => setBasketSortBy(val)}
                      sortByOptions={PRODUCTS_SORT_BY}
                      value={basketSortBy}
                    />
                    <SortByFilter
                      isType={true}
                      handleSortBy={(val) => {
                        setBasketType(val);
                      }}
                      sortByOptions={BASKET_TYPE_OPTIONS}
                      value={basketType}
                    />
                  </div>
                  <div className="products-card-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[20px] mt-[20px]">
                    {baskets.map((item, idx) => (
                      <Fragment key={idx}>
                        <BasketCard
                          basket={item}
                          loader={buttonLoader}
                          chooseBasket={(basket) => {
                            const token = localStorage.getItem("token");
                            if (!token) {
                              setShowLoginModal(true);
                            } else {
                              if (!basket?.is_customizable) {
                                createUserBasket(basket);
                              } else {
                                setCurrentAvailableSpace(basket?.space_left);
                                dispatch(setSelectedBasket(basket));
                              }
                            }
                          }}
                        />
                      </Fragment>
                    ))}
                  </div>
                  <Pagination
                    totalData={totalBaskets}
                    itemsPerPage={10}
                    currentPage={basketPage}
                    onPageChange={(page) => onPageChange(page, setBasketPage)}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center w-full h-1/2">
                  <NoDataFound />
                </div>
              )
            ) : null}

            {/* when page is baskets and n basket is selected then show basket listing*/}

            {showLoginModal && (
              <AddLoginModal
                closeModal={() => setShowLoginModal(false)}
                setShowLoginModal={setShowLoginModal}
              />
            )}
          </main>
          {/* <Basket setShowBasket={setShowBasket} showBasket={showBasket} /> */}
          {/* only show baskets once basket is selected  */}
          {/* {pathname === "/baskets" && selectedBasket?.id ? ( */}
          {pathname === "/baskets" && selectedBasket?.id ? (
            <UpdatedBasketSection
              baskets={baskets}
              fetchMoreBaskets={fetchMoreBaskets}
              removeBasket={removeBasket}
              addBasketToCart={addBasketToCart}
              currentAvailableSpace={currentAvailableSpace}
              setCurrentAvailableSpace={setCurrentAvailableSpace}
              addToBasket={addToBasket}
              onRemoveProduct={(product, id, basket_id) => {
                setRemoveProductInfo({
                  show: true,
                  product: product,
                  id: id,
                  basket_id: basket_id,
                });
              }}
            />
          ) : (
            ""
          )}
        </div>
        <ExclusiveOfferBanner />
      </div>
      {removeProductInfo?.show && (
        <DeleteConfirmationModal
          title={T["remove_product_from_basket"]}
          description={T["remove_product_from_basket_description"]}
          deleteText={T["remove"]}
          onCancel={() =>
            setRemoveProductInfo({
              show: false,
              product: null,
              id: null,
              basket_id: null,
            })
          }
          loader={buttonLoader}
          onDelete={() => {
            const { product, id, basket_id } = removeProductInfo;
            addToBasket(product, 0, id, basket_id, true); // product_id, quantity, id, basket id,isRemove
          }}
        />
      )}

      {showAddMoreProductModal?.show && (
        <AddMoreProductModal
          onClose={() => {
            setShowAddMoreProductModal({
              show: false,
              basketId: null,
            });
          }}
          currentAvailableSpace={currentAvailableSpace}
          remainingPrice={calculateRemainingPrice()}
          onContinue={() => {
            addBasketToCart(showAddMoreProductModal?.basketId, false);
          }}
        />
      )}
    </>
  );
};

export default ProductPage;
