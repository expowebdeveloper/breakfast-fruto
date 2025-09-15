"use client";
import {
  callApi,
  fetchCart,
  fetchUserBasket,
  METHODS,
} from "@/_Api-Handlers/apiFunctions";
import {
  ADD_TO_CART,
  ADDRESS,
  APPLY_COUPON,
  CART_LIST,
  CLEAR_CART,
  COUPONS,
  TIMESLOTS,
} from "@/_Api-Handlers/APIUrls";
import Button from "@/_components/_common/Button";
import DeleteConfirmationModal from "@/_components/_common/DeleteConfirmationModal";
import AddLoginModal from "@/_components/_common/Modals/AddLoginModal";
import PageLoader from "@/_components/_common/PageLoader";
import NewAddressForm from "@/_components/NewAddressForm";
import PaymentModal from "@/_components/PaymentModal";
import SummarySection from "@/_components/SummarySection";
import { DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import { formatTimeTo12Hour } from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";

const Cart = () => {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const router = useRouter();
  const dispatch = useDispatch();
  const formConfig = useForm();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [cart, setCart] = useState({});
  const [confirmLoader, setConfirmLoader] = useState(false);
  const [pageLoader, setPageLoader] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [zipcode, setZipcode] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeslots, setTimeSlots] = useState([]);
  const [timeslotCount, setTimeslotCount] = useState(0);
  const [currentTimeslotPage, setCurrentTimeslotPage] = useState(null);
  const [scheduleType, setScheduleType] = useState("one-time");
  const [selectedDates, setSelectedDates] = useState([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [showAddAddressSection, setShowAddAddressSection] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [editInfo, setEditInfo] = useState({
    isEdit: false,
    editItem: null,
  });
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [removeItemInfo, setRemoveItemInfo] = useState({
    show: false,
    id: null,
  });
  const deliveryDates = [
    "26 Oct 2024 THU",
    "27 Oct 2024 FRI",
    "28 Oct 2024 SAT",
    "29 Oct 2024 SUN",
    "30 Oct 2024 MON",
  ];
  console.log(selectedDate, "selectedDate");
  const token = localStorage.getItem("token");

  //  fetch addresses
  useEffect(() => {
    fetchAddresses();
  }, []);
  const fetchAddresses = () => {
    setPageLoader((prev) => true);
    callApi({
      endPoint: ADDRESS,
      method: METHODS?.get,
      instanceType: INSTANCE?.authorize,
    })
      .then((res) => {
        setAddresses(res?.data?.results || []);
        setSelectedAddress(
          res?.data?.results.find((ele) => ele.primary === true)
        );
      })
      .catch((error) => {
        console.error("Error getting address:", error);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };
  console.log(addresses, "these are addresses");
  // fetch addresses

  //  fetch coupons
  useEffect(() => {
    fetchCoupons();
  }, []);
  const removeDeletedCoupons = (coupons) => {
    let formattedElements;
    if (coupons?.length) {
      formattedElements = coupons?.filter(
        (coup) => !coup?.coupon_details?.is_deleted
      );
      return formattedElements;
    } else {
      return [];
    }
  };
  const fetchCoupons = () => {
    callApi({
      endPoint: COUPONS,
      method: METHODS?.get,
      instanceType: INSTANCE?.authorize,
    })
      .then((res) => {
        console.log(res?.data?.results, "these are coupons");
        setCoupons(removeDeletedCoupons(res?.data?.results) || []);
      })
      .catch((error) => {
        console.error("Error getting address:", error);
      });
  };
  console.log(coupons, "these are coupons");
  //  fetch coupons

  useEffect(() => {
    getCart();
  }, []);
  useEffect(() => {
    fetchTimeSlots();
  }, [currentTimeslotPage]);

  const generateWeekDates = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const newDate = new Date();
      newDate.setDate(today.getDate() + i);
      return {
        id: i,
        date: newDate,
        formatted: formatDate(newDate),
      };
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
  };

  const fetchTimeSlots = () => {
    callApi({
      endPoint: TIMESLOTS,
      method: METHODS?.get,
      instanceType: INSTANCE?.authorize,
    })
      .then((res) => {
        console.log(res, "timeslot res");
        setTimeSlots(res?.data?.results || []);
        setTimeslotCount(res?.data?.count);
      })
      .catch((error) => {
        console.error("Error getting address:", error);
      });
  };

  const toggleDateSelection = (day) => {
    setSelectedDates(
      (prevSelected) =>
        prevSelected.includes(day.formatted)
          ? prevSelected.filter((date) => date !== day.formatted) // Remove if already selected
          : [...prevSelected, day.formatted] // Add if not selected
    );
  };

  const getCart = async () => {
    console.log("insid updated fetch cart");
    const apiUrl = `${baseURL}/cart/`;
    const token = localStorage.getItem("token");
    setPageLoader((prev) => true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

      const response = await axios.get(apiUrl, {
        headers,
        withCredentials: true,
      });

      setCart(response?.data);
      setGiftWrap(response?.data?.is_gift_wrap);
      console.log(response, "this is cart");
    } catch (err) {
      console.log(err, "this is cart error");
    } finally {
      setPageLoader((prev) => false);
    }
  };

  console.log(cart, "this is sadasdasd");
  console.log(coupons, "these are coupons");

  const handleApplyCoupon = (couponCode) => {
    const payload = {
      coupon_code: couponCode,
      cart_id: cart?.id,
    };
    setPageLoader((prev) => true);
    callApi({
      endPoint: APPLY_COUPON,
      method: METHODS?.post,
      instanceType: INSTANCE?.authorize,
      payload: payload,
    })
      .then((res) => {
        toastMessages(T["coupon_applied_successfully"], successType);
        getCart();
        fetchCoupons();
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        toastMessages(
          `${error?.response?.data?.detail || error?.response?.data?.error}`
        );
      })
      .finally(() => {
        setPageLoader((prev) => false);
        setCoupon("");
      });
  };

  const handleQuantityChange = (id, quantity) => {
    console.log(id, quantity, "this is id and quantity");
  };
  console.log(cart, "this is cart ");

  const addToCart = (variant_id, quantity, cart_item_id) => {
    console.log(variant_id, quantity, "product");
    const payload = {
      product_variant: variant_id,
      quantity: quantity,
    };
    console.log(payload, "payload");
    setPageLoader((prev) => true);
    callApi({
      endPoint: quantity == 0 ? `${ADD_TO_CART}${variant_id}/` : ADD_TO_CART,
      method: quantity == 0 ? METHODS.delete : METHODS.patch,
      instanceType: INSTANCE.authorize,
      payload: quantity == 0 ? null : payload,
      params: quantity == 0 ? {} : { cart_item_id: cart_item_id },
    })
      .then((res) => {
        console.log(res, "cart response");
        toastMessages(
          quantity === 0
            ? T["product_removed_from_cart"]
            : res?.data?.message || T["product_added_to_cart"],
          successType
        );
        fetchCart(dispatch, setPageLoader);
        getCart();
        // setShowSelectBasketModal(!showSelectModal);
      })
      .catch((err) => {
        console.log(err, "cart error");
        toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };

  const handleConfirm = (handleModalLogic = true) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowModal(true);
      return;
    }
    if (!selectedDate && !selectedDates.length) {
      toastMessages(T["please_select_date"]);
      return;
    }
    const customer_type = localStorage.getItem("customer_type");
    if (customer_type === "C" && handleModalLogic) {
      setShowPaymentModal(true);
      return;
    }

    const payload = {};
    if (scheduleType == "one-time") {
      payload["time_slot_id"] = selectedDate;
    } else {
      payload["delivery_dates"] = selectedDates.map((date) => String(date));
    }
    !handleModalLogic
      ? setPageLoader((prev) => true)
      : setConfirmLoader((prev) => true);
    callApi({
      endPoint: "/orders/checkout/",
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        address_id: selectedAddress?.id,
        ...payload,
      },
    })
      .then((res) => {
        console.log("payment url", res);
        if (res?.data?.session_url) {
          window.location.href = res.data.session_url;
        }
      })
      .catch((err) => {
        toastMessages(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        !handleModalLogic
          ? setPageLoader((prev) => false)
          : setConfirmLoader((prev) => false);
        setShowPaymentModal(false);
      });
  };

  const handleBookConfirm = (handleModalLogic = true) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowModal(true);
      return;
    }
    if (!selectedDate && !selectedDates.length) {
      toastMessages(T["please_select_date"]);
      return;
    }
    const customer_type = localStorage.getItem("customer_type");
    if (customer_type === "C" && handleModalLogic) {
      setShowPaymentModal(true);
      return;
    }

    const payload = {};
    if (scheduleType == "one-time") {
      payload["time_slot_id"] = selectedDate;
    } else {
      payload["delivery_dates"] = selectedDates.map((date) => String(date));
    }
    !handleModalLogic
      ? setPageLoader((prev) => true)
      : setConfirmLoader((prev) => true);
    callApi({
      endPoint: "/orders/checkout/",
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        address_id: selectedAddress?.id,
        ...payload,
      },
    })
      .then((res) => {
        console.log("payment url", res);
        if (res?.data?.session_url) {
          window.location.href = res.data.session_url;
        }
      })
      .catch((err) => {
        toastMessages(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        !handleModalLogic
          ? setPageLoader((prev) => false)
          : setConfirmLoader((prev) => false);
        setShowPaymentModal(false);
      });
  };

  const addBasketToCart = (basketId, newQuantity, cart_item_id) => {
    const payload = {
      user_basket_id: basketId,
      quantity: newQuantity,
    };
    setPageLoader((prev) => true);
    callApi({
      endPoint: newQuantity == 0 ? `${ADD_TO_CART}${basketId}/` : ADD_TO_CART,
      method: newQuantity == 0 ? METHODS.delete : METHODS.patch,
      instanceType: INSTANCE.authorize,
      payload: newQuantity == 0 ? null : payload,
      params:
        newQuantity == 0
          ? {}
          : {
              cart_item_id: newQuantity,
            },
    })
      .then((res) => {
        toastMessages(
          newQuantity == 0
            ? T["basket_removed_from_cart"]
            : res?.data?.message || T["basket_quantity_updated_to_cart"],
          successType
        );
        fetchCart(dispatch, setPageLoader);
        getCart();
      })
      .catch((err) => {
        console.log(err, "cart error");
        toastMessages(
          err?.response?.data?.error ||
            err?.response?.data?.message ||
            DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };

  const addProductToBasket = (id, quantity, userBasketId) => {
    // if (selectedBasket?.id) {
    setPageLoader((prev) => true);
    const payload = {
      products: [
        {
          product_variant_id: id,
          quantity: quantity,
        },
      ],
    };

    callApi({
      endPoint: `/user-basket/${
        userBasketId ? userBasketId : selectedBasket?.id
      }/`,
      method: METHODS.patch,
      instanceType: INSTANCE.authorize,
      payload: payload,
    })
      .then((res) => {
        console.log(res, "basket response");
        toastMessages(
          res?.data?.message || T["product_added_to_basket"],
          successType
        );
        fetchUserBasket(dispatch, setPageLoader);
        getCart();
      })
      .catch((err) => {
        console.log(err, "basket errs");
        toastMessages(err?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
    // } else {
    //   //   setShowModal(true);
    // }
  };
  //   const addBasketToCart = (basketId) => {
  //     console.log(basketId, "basketId");
  //     const payload = {
  //       user_basket_id: basketId,
  //     };
  //     console.log(payload, "payload");
  //     setPageLoader((prev) => true);
  //     callApi({
  //       endPoint: ADD_TO_CART,
  //       method: METHODS.post,
  //       instanceType: INSTANCE.authorize,
  //       payload: payload,
  //     })
  //       .then((res) => {
  //         console.log(res, "cart response");
  //         toastMessages(
  //           res?.data?.message || T["basket_added_to_cart"],
  //           successType
  //         );
  //         fetchCart(dispatch, setPageLoader);
  //         // setShowSelectBasketModal(!showSelectModal);
  //       })
  //       .catch((err) => {
  //         console.log(err, "cart error");
  //         toastMessages(
  //           err.response.data.error ||
  //             err.response.data.message ||
  //             DEFAULT_ERROR_MESSAGE
  //         );
  //       })
  //       .finally(() => {
  //         setPageLoader((prev) => false);
  //       });
  //   };
  const addAddress = (data) => {
    console.log(data, "this is data");
    setButtonLoader((prev) => true);
    const payload = {
      ...data,
      state: data?.state?.value,
    };
    callApi({
      endPoint: "bakery/customer-addresses/",
      method: "POST",
      instanceType: INSTANCE?.authorize,
      payload: payload,
    })
      .then((res) => {
        console.log(res, "this is res");
        toastMessages(
          res?.data?.message || T["address_added_successfully"],
          "success"
        );
        setShowAddAddress(false);
        fetchAddresses();
        formConfig.reset();
      })
      .catch((err) => {
        console.log(err, "this is err");
        toastMessages(
          err?.response?.data?.message ||
            err?.response?.data?.state?.[0] ||
            T["something_went_wrong"],
          "error"
        );
      })
      .finally(() => {
        setButtonLoader((prev) => false);
      });
  };

  const handleGiftWrap = (e) => {
    const token = localStorage.getItem("token");
    const checked = e.target.checked;
    console.log(checked, "checked");
    if (!token) {
      setShowModal(true);
      return;
    }
    callApi({
      endPoint: "/cart/",
      method: METHODS.patch,
      instanceType: INSTANCE.authorize,
      payload: {
        is_gift_wrap: checked,
      },
    })
      .then((res) => {
        getCart();
        setGiftWrap(checked);
      })
      .catch((err) => {
        console.log(err, "gift wrap error");
      });
  };

  const handleClearCart = async () => {
    const apiUrl = `${baseURL}/cart/empty_cart/${cart?.id}/`;
    const token = localStorage.getItem("token");
    setButtonLoader(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      const response = await axios.delete(apiUrl, {
        headers,
        withCredentials: true,
      });
      toastMessages(
        response?.data?.message || T["cart_cleared_successfully"],
        successType
      );
      fetchCart(dispatch, setPageLoader);
      getCart();
    } catch (err) {
      console.error("Error clearing cart:", err);
      toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
    } finally {
      setButtonLoader(false);
      setShowClearCartModal(false);
    }
  };

  const handleRemoveItem = async (type = "cart-item") => {
    const apiUrl = `${baseURL}/cart/item/${removeItemInfo?.id}/`;
    // type === "cart-item"
    // : `${baseURL}/cart/basket/${removeItemInfo?.id}`;
    const token = localStorage.getItem("token");
    setButtonLoader(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      // update method and pass query param/payload/path param accordingly
      const response = await axios.delete(apiUrl, {
        headers,
        withCredentials: true,
      });
      toastMessages(
        response?.data?.message || T["item_removed_from_cart_successfully"],
        successType
      );
      fetchCart(dispatch, setPageLoader);
      getCart();
    } catch (err) {
      console.error("Error clearing cart:", err);
      toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
    } finally {
      setButtonLoader(false);
      setRemoveItemInfo({
        show: false,
        id: null,
      });
    }
  };

  const handleCreateInvoice = () => {
    setPageLoader((prev) => true);
    const payload = {};
    if (scheduleType == "one-time") {
      payload["time_slot_id"] = selectedDate;
    } else {
      payload["delivery_dates"] = selectedDates.map((date) => String(date));
    }

    callApi({
      endPoint: "orders/checkout_order/",
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        address_id: selectedAddress?.id,
        ...payload,
      },
    })
      .then((res) => {
        console.log("payment url", res);
        if (res?.data?.order_id) {
          router.push(`/billing/order-complete?orderId=${res?.data?.order_id}`);
        }
      })
      .catch((err) => {
        toastMessages(
          err?.response?.data?.error ||
            err?.response?.data?.detail ||
            err?.response?.data?.message ||
            DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        setPageLoader((prev) => false);
        setShowPaymentModal(false);
      });
  };
  console.log(cart, "this is cart");

  return (
    <>
          {!cart?.items?.length ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
              <h2 className="text-2xl font-semibold mb-4">{T["your_cart_is_empty"]}</h2>
              <p className="mb-6 text-gray-600">
                {T["cart_empty_message"]}
              </p>
              <button
                onClick={() => router.push("/products")}
                className="bg-green-500 text-white py-2 px-4 rounded-md"
              >
                {T["start_shopping"]}
              </button>
        </div>
      ) : (
        <div
          // className={`max-w-[730px] mx-auto p-6 grid grid-cols-1 md:grid-cols-${
          //   token ? 3 : 1
          // } gap-6`}
          className={`${
            !token
              ? "max-w-[730px] mx-auto p-6 grid grid-cols-1 md:grid-cols-1 gap-6"
              : "max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6"
          }`}
        >
          {pageLoader && <PageLoader />}
          {/* Left Section - Addresses & Delivery */}
          {token ? (
            <div className="md:col-span-2 space-y-6">
              <button
                className="bg-green-500 text-white py-2 px-4 rounded-md"
                onClick={() => setShowAddAddress(true)}
              >
                {T["add_address"]}
              </button>
              {showAddAddress ? (
                <NewAddressForm
                  formConfig={formConfig}
                  onSubmit={addAddress}
                  loader={buttonLoader}
                  editInfo={editInfo}
                  onClose={() => {
                    setShowAddAddress(false);
                    formConfig.reset();
                  }}
                />
              ) : (
                <div className="bg-white p-4 rounded-lg shadow-md">
                  <h2 className="text-lg md:text-xl font-semibold">{T["saved_addresses"]}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    {addresses?.length
                      ? addresses?.map((address, index) => (
                          <div key={index} className="p-3 border rounded-lg hover:shadow-md transition-shadow">
                            <p className="text-xs sm:text-sm md:text-base">
                              {`${address?.address || ""}, ${
                                address?.city || ""
                              }, ${address?.state || ""}, ${
                                address?.country || ""
                              } - ${address?.zipcode || ""}`}
                            </p>
                            <Button
                              btnText={
                                selectedAddress?.id == address?.id
                                  ? T["current_address"]
                                  : T["deliver_here"]
                              }
                              btnClick={() => setSelectedAddress(address)}
                              className={`mt-2 text-xs sm:text-sm md:text-base px-3 py-1 rounded transition-colors ${
                                selectedAddress?.id == address?.id
                                  ? "bg-gray-500"
                                  : "bg-green-500"
                              } text-white w-full sm:w-auto`}
                              btnType="button"
                              disabled={selectedAddress?.id == address?.id}
                            />
                          </div>
                        ))
                      : ""}
                  </div>
                </div>
              )}

              {/* Coupons section start */}
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">
                  {T["available_coupons"]}
                </h2>
                {coupons?.length > 0 && (
                  <div
                    className="text-[#FF6363] cursor-pointer text-sm md:text-base mb-3"
                    onClick={() => {
                      setShowAllCoupons(!showAllCoupons);
                    }}
                  >
                    {showAllCoupons
                      ? T["see_fewer_offers"]
                      : T["see_all_offers"]}
                  </div>
                )}
                {coupons?.length > 0 ? (
                  (showAllCoupons ? coupons : coupons?.slice(0, 3))?.map(
                    (coup, index) => (
                      <div
                        className="border rounded-lg p-2 md:p-3 mb-3 md:mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 shadow-sm bg-[#FFFAF4] border-[#FF6363]"
                        key={index}
                      >
                        <div className="w-full sm:w-auto">
                          <p className="text-xs md:text-sm font-medium">
                            {coup?.coupon_details?.discount_types === "amount"
                              ? `${T["flat_amount_off"]}${coup?.coupon_details?.discount_value}${T["off_on_your_purchase"]}${coup?.coupon_details?.code}`
                              : `${T["flat_percentage_off"]}${coup?.coupon_details?.discount_value}%${T["off_on_your_purchase"]}${coup?.coupon_details?.code}`}
                          </p>
                        </div>
                        <button
                          className="text-white px-4 md:px-6 py-1 rounded-lg border bg-[#FF6363] text-xs md:text-sm w-full sm:w-auto"
                          type="button"
                          onClick={() =>
                            handleApplyCoupon(coup?.coupon_details?.code)
                          }
                          disabled={coup?.applied_coupon}
                        >
                          {coup?.applied_coupon ? T["applied"] : T["apply"]}
                        </button>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-gray-500 text-xs md:text-sm">{T["no_coupons_available"]}</p>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 mt-4">
                  <input
                    type="text"
                    placeholder={T["enter_coupon"]}
                    className="border rounded-lg p-2 w-full text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-pink-500"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                  <Button
                    btnText={T["apply"]}
                    btnType="button"
                    btnClick={() => handleApplyCoupon(coupon)}
                    disabled={!coupon}
                    className="w-full sm:w-auto text-sm md:text-base"
                  />
                </div>
              </div>
              {/* Coupons section start */}

              {/* Schedule Delivery */}
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h3 className="text-base md:text-lg font-semibold flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  {T["schedule_delivery"]}{" "}
                  <span className="text-gray-500 text-xs sm:text-sm">
                    {T["only_applicable_for_basket"]}
                  </span>
                </h3>
                <div className="mt-3 space-y-2">
                  <label className="flex items-center space-x-2 text-sm md:text-base">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="one-time"
                      checked={scheduleType === "one-time"}
                      onChange={() => setScheduleType("one-time")}
                    />
                    <span>{T["one_time_purchase"]}</span>
                  </label>

                  <label className="flex items-center space-x-2 text-sm md:text-base">
                    <input
                      type="radio"
                      name="scheduleType"
                      value="scheduled"
                      checked={scheduleType === "scheduled"}
                      onChange={() => setScheduleType("scheduled")}
                    />
                    <span>{T["schedule_order"]}</span>
                  </label>
                </div>

                {scheduleType === "one-time" && (
                  <div className="mt-4 bg-white p-3 md:p-4 rounded-lg shadow">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {timeslots?.length ? (
                        timeslots.map((slot, index) => (
                          <button
                            key={index}
                            className={`px-3 md:px-4 py-2 border rounded whitespace-nowrap text-xs md:text-sm ${
                              selectedDate === slot.id
                                ? "bg-green-500 text-white"
                                : "bg-gray-200"
                            }`}
                            onClick={() => setSelectedDate(slot.id)}
                          >
                            <div>
                              {formatTimeTo12Hour(slot?.start_time)} -{" "}
                              {formatTimeTo12Hour(slot?.end_time)}
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-sm md:text-base">{T["no_time_slots_available"]}</p>
                      )}
                    </div>
                    <p className="mt-2 text-xs md:text-sm text-gray-500">
                      {T["basket_delivery_note"]}
                    </p>
                  </div>
                )}

                {scheduleType === "scheduled" && (
                  <div className="mt-4 bg-white p-3 md:p-4 rounded-lg shadow">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {[
                        T["sunday"],
                        T["monday"],
                        T["tuesday"],
                        T["wednesday"],
                        T["thursday"],
                        T["friday"],
                        T["saturday"],
                      ].map((day, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            toggleDateSelection({
                              id: index,
                              formatted: day,
                            });
                          }}
                          className={`min-w-[100px] sm:min-w-[120px] px-3 md:px-4 py-2 border rounded text-xs md:text-sm text-center
                            ${
                              selectedDates.includes(day)
                                ? "bg-green-500 text-white"
                                : !day.holiday
                                ? "bg-gray-200"
                                : ""
                            }
                          `}
                        >
                          <div className="font-medium">{day}</div>
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs md:text-sm text-gray-500">
                      {T["basket_delivery_note"]}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            ""
          )}

          {/* Right Section - Order Summary */}
          {showModal && (
            <AddLoginModal
              closeModal={() => setShowModal(false)}
              setShowLoginModal={showModal}
            />
          )}
          {showPaymentModal && (
            <PaymentModal
              onCancel={() => setShowPaymentModal(false)}
              setShowLoginModal={showModal}
              onPayByCard={() => {
                handleConfirm(false);
              }}
              onGenerateInvoice={handleCreateInvoice}
            />
          )}
          <SummarySection
            cart={cart}
            addToCart={addToCart}
            handleConfirm={handleConfirm}
            confirmLoader={confirmLoader}
            addBasketToCart={addBasketToCart}
            handleGiftWrap={handleGiftWrap}
            addProductToBasket={addProductToBasket}
            giftWrap={giftWrap}
            onClearCartClick={() => setShowClearCartModal(true)}
            onRemoveItemClick={(id) => {
              setRemoveItemInfo({
                show: true,
                id: id,
              });
            }}
          />

          {showClearCartModal && (
            <DeleteConfirmationModal
              title={T["clear_cart_confirmation_title"]}
              description={T["clear_cart_confirmation_description"]}
              onCancel={() => setShowClearCartModal(false)}
              loader={buttonLoader}
              onDelete={handleClearCart}
              deleteText={T["clear"]}
            />
          )}
          {removeItemInfo?.show && (
            <DeleteConfirmationModal
              title={T["remove_item_title"]}
              description={T["remove_item_description"]}
              onCancel={() => setRemoveItemInfo({ show: false, id: null })}
              loader={buttonLoader}
              onDelete={handleRemoveItem}
              deleteText={T["remove"]}
            />
          )}
        </div>
      )}
    </>
  );
};

export default Cart;
