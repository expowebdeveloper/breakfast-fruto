"use client";
import { dummyWelcomePopupData, SERVICE_CARD } from "@/app/_constant/Constant";
import { T } from "@/_utils/LanguageTranslator";
import {
  callApi,
  fetchCart,
  fetchWishList,
  METHODS,
} from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { successType, toastMessages } from "@/_utils/toastMessage";
import Button from "@/_components/_common/Button";
import { useRouter } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BUTTON_TYPE,
  categorySettings,
  DEFAULT_ERROR_MESSAGE,
  ITEM_CATEGORY,
  stripHtmlTags,
} from "@/_constants/constant";
import ExclusiveOfferBanner from "@/_components/_common/ExclusiveOfferBanner";
import moment from "moment";
import ProductCard from "@/_components/_common/Card/ProductCard";
import { setWishList } from "@/Redux/addToWishListSlice";
import {
  ADD_TO_CART,
  BASKETS,
  CATEGORIES,
  NEW_ARRIVAL_PRODUCTS,
  PREMIUM_PRODUCTS,
  PRODUCTS,
  SEARCH_ZIPCODE,
  WELCOME_POPUP_ENDPOINT,
  WISHLIST,
} from "@/_Api-Handlers/APIUrls";
import { addItemToBasket, setSelectedBasket } from "@/Redux/addToBasketSlice";
import AddLoginModal from "@/_components/_common/Modals/AddLoginModal";
import { CART, StarFilledIcon, StarIcon } from "@/Assets/Icons/Svg";
import {
  createPreview,
  createRequiredValidation,
  extractProducts,
  getWishlistMessage,
  useItemCount,
} from "@/_utils/helpers";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import { useForm } from "react-hook-form";
import SelectBasketModal from "@/_components/_common/Modals/SelectBasketModal";
import PageLoader from "@/_components/_common/PageLoader";
import { imagePlaceholder } from "@/_Svgs/Svg";
import UpdatedProductCard from "@/_components/_common/Card/UpdatedProductCard";
import NewArrivalCard from "@/_components/_common/NewArrivalCard";
import axios from "axios";
import Header from "@/_components/_common/Header";
import Footer from "@/_components/_common/Footer";
import AddressAutoComplete from "@/_components/AddressAutoComplete";
import LocationField from "@/_components/LocationField";
import SearchByState from "@/_components/SearchByState";
import CategoriesSection from "@/_components/CategoriesSection";
import InitialModal from "@/_components/_common/Modals/InitialModal";
import FruitBasketCircle from "@/_components/FruitBasketCircle";
import CartSidebar from "@/_components/CartSidebar";
import { setShowCartSidebar } from "@/Redux/userSlice";
import Image from "next/image";

const Page = () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const timerRef = useRef(null);
  const { showCartSidebar } = useSelector((state) => state?.user);
  console.log(showCartSidebar, "this is showCartSidebar")
  const router = useRouter();
  const formConfig = useForm();
  const dispatch = useDispatch();
  const [buttonLoader, setButtonLoader] = useState(false);
  const [basketDetails, setBasketDetails] = useState();
  const [premiumProducts, setPremiumProducts] = useState();
  const [newArrivals, setNewArrivals] = useState();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [showSelectModal, setShowSelectBasketModal] = useState(false);
  const [selectedPremiumProduct, setSelectedPremiumProduct] = useState();
  const [modalInfo, setModalInfo] = useState({
    show: false,
    data: null,
  });
  // state to store categories
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [pageLoader, setPageLoader] = useState(false);

  // states for baskets
  const [baskets, setBaskets] = useState([]);
  const [totalBaskets, setTotalBaskets] = useState(0);
  const [currentBasketPage, setCurrentBasketPage] = useState(1);
  const [selectedBasketDetail, setSelectedBasketDetail] = useState(null);
  const [zipCode, setZipCode] = useState("");

  //  for fetching modal detailas and showing initial modal
  useEffect(() => {
    const hasShown = sessionStorage.getItem("welcome-modal-shown");

    if (!hasShown) {
      callApi({
        endPoint: "/welcome_popup/LastWelcomPopupView/",
        method: METHODS.get,
        instanceType: INSTANCE.auth,
      })
        .then((res) => {
          const response = res?.data?.data;
          const data = {
            title: response?.title,
            description: response?.description,
            image: response?.image,
            navigation_path: response?.navigation_path,
            button_text: response?.button_text,
          };
          setTimeout(() => {
            setModalInfo({
              show: true,
              data: data,
            });
            sessionStorage.setItem("welcome-modal-shown", "true");
          }, 2000);
        })
        .catch((err) => {
          console.log(err, "welcome modal error");
        });
    }
  }, []);

  // fetch baskets

  useEffect(() => {
    callApi({
      endPoint: BASKETS,
      method: METHODS.get,
      params: {
        page: currentBasketPage,
        page_size: true,
      },
      instanceType: INSTANCE.authorize,
    })
      .then((res) => {
        console.log(res, "bakset response");
        setBasketDetails(res.data);
        setBaskets(res?.data?.results || []);
        setTotalBaskets(res?.data?.count || 0);
        setSelectedBasketDetail(res?.data?.results?.[0] || null);
      })
      .catch((err) => {
        console.log(err, "error");
      });
  }, [currentBasketPage]);

  // API to fetch categories and premium products
  useEffect(() => {
    fetchCategoriesAndPremiumProducts();
  }, [selectedCategory]);

  useEffect(() => {
    fetchArrivalProducts();
  }, []);
  const handleSearchState = (state) => {
    setPageLoader((prev) => true);
    callApi({
      endPoint: SEARCH_ZIPCODE,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        state: state || "",
      },
    })
      .then((res) => {
        // formConfig?.setValue("zip_code", "");
        toastMessages(T["zipcode_search_success"], successType);
        router.push("/products");
      })
      .catch((err) => {
        console.log(err?.response?.data, "zipcode err");
        toastMessages(T["zipcode_search_error"] || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };
  const handleSearch = (zipCode) => {
    setButtonLoader((prev) => true);
    callApi({
      endPoint: SEARCH_ZIPCODE,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        zipcode: zipCode || "",
      },
    })
      .then((res) => {
        // formConfig?.setValue("zip_code", "");
        setZipCode("");
        toastMessages(res?.data?.message, successType);
        router.push("/products");
      })
      .catch((err) => {
        console.log(err?.response?.data, "zipcode err");
        toastMessages(err.response.data.message || DEFAULT_ERROR_MESSAGE);
        setZipCode("");
      })
      .finally(() => {
        setButtonLoader((prev) => false);
      });
  };

  const fetchCategoriesAndPremiumProducts = () => {
    setPageLoader((prev) => true);

    Promise.all([
      callApi({
        endPoint: CATEGORIES,
        method: METHODS.get,
        instanceType: INSTANCE.authorize,
      }),
      callApi({
        endPoint: PRODUCTS,
        method: METHODS.get,
        instanceType: INSTANCE.authorize,
        params: {
          // is_premium: true,
          search: selectedCategory || null,
        },
      }),
    ])
      .then(([categoryRes, productRes]) => {
        setCategories(categoryRes?.data?.results || []);
        const updatedProducts = removeVariantsWithIsPremiumFalse(
          productRes?.data?.results || []
        );
        setPremiumProducts(extractProducts(updatedProducts, 4));
      })
      .catch((err) => {
        console.error(err, "API error");
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };
  const fetchArrivalProducts = () => {
    callApi({
      endPoint: PRODUCTS,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: {
        is_new_arrival: true,
      },
    })
      .then((res) => {
        setNewArrivals(extractProducts(res?.data?.results, 4));
        toastMessages(res?.data?.message, successType);
      })
      .catch((err) => {
        toastMessages(err.response.data.error || DEFAULT_ERROR_MESSAGE);
      });
  };

  const removeVariantsWithIsPremiumFalse = (products) => {
    const copiedProducts = products.slice();
    return copiedProducts.map((product) => {
      if (product.product_detail && product.product_detail.variants) {
        product.product_detail.variants =
          product.product_detail.variants.filter(
            (variant) => variant.is_premium !== false
          );
      }
      return product;
    });
  };

  const addToWishlist = (e, item, isArrival = false) => {
    e.stopPropagation();
    console.log(item, "this is item");
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
        if (isArrival) {
          fetchArrivalProducts();
        } else {
          fetchCategoriesAndPremiumProducts();
        }
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
    const token = localStorage.getItem("token");
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

      if (response.data.error) {
        toastMessages(response.data.error, "error");
        return;
      }

      toastMessages(
        T["product_added_to_cart"],
        successType
      );

      fetchCart(dispatch, setPageLoader, () => {
        dispatch(setShowCartSidebar(true));
      });
    } catch (err) {
      console.log(err, "cart error");
      toastMessages(
        err?.response?.data?.mess?.toLowerCase().includes('sorry! we are out of stock')
          ? T["out_of_stock"]
          : err?.response?.data?.error || err?.response?.data?.message ||
          DEFAULT_ERROR_MESSAGE
      );
    } finally {
      setPageLoader(false);
    }
  };

  const handleBasket = (item) => {
    setChooseBasket(item);
  };

  const handleChoose = () => {
    const token = localStorage.getItem("token");
    if (token) {
      console.log(selectedBasketDetail, "selectedBasketDetail");
      if (selectedBasketDetail?.is_customizable) {
        dispatch(setSelectedBasket(selectedBasketDetail));
        router.push("/baskets");
      } else {
        createUserBasket(selectedBasketDetail);
      }
    } else {
      setShowLoginModal(true);
    }
  };
  console.log(baskets, "log2 baskets");
  console.log(selectedBasketDetail, "log2 selectedBasketDetail");

  const handleInputChange = (e) => {
    const numbersOnly = e.target.value.replace(/[^0-9]/g, "");
    setZipCode(numbersOnly);

    if (numbersOnly?.length) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        handleSearch(numbersOnly);
      }, 700); // Increased debounce time to 300ms for better performance
    }
  };

  const getDuration = (newDate) => {
    const date = newDate?.slice(0, 10);
    const targetDate = moment(date);
    // setOfferLastDate(targetDate);
    return (
      <>
        <div className="text-center">
          <div className="w-[50px] h-[50px] bg-[#F5F5F5] text-black rounded-full flex items-center justify-center text-[20px] font-bold">
            {days}
          </div>
          <p className="text-[12px] text-[#828282] mt-[5px]">{T.hours}</p>
        </div>
        <div className="text-center">
          <div className="w-[50px] h-[50px] bg-[#F5F5F5] text-black rounded-full flex items-center justify-center text-[20px] font-bold">
            {hours}
          </div>
          <p className="text-[12px] text-[#828282] mt-[5px]">{T.hours}</p>
        </div>
        <div className="text-center">
          <div className="w-[50px] h-[50px] bg-[#F5F5F5] text-black rounded-full flex items-center justify-center text-[20px] font-bold">
            {minutes}
          </div>
          <p className="text-[12px] text-[#828282] mt-[5px]">{T.mins}</p>
        </div>

        <div className="text-center">
          <div className="w-[50px] h-[50px] bg-[#F5F5F5] text-black rounded-full flex items-center justify-center text-[20px] font-bold">
            {seconds}
          </div>
          <p className="text-[12px] text-[#828282] mt-[5px]">{T.secs}</p>
        </div>
      </>
    );
  };

  const createUserBasket = () => {
    setButtonLoader((prev) => true);
    callApi({
      endPoint: `/clone-user-basket/`,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        basket_id: selectedBasketDetail?.id,
      },
    })
      .then((res) => {
        dispatch(setSelectedBasket(selectedBasketDetail));
        router.push("/baskets");
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
        setButtonLoader((prev) => false);
      });
  };
  return (
    <>
      <Header />
      <div className="hero-bg-img">
        {pageLoader && <PageLoader />}
        <div className="left-sidetext-pattern">
          {/* Hero Section start */}
          <section className="hero min-h-[70vh] flex items-center justify-center">
            <div className="w-full px-4 md:px-8 lg:px-12">
              <div className="flex flex-col items-center py-6 md:py-10">
                <h2 className="mb-2 md:mb-4 font-spartan text-sm sm:text-base md:text-xl text-black font-bold text-center">
                  {T.your_perfect_morning_start}
                </h2>
                <h1 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-gray-800 text-center leading-tight font-spartan max-w-[950px] px-4">
                  <span className="text-green-600">{T.start_your_day} </span>
                  {T.fresh}
                  <br className="hidden sm:block" />
                  <span>
                    {T.healthy_breakfast_baskets}
                  </span>
                  <span className="text-green-600">
                    {" "}
                    {T.delivered_to_your_door}
                  </span>
                </h1>
                <p className="text-gray-600 mt-2 md:mt-4 text-center max-w-lg text-xs sm:text-sm md:text-base px-4">
                  {T.nutritious_basket}
                </p>
                <div className="flex flex-col w-full max-w-[950px] mt-4 md:mt-6 px-4">
                  <SearchByState handleSearchState={handleSearchState} />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-4 md:mt-6 px-4 w-full max-w-md justify-center items-center">
                  <Button
                    btnType="button"
                    btnText={T.explore_baskets}
                    className="bg-black text-white py-2 px-4 hover:bg-gray-800 transition rounded-[50px] text-xs sm:text-sm md:text-base w-full"
                    btnClick={() => router.push("/baskets")}
                  />
                  <Button
                    btnType="button"
                    btnText={T.explore_products}
                    className="border border-gray-300 py-2 px-4 hover:bg-gray-200 text-black transition rounded-[50px] text-xs sm:text-sm md:text-base w-full"
                    btnClick={() => router.push("/products")}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Service section */}
          <section className="py-6 sm:py-8 md:py-12 lg:py-16">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {SERVICE_CARD.map((item, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-4 sm:p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
                    <img
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-4 sm:mb-6"
                      src={item?.logo_img}
                      alt="serviceImg"
                    />
                    <h6 className="text-base sm:text-lg md:text-xl font-normal text-black">
                      <p>
                        {item.heading}
                        <b>{item?.subHeading}</b>
                      </p>
                    </h6>
                    <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-2">
                      {item?.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Basket section */}
          <section className="py-8 md:py-12" id="baskets">
            <div className="max-w-7xl mx-auto px-4">
              <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 lg:p-12">
                <div className="mb-8 text-center">
                  <h3 className="text-base md:text-lg text-gray-600">
                    {T["explore_our_handcrafted"]}
                  </h3>
                  <h2 className="text-2xl md:text-4xl font-bold mt-2">
                    {T["breakfast_baskets"]}
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="flex flex-col justify-between">
                    <div className="flex flex-col space-y-1 mb-8">
                      {baskets?.length > 0 ? (
                        baskets?.map((basket, idx) => (
                          <Fragment key={idx}>
                            <span
                              onClick={() => setSelectedBasketDetail(basket)}
                              className={`w-full text-left py-2 text-sm md:text-base capitalize cursor-pointer
                                ${selectedBasketDetail?.id === basket?.id
                                  ? "text-green-600 font-medium"
                                  : "text-gray-500 hover:text-gray-700"
                                }`}
                            >
                              {idx + 1}. {basket?.basket_name}
                            </span>
                          </Fragment>
                        ))
                      ) : (
                        <p className="text-sm md:text-base">{T["no_basket_found"]}</p>
                      )}
                    </div>

                    <div>
                      <div className="mb-4">
                        <div className="text-green-600 text-xl md:text-2xl font-bold text-right">
                          {selectedBasketDetail?.basket_price || "0.00"} SEK
                        </div>
                        <h2 className="text-xl md:text-3xl font-bold capitalize text-right mt-2">
                          {selectedBasketDetail?.basket_name || "Big Basket"}
                        </h2>
                      </div>
                      <p className="text-sm md:text-base text-gray-600 text-right mb-4">
                        {stripHtmlTags(selectedBasketDetail?.content)}
                      </p>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={handleChoose}
                          className="inline-flex items-center gap-2 px-6 py-2 md:px-8 md:py-3 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors text-sm md:text-base"
                        >
                          {T["choose"]}
                          <img
                            className="w-5 h-5 md:w-6 md:h-6 bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-1 rounded-full"
                            src="/images/arrow.svg"
                            alt="arrowImg"
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative w-full md:w-[80%] flex items-center justify-center">
                      <div className="w-full h-[300px] md:h-[500px] relative">
                        {selectedBasketDetail?.featured_image ? (
                          <img
                            src={createPreview(selectedBasketDetail?.featured_image)}
                            alt="Basket"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            {imagePlaceholder}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 md:gap-10 shadow-md mb-4 md:mb-8 absolute bottom-0 left-1/2 -translate-x-1/2 px-4 py-2 md:pr-2.5 md:py-2.5 md:pl-7 rounded-full bg-white">
                        <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">
                          {T["available_space"]}
                        </span>
                        <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-100 text-green-600 font-medium flex items-center justify-center text-sm md:text-base">
                          {selectedBasketDetail?.space_left || "0"}
                        </span>
                      </div>
                    </div>

                    <div className="flex md:hidden overflow-x-auto gap-2 pb-4">
                      {baskets?.length > 0 ? (
                        baskets?.map((basket, idx) => (
                          <div
                            className={`flex-shrink-0 bg-gray-50 p-2 ${selectedBasketDetail?.id == basket?.id
                              ? "border border-solid border-green-600"
                              : ""
                              }`}
                            key={idx}
                          >
                            <button
                              onClick={() => setSelectedBasketDetail(basket)}
                              className={`w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent transition-colors ${selectedBasketDetail?.id == basket?.id
                                ? "border border-solid border-green-600"
                                : ""
                                }`}
                            >
                              {basket?.featured_image ? (
                                <img
                                  src={createPreview(basket?.featured_image)}
                                  alt={basket?.basket_name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="basket-imagePlaceholder">
                                  {imagePlaceholder}
                                </div>
                              )}
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm">{T["no_basket_found"]}</p>
                      )}
                    </div>

                    <div className="hidden md:flex flex-none w-[100px] flex-col">
                      {currentBasketPage > 1 && (
                        <button
                          onClick={() => setCurrentBasketPage((prev) => prev - 1)}
                          className="mb-4 px-4 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors text-sm"
                        >
                          {T["previous"]}
                        </button>
                      )}

                      {baskets?.length > 0 ? (
                        baskets?.map((basket, idx) => (
                          <div
                            className={`bg-gray-50 p-4 mb-2 ${selectedBasketDetail?.id == basket?.id
                              ? "border border-solid border-green-600"
                              : ""
                              }`}
                            key={idx}
                          >
                            <button
                              onClick={() => setSelectedBasketDetail(basket)}
                              className={`w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden border-2 border-transparent transition-colors ${selectedBasketDetail?.id == basket?.id
                                ? "border border-solid border-green-600"
                                : ""
                                }`}
                            >
                              {basket?.featured_image ? (
                                <img
                                  src={createPreview(basket?.featured_image)}
                                  alt={basket?.basket_name}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="basket-imagePlaceholder">
                                  {imagePlaceholder}
                                </div>
                              )}
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm">{T["no_basket_found"]}</p>
                      )}

                      {totalBaskets > 4 && (
                        <button
                          onClick={() => setCurrentBasketPage((prev) => prev + 1)}
                          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-full font-medium hover:bg-green-700 transition-colors text-sm"
                        >
                          {T["next"]}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Fresh and healthy section */}
          <div className="three-sections relative py-8 md:py-12 lg:py-16">
            <section className="fresh-health relative z-0">
              <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                <FruitBasketCircle basketData={baskets} />
              </div>
            </section>

            {/* Premium product section */}
            <section className="premium_product_section py-8 md:py-12 lg:py-16">
              <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 md:mb-12">
                  <h4 className="text-2xl md:text-3xl lg:text-4xl font-bold">
                    <b>{T.choose} </b> {T.premium_product}
                  </h4>
                  <img
                    className="w-20 md:w-24 lg:w-32 mx-auto mt-4"
                    src="/images/headingline.png"
                    alt="headingImg"
                  />
                </div>

                <div className="mt-8">
                  <CategoriesSection
                    categories={categories}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                  />
                </div>
              </div>

              <div className="px-4 sm:px-6 md:px-8 lg:px-12 mt-8 md:mt-12">
                <div className="max-w-screen-xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
                    {premiumProducts?.length > 0 ? (
                      premiumProducts.map((item, idx) => (
                        <Fragment key={idx}>
                          <UpdatedProductCard
                            page={"home"}
                            onvariantChange={() => { }}
                            item={item?.product_detail?.variants}
                            addToWishlist={addToWishlist}
                            image={item?.feature_image?.image}
                            setShowSelectBasketModal={setShowSelectBasketModal}
                            setSelectedPremiumProduct={setSelectedPremiumProduct}
                            product={item}
                            addToCart={addToCart}
                          />
                        </Fragment>
                      ))
                    ) : (
                      <div className="col-span-full text-center text-gray-500 text-base md:text-lg font-semibold py-8">
                        {T["no_products_found"]}.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* fresh and healthy section start */}

          {/* <Slider {...settings}>
          {basketDetails?.length > 0 &&
            basketDetails?.map(
              (item, idx) =>
                item?.offer && (
                  <section className="healthy-breakfast py-[60px]" key={idx}>
                    <div className="max-w-screen-xl w-full px-4 mx-auto">
                      <div className="grid-cols-2 lg:grid flex items-center bg-white rounded-[20px] py-[30px] px-[30px]">
                        <div className=" max-w-[400px] mx-auto ">
                          <h2 className="text-[24px] font-bold text-black ">
                            {item?.basket_name}
                          </h2>
                          <p className="text-[#55B250] font-bold text-[20px]  mt-[10px]">
                            ${item?.offer?.offer_price}
                          </p>
                          <p className="text-[#828282] text-[15px]  mt-[10px]">
                            {stripHtmlTags(item?.content)}
                          </p>
                          <div className="flex items-center gap-[10px] mt-[20px]">
                            <div className="flex gap-[10px] font-bold rounded-full cursor-pointer items-center">
                              <span className="text-[12px]">
                                <img
                                  className="w-[16px] h-[16px]"
                                  src={gradientclockImg}
                                  alt="gradientImg"
                                />
                              </span>
                              <span className="text-[15px] font-bold text-black text-[#51B150] mb-0">
                                {T.grab_the_offer}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-[15px] mt-[20px]">
                            <div className="text-center">
                              <div className="w-[50px] h-[50px] bg-[#F5F5F5] text-black rounded-full flex items-center justify-center text-[20px] font-bold">
                                {item?.offer
                                  ? getDuration(item?.offer?.end_offer)
                                  : null}
                              </div>
                            </div>
                          </div>
                          <Button
                            btnType="button"
                            className="flex gap-[10px] bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[10px_30px] rounded-full text-white font-semibold items-center mt-[30px]"
                            btnText={T.add_to_cart}
                            icon={
                              <img
                                className="bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[6px] rounded-full w-[25px] h-[25px] "
                                src={arrowImg}
                                alt="arrowImg"
                              />
                            }
                            // btnClick={() => addToCart(item)}
                          />
                        </div>
                        <div>
                          <img
                            className="max-w-[450px] w-full mx-auto"
                            src={
                              item?.featured_image
                                ? item?.featured_image
                                : breakfastHeroImg
                            }
                            alt="breakfastImg"
                            // width={500}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )
            )}
          <section className="healthy-breakfast py-[60px]">
            <div className="max-w-screen-xl w-full px-4 mx-auto">
              <div className="grid-cols-2 lg:grid flex items-center bg-white rounded-[20px] py-[30px] px-[30px]">
                <div className=" max-w-[400px] mx-auto ">
                  <h2 className="text-[24px] font-bold text-black ">
                    {T.healthy_breakfast_baskets}
                  </h2>
                  <p className="text-[#55B250] font-bold text-[20px]  mt-[10px]"></p>
                  <p className="text-[#828282] text-[15px]  mt-[10px]">
                    {T.bf_decription}
                  </p>
                  <div className="flex items-center gap-[10px] mt-[20px]">
                    <div className="flex gap-[10px] font-bold rounded-full cursor-pointer items-center">
                      <span className="text-[12px]">
                        <img
                          className="w-[16px] h-[16px]"
                          src={gradientclockImg}
                          alt="gradientImg"
                        />
                      </span>
                      <span className="text-[15px] font-bold text-black text-[#51B150] mb-0">
                        {T.grab_the_offer}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-[15px] mt-[20px]">
                    <div className="text-center">
                      <div className="w-[50px] h-[50px] bg-[#F5F5F5] text-black rounded-full flex items-center justify-center text-[20px] font-bold">
                        31
                      </div>
                      <p className="text-[12px] text-[#828282] mt-[5px]">
                        {T.days}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-[50px] h-[50px] bg-[#F5F5F5] text-black rounded-full flex items-center justify-center text-[20px] font-bold">
                        12
                      </div>
                      <p className="text-[12px] text-[#828282] mt-[5px]">
                        {T.hours}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-[50px] h-[50px] bg-[#F5F5F5] text-black rounded-full flex items-center justify-center text-[20px] font-bold">
                        10
                      </div>
                      <p className="text-[12px] text-[#828282] mt-[5px]">
                        {T.mins}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-[50px] h-[50px] bg-[#F5F5F5] text-black rounded-full flex items-center justify-center text-[20px] font-bold">
                        35
                      </div>
                      <p className="text-[12px] text-[#828282] mt-[5px]">
                        {T.secs}
                      </p>
                    </div>
                  </div>
                  <Button
                    btnType="button"
                    className="flex gap-[10px] bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[10px_30px] rounded-full text-white font-semibold items-center mt-[30px]"
                    btnText={T.add_to_cart}
                    icon={
                      <img
                        className="bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[6px] rounded-full w-[25px] h-[25px]"
                        src={arrowImg}
                        alt="arrowImg"
                      />
                    }
                  />
                </div>
                <div>
                  <img
                    className="max-w-[450px] w-full mx-auto"
                    src={breakfastHeroImg}
                    alt="breakfastImg"
                  />
                </div>
              </div>
            </div>
          </section>
        </Slider> */}

          {/* Nutrition organic product section start */}
          <section className="py-6 sm:py-8 md:py-12 lg:py-16">
            <div className="max-w-screen-xl w-full px-4 sm:px-6 lg:px-8 mx-auto">
              <div>
                <h4 className="text-center text-xl sm:text-2xl md:text-3xl lg:text-[45px] text-black font-bold heading_main">
                  <b>{T.nutrition_product_title} </b>
                </h4>
                <img
                  className="w-20 sm:w-24 md:w-32 lg:w-[153px] mx-auto mt-2 sm:mt-4"
                  src="/images/headingline.png"
                  alt="headingImg"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8 md:mt-12">
                {[
                  { title: "Fruktkorgar", image: "/images/Frukto-fruit.png" },
                  { title: "Frukostkorgar", image: "/images/Frukto-breakfast.png" }
                ].map((item, idx) => (
                  <div
                    className="relative w-full"
                    key={idx}
                  >
                    <img
                      className="w-full h-[200px] sm:h-[250px] md:h-[300px] lg:h-[370px] object-cover rounded-lg"
                      src={item?.image}
                      alt="organicProductImg"
                    />
                    <h6 className="lg:absolute mt-4 lg:mt-0 lg:bottom-12 -right-8 lg:-right-16 lg:rotate-[270deg] text-sm sm:text-base md:text-lg lg:text-xl font-bold whitespace-nowrap">
                      <b>{item?.title}</b>
                    </h6>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* Nutrition organic product section end */}
        </div>
        {/* new arrivals section start */}
        <section className="py-8 sm:py-12 md:py-16">
          <div className="max-w-screen-xl w-full px-4 mx-auto">
            <div className="heading">
              <h4 className="text-center text-black text-2xl sm:text-3xl md:text-4xl lg:text-[45px] font-bold">
                <b>{T?.new} </b> {T?.arrivals}
              </h4>
              <img
                className="w-20 sm:w-24 md:w-32 lg:w-[153px] mx-auto mt-2 sm:mt-4"
                src="/images/headingline.png"
                alt="organicProductImg"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-8 sm:mt-12 md:mt-20">
              {newArrivals?.length > 0 &&
                newArrivals?.map((item, index) => {
                  return (
                    <NewArrivalCard
                      key={index}
                      product={item}
                      addToCart={addToCart}
                      addToWishlist={addToWishlist}
                    />
                  );
                })}
            </div>
            <button
              type="button"
              onClick={() => router.push("/products")}
              className="flex mx-auto gap-2 sm:gap-[10px] bg-gradient-to-r from-[#92C64E] to-[#4BAF50] px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full text-white text-sm sm:text-base font-semibold items-center mt-6 sm:mt-8 md:mt-[30px] mb-8 sm:mb-12 md:mb-[60px]"
            >
              {T["view_all"]}
              <span>
                <img
                  className="bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-1 sm:p-[6px] rounded-full w-5 h-5 sm:w-[25px] sm:h-[25px]"
                  src="/images/arrow.svg"
                  alt="arrowImg"
                />
              </span>
            </button>
          </div>
        </section>
        {/* new arrivals section start */}

        <div className="overflow-hidden py-4 sm:py-6">
          <section className="before:absolute before:top-0 before:left-0 before:content-[''] before:w-full before:h-full before:bg-[#92C64E] before:z-[-1] z-[1] before:-rotate-2 py-8 sm:py-12 md:py-[60px] relative">
            <div className="max-w-screen-xl w-full px-4 mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-[20px]">
                {[
                  {
                    icon: "/images/review1.png", 
                    title: "Nöjda Kunder",
                    description: T.satisfied_clients
                  },
                  {
                    icon: "/images/review2.png",
                    title: "Engagerat Team", 
                    description: T.expert_team
                  },
                  {
                    icon: "/images/review3.png",
                    title: "Regelbundna Leveranser",
                    description: T.activate_products
                  },
                  {
                    icon: "/images/review4.png",
                    title: "Byggt på Förtroende",
                    description: T.awards_winning
                  }
                ].map((item, index) => (
                  <div key={index} className="flex gap-3 sm:gap-4 md:gap-[15px] items-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-[80px] md:h-[80px] bg-white rounded-full flex justify-center items-center flex-shrink-0 review-icon-bg">
                      <img
                        className="w-10 sm:w-12 md:w-[40px]"
                        src={item.icon}
                        alt="reviewImg"
                      />
                    </div>
                    <div>
                      <h6 className="text-lg sm:text-2xl md:text-[22px] font-extrabold text-white">
                        {item.title}
                      </h6>
                      <p className="text-[#E2E2E2] text-sm sm:text-base md:text-[17px] font-medium">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section>
          <div className="px-4 sm:px-6 md:px-8 w-full max-w-screen-xl mx-auto py-6 sm:py-8 md:py-10">
            <div className="about-banner relative">
              <h4 className="mb-6 sm:mb-8 md:mb-10 text-[#253d4e] text-3xl sm:text-5xl md:text-6xl lg:text-[72px] leading-tight md:leading-[1] font-bold">
                Specialerbjudande – Prova innan du startar abonnemang
              </h4>
              <p className="text-base sm:text-lg md:text-[18px] mb-6 sm:mb-8 md:mb-[45px]">
                Vi tror på vår kvalitet. Därför får du två kostnadsfria fruktkorgar under din första vecka – helt utan förpliktelser.
                <br className="hidden sm:block" />
                Bara färsk, noggrant utvald frukt som ger dig en smak av Frukto.
              </p>

              <p className="text-base sm:text-lg md:text-[18px] mb-6 sm:mb-8 md:mb-[45px]">
                <b>
                  Prova Frukto – helt utan risk
                </b>
              </p>
              <div className="relative w-full max-w-[500px] mx-auto">
                <Image 
                  className="about-4-image w-full h-auto" 
                  src="/images/Frukto-fruit-2.png" 
                  alt="Frukto fruit" 
                  width={500} 
                  height={500}
                  priority
                />
              </div>
            </div>
          </div>
        </section>
        <ExclusiveOfferBanner />
        {showLoginModal && (
          <AddLoginModal
            closeModal={() => setShowLoginModal(false)}
            setShowLoginModal={setShowLoginModal}
          />
        )}
        {modalInfo?.show && (
          <InitialModal
            onClose={() =>
              setModalInfo({
                show: false,
                data: null,
              })
            }
            modalData={modalInfo?.data}
          />
        )}
        {showSelectModal && (
          //  && selectedBasketDetail != ''
          <SelectBasketModal
            closeModal={() => setShowSelectBasketModal(false)}
            selectedPremiumProduct={selectedPremiumProduct}
            basketForPremiumProducts={basketForPremiumProducts}
          />
        )}
      </div>
      <Footer />
    </>
  );
};

export default Page;
