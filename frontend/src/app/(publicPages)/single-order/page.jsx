"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { callApi } from "@/_Api-Handlers/apiFunctions";
import { GET_ORDER_DETAILS } from "@/_Api-Handlers/APIUrls";
import { toastMessages } from "@/_utils/toastMessage";
import PageLoader from "@/_components/_common/PageLoader";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { T } from "@/_utils/LanguageTranslator";
import AddLoginModal from "@/_components/_common/Modals/AddLoginModal";

const OrderDetailsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderNotFound, setOrderNotFound] = useState(false);

  const [pageLoader, setPageLoader] = useState(false);
  const [order, setOrder] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    if (localStorage?.getItem("token")) {
      setPageLoader(true);
      callApi({
        endPoint: `${GET_ORDER_DETAILS}${orderId}/`,
        method: "GET",
        instanceType: INSTANCE?.authorize,
      })
        .then((res) => {
          console.log(res, "res");
          setOrder(res?.data || null);
        })
        .catch((err) => {
          toastMessages("Order not found");
          setOrderNotFound(true);
          // router.push("/products");
        })
        .finally(() => {
          setPageLoader(false);
        });
    } else {
      setShowLoginModal(true);
    }
  }, [orderId]);

  return (
    <>
      {pageLoader && <PageLoader />}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {!localStorage?.getItem("token") || orderNotFound ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">
              {orderNotFound
                ? "Order Not Found"
                : "Please login to view order details"}
            </h2>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold mb-4">
              Order Summary - {order?.order_id ?? "-"}
            </h1>

            {/* Customer & Delivery Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white shadow rounded-lg p-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <p className="font-medium">{order?.customer_name ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{order?.email ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact Number</p>
                <p className="font-medium">{order?.contact_number ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Address</p>
                <p className="font-medium">{order?.address ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className="capitalize inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {order?.status?.replace(/_/g, " ") ?? "-"}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium">
                  {order?.created_at
                    ? new Date(order.created_at).toLocaleString()
                    : "-"}
                </p>
              </div>
            </div>

            {/* Items Table */}
            {order?.items?.length > 0 ? (
              <div className="overflow-x-auto bg-white shadow rounded-lg mb-6">
                <table className="w-full table-auto">
                  <thead className="bg-gray-100 text-sm text-gray-700">
                    <tr>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Weight</th>
                      <th className="p-3 text-left">Qty</th>
                      <th className="p-3 text-left">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="border-t text-sm">
                        <td className="p-3">{item?.product?.name ?? "-"}</td>
                        <td className="p-3">
                          {item?.product?.description ? (
                            <div
                              className="cursor-pointer"
                              dangerouslySetInnerHTML={{
                                __html: item?.product?.description,
                              }}
                            ></div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="p-3">
                          {item?.product?.inventory?.weight ?? "-"}{" "}
                          {item?.product?.inventory?.unit ?? ""}
                        </td>
                        <td className="p-3">{item?.quantity ?? "-"}</td>
                        <td className="p-3">₹{item?.price ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-gray-500 mb-6">No items found.</p>
            )}

            {/* Pricing Summary */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3">Pricing Summary</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Subtotal:</span> ₹
                  {order?.total_amount ?? "-"}
                </div>
                <div>
                  <span className="text-gray-600">Discount:</span> ₹
                  {order?.discount_amount ?? "-"}
                </div>
                <div>
                  <span className="text-gray-600">Packaging:</span> ₹
                  {order?.order_packaging_charge ?? "-"}
                </div>
                <div>
                  <span className="text-gray-600">Delivery Fee:</span> ₹
                  {order?.delivery_fees ?? "-"}
                </div>
                <div className="col-span-2 sm:col-span-3 font-bold">
                  Final Amount: ₹{order?.final_amount ?? "-"}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => router.push("/products")}
            className="mt-4 bg-green-500 text-white font-semibold px-6 py-2 rounded-lg transition"
          >
            {T["browse_products"]}
          </button>
        </div>
      </div>
      {showLoginModal && (
        <AddLoginModal
          closeModal={() => setShowLoginModal(false)}
          setShowLoginModal={setShowLoginModal}
        />
      )}
    </>
  );
};

export default OrderDetailsPage;
