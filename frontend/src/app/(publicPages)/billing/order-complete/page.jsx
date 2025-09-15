"use client";
import { callApi } from "@/_Api-Handlers/apiFunctions";
import { GET_ORDER_DETAILS } from "@/_Api-Handlers/APIUrls";
import PageLoader from "@/_components/_common/PageLoader";
import { CHECK_ICON } from "@/_Svgs/Svg";
import { handlePrintPdf } from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

const page = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [pageLoader, setPageLoader] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    setPageLoader(true);

    callApi({
      endPoint: `${GET_ORDER_DETAILS}${orderId}/`,
      method: "GET",
      instanceType: INSTANCE?.authorize,
    })
      .then((res) => {
        console.log(res, "ressadasd");
        setOrder(res?.data || null);
        setInvoiceUrl(res?.data?.invoice?.pdf_file);
      })
      .catch((err) => {
        toastMessages("Order not found");
        // router.push("/products");
      })
      .finally(() => {
        setPageLoader(false);
      });
  }, [orderId]);

  return (
    <>
      {pageLoader && <PageLoader />}
      <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
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
          <div className="mt-6 bg-gray-100 p-4 rounded-lg text-left">
            <div className="mt-6 bg-gray-100 p-4 rounded-lg text-left">
              <p>
                <strong>Order ID:</strong> {order?.order_id ?? "-"}
              </p>
              <p>
                <strong>Customer Name:</strong> {order?.customer_name ?? "-"}
              </p>
              <p>
                <strong>Address:</strong> {order?.address ?? "-"}
              </p>
              <p>
                <strong>Items:</strong>{" "}
                {order?.items?.map((item) => item?.product?.name).join(", ") ||
                  "-"}
              </p>
              <p className="text-green-600 text-lg font-bold">
                <strong>Total:</strong> {order?.total_amount ?? "-"} SEK
              </p>
            </div>
            <div
              className="cursor-pointer flex justify-center text-green-700 ml-2 underline"
              onClick={() => handlePrintPdf(invoiceUrl)}
            >
              Download Invoice
            </div>
          </div>

          <button
            onClick={() => router.push("/products")}
            className="mt-4 bg-green-500  text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            {T["continue_shopping"]}
          </button>
        </div>
      </div>
    </>
  );
};

export default page;
