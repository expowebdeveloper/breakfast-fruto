"use client";

import { callApi, fetchCart, METHODS } from "@/_Api-Handlers/apiFunctions";
import { GET_ORDER_DETAILS } from "@/_Api-Handlers/APIUrls";
import PageLoader from "@/_components/_common/PageLoader";
import { CHECK_ICON, CHECKOUT_CROSS_ICON } from "@/_Svgs/Svg";
import { formatDate } from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

const OrderConfirmation = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("order_id");
  const success = searchParams.get("success");
  const sessionId = searchParams.get("session_id");
  const address = searchParams.get("address");
  const user_id = searchParams.get("user_id");
  const [orderDetails, setOrderDetails] = useState(null);
  const [pageLoader, setPageLoader] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  if (!sessionId) {
    if (typeof window !== "undefined") {
      router.push("/");
    }
    return null;
  }

  useEffect(() => {
    // setPageLoader(false);
    callApi({
      endPoint: `/orders/OrderAfterBooking/`,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        order_id: orderId,
        address: address,
        user: user_id,
      },
    })
      .then((res) => {
        // fetchOrderDetails();
      })
      .catch((err) => {
        console.error("Error fetching order details:", err);
      })
      .finally(() => {
        // setPageLoader(false);
      });
  }, []);

  // useEffect(() => {
  //   fetchOrderDetails();
  // }, [orderId, success]); // Added `success` as a dependency
  // const fetchOrderDetails = () => {
  //   setIsSuccess(success === "true"); // Directly set success state

  //   if (success === "true") {
  //     setPageLoader(true);

  //     callApi({
  //       endPoint: `${GET_ORDER_DETAILS}`,
  //       method: METHODS.get,
  //       instanceType: INSTANCE.authorize,
  //       params: {
  //         search: orderId,
  //       },
  //     })
  //       .then((res) => {
  //         setShowOrderDetails(res?.data?.results?.length ? true : false);
  //         setOrderDetails(res?.data?.results?.[0]);
  //       })
  //       .catch((err) => {
  //         console.error("Error fetching order details:", err);
  //       })
  //       .finally(() => {
  //         setPageLoader(false);
  //       });
  //   }
  // };

  useEffect(() => {
    let attempts = 0;
    let intervalId;
    const maxAttempts = 3;
    const isPolling = success === true || success === "true";

    const fetchOrderDetails = async () => {
      try {
        console.log("Fetching attempt:", attempts + 1);

        const res = await callApi({
          endPoint: `${GET_ORDER_DETAILS}`,
          method: METHODS.get,
          instanceType: INSTANCE.authorize,
          params: {
            search: orderId,
          },
        });

        const results = res?.data?.results || [];
        const hasResults = results.length > 0;

        if (hasResults) {
          setShowOrderDetails(true);
          setOrderDetails(results[0]);
          clearInterval(intervalId);
          setPageLoader(false);
          fetchCart(dispatch, setPageLoader);
        } else {
          attempts++;
          console.log("No results yet, attempt:", attempts);

          if (attempts >= maxAttempts) {
            clearInterval(intervalId);
            setPageLoader(false);
          }
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        attempts++;

        if (attempts >= maxAttempts) {
          clearInterval(intervalId);
          setPageLoader(false);
        }
      }
    };

    if (isPolling) {
      setIsSuccess(true);
      console.log("Polling started");
      setPageLoader(true);
      fetchOrderDetails();
      intervalId = setInterval(fetchOrderDetails, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, success]);
  console.log(pageLoader, "sdfsdfpage loader");

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      {pageLoader && <PageLoader />}
      {isSuccess ? (
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-lg text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-500 flex items-center justify-center rounded-full text-white text-4xl">
              {CHECK_ICON}
            </div>
          </div>

          <h2 className="text-xl font-semibold text-green-600">
            {T["thank_you_for_ordering"]}
          </h2>
          <p className="text-gray-600">
            {T["your_order_has_been_placed_su ccessfully"]}
          </p>
          {/* commented for future use */}
          {showOrderDetails ? (
            <div className="mt-6 bg-gray-100 p-4 rounded-lg text-left">
              <p>
                <strong>Order ID:</strong> {orderDetails?.order_id ?? "-"}
              </p>
              <p>
                <strong>Customer Name:</strong>{" "}
                {orderDetails?.customer_name ?? "-"}
              </p>
              <p>
                <strong>Address:</strong> {orderDetails?.address ?? "-"}
              </p>
              <p>
                <strong>Delivery Time:</strong>{" "}
                {formatDate(orderDetails?.order_delivery_date, "YYYY-MM-DD") ??
                  "-"}
              </p>
              <p>
                <strong>Items:</strong>{" "}
                {orderDetails?.items
                  ?.map((item) => item?.product?.name)
                  .join(", ") || "-"}
              </p>
              {/* <p>
                <strong>Paid Via:</strong> {orderDetails?.payment_method ?? "-"}
              </p>
              <p>
                <strong>Deliver By:</strong>{" "}
                {orderDetails?.delivery_date
                  ? new Date(orderDetails.delivery_date).toLocaleString()
                  : "-"}
              </p> */}
              <p className="text-green-600 text-lg font-bold">
                <strong>Total:</strong> {orderDetails?.final_amount ?? "-"} SEK
              </p>
              <Link
                href={`/single-order?orderId=${orderDetails?.order_id}`}
                className="inline-block mt-4 text-green-600 hover:underline font-medium"
              >
                View More Details →
              </Link>
            </div>
          ) : (
            ""
          )}

          <button
            onClick={() => router.push("/products")}
            className="mt-4 bg-green-500  text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            {T["continue_shopping"]}
          </button>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-md text-center relative z-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-500 flex items-center justify-center rounded-full text-white text-4xl">
              {CHECKOUT_CROSS_ICON}
            </div>
          </div>

          <h2 className="text-xl font-semibold text-red-600">
            {T["order_failed"]}
          </h2>
          <p className="text-gray-600">{T["something_went_wrong_try_again"]}</p>

          <button
            onClick={() => router.push("/")}
            className="mt-4 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            {T["go_to_home"]}
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderConfirmation;
