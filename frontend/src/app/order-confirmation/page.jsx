"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CHECK_ICON, CHECKOUT_CROSS_ICON } from "@/_Svgs/Svg";
import { T } from "@/_utils/LanguageTranslator";
import { GET_ORDER_DETAILS } from "@/_Api-Handlers/APIUrls";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "../_constant/UrlConstant";
import PageLoader from "@/_components/_common/PageLoader";
import Link from "next/link";

const OrderConfirmation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const success = searchParams.get("success");
  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");
  const address = searchParams.get("address");


  const [orderDetails, setOrderDetails] = useState(null);
  const [pageLoader, setPageLoader] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!sessionId) {
    if (typeof window !== "undefined") {
      router.push("/");
    }
    return null;
  }
  useEffect(() => {
    setPageLoader(false);

    callApi({
      endPoint: `/orders/OrderAfterBooking`,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        order_id: orderId,
        address:address
      },
    })
      .then((res) => {})
      .catch((err) => {
        console.error("Error fetching order details:", err);
      })
      .finally(() => {
        setPageLoader(false);
      });
  }, []);

  useEffect(() => {
    setIsSuccess(success === "true");

    if (success === "true") {
      setPageLoader(true);

      callApi({
        endPoint: `${GET_ORDER_DETAILS}`,
        method: METHODS.get,
        instanceType: INSTANCE.authorize,
        params: {
          search: sessionId,
        },
      })
        .then((res) => {
          setOrderDetails(res?.data);
        })
        .catch((err) => {
          console.error("Error fetching order details:", err);
        })
        .finally(() => {
          setPageLoader(false);
        });
    }
  }, [orderId, success]); // Added `success` as a dependency

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
            {T["your_order_has_been_placed_successfully"]}
          </p>

          <div className="mt-6 bg-gray-100 p-4 rounded-lg text-left">
            <p className="mb-2">
              <strong>Order ID:</strong> {orderDetails?.order_id ?? "-"}
            </p>
            <p className="mb-2">
              <strong>Customer Name:</strong>{" "}
              {orderDetails?.customer_name ?? "-"}
            </p>
            <p className="mb-2">
              <strong>Address:</strong> {orderDetails?.address ?? "-"}
            </p>
            <p className="mb-2">
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
            <p className="text-green-600 text-lg font-bold mb-2">
              <strong>Total:</strong> ${orderDetails?.total_amount ?? "-"}
            </p>
            <Link
              href={`/single-order?orderId=${orderDetails?.order_id}`}
              className="inline-block mt-4 text-blue-600 hover:underline font-medium"
            >
              View More Details →
            </Link>
          </div>
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
