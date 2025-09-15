"use client";
import { CART } from "@/Assets/Icons/Svg";
import React, { use, useEffect, useState } from "react";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { toastMessages } from "@/_utils/toastMessage";
import PageLoader from "@/_components/_common/PageLoader";
import { ORDERS, REORDER_ENDPOINT } from "@/_Api-Handlers/APIUrls";
import { onPageChange } from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import Pagination from "@/_components/Pagination";
import { IN_TRANSIT } from "@/_constants/constant";
import { OPEN_EYE } from "../../../../../public/images/SvgIcons";
import { LOCATION_ICON, QUESTION_MARK_ICON } from "@/Assets/SVGIcons";
import moment from "moment";
import axios from "axios";

const STATUS_TO_TEXT = {
  in_transit: T["in_transit"],
  delivered: T["delivered"],
  canceled: T["cancelled"],
  rejected: T["pending"],
  payment_pending: T["payment_pending"],
  in_progress: T["in_progress"],
  confirmed: T["confirmed"],
  pending: T["pending"],
  dispatched: T["dispatched"]
};
function OrderPage({ toggleSidebar, handleSideBarItem }) {
  const [orders, setOrders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoader, setPageLoader] = useState(false);
  const [inTransitOrders, setInTransitOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);

  useEffect(() => {
    setPageLoader((prev) => true);
    callApi({
      endPoint: ORDERS,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: {
        page: currentPage,
      },
    })
      .then((res) => {
        const orders = res?.data?.results || [];
        console.log(orders, "order res");
        setOrders(orders || []);
        if (orders.length) {
          setInTransitOrders(
            orders.filter((order) => order?.status == IN_TRANSIT) || []
          );
          setPastOrders(
            orders.filter((order) => order?.status !== IN_TRANSIT) || []
          );
        }
        setTotalCount(res?.data?.totalCount || 0);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  }, [currentPage]);
  const handleRepeatOrder = (order) => {
    console.log(order, "order");
  };

  const handleOrder = (id) => {
    handleSideBarItem("orders", id, orders);
    toggleSidebar();
  };

  return (
    <div className="w-full p-0 lg:p-6">
      {pageLoader && <PageLoader />}
      {orders.length > 0 ? (
        <div className="space-y-8">
          {/* in transit orders start */}
          <div>
            <h2 className="text-lg md:text-2xl font-semibold mb-4"> {T["in_transit_orders"]} </h2>
            {inTransitOrders.length > 0 ? (
              <div className="space-y-4">
                {inTransitOrders.map((order, index) => (
                  <SingleOrder
                    key={index}
                    order={order}
                    handleOrder={handleOrder}
                    showCartIcon={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-base md:text-lg font-semibold p-4 bg-gray-50 rounded-lg">
                {T["no_in_transit_orders_found"]}
              </div>
            )}
          </div>
          {/* in transit orders end */}
          {/* past orders start */}
          <div>
            <h2 className="text-lg md:text-2xl font-semibold mb-4"> {T["past_orders"]} </h2>
            {pastOrders.length > 0 ? (
              <div className="space-y-4">
                {pastOrders?.map((order, index) => (
                  <SingleOrder
                    key={index}
                    order={order}
                    handleOrder={handleOrder}
                    showCartIcon={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-base md:text-lg p-4 bg-gray-50 rounded-lg">
                {T["no_past_orders_found"]}
              </div>
            )}
          </div>
          {/* past orders end */}
          <div className="mt-6">
            <Pagination
              totalData={totalCount}
              itemsPerPage={10}
              currentPage={currentPage}
              onPageChange={(page) => onPageChange(page, setCurrentPage)}
            />
          </div>
        </div>
      ) : (
        <div className="text-base md:text-lg text-center p-8 bg-gray-50 rounded-lg">
          {T["no_orders_found"]}
        </div>
      )}
    </div>
  );
}

export default OrderPage;

// const Order = ({ order, handleOrder, showCartIcon, handleOrder }) => {
//   const handleRepeatOrder = (order) => {
//     const payload = order?.items?.map((item) => ({
//       product_variant: item?.product?.id,
//       quantity: item?.quantity,
//     }));

//     callApi({
//       endPoint: REORDER_ENDPOINT,
//       method: "POST",
//       instanceType: INSTANCE?.authorized,
//       payload: payload,
//     })
//       .then((res) => {
//         toastMessages("Order successful", "success");
//       })
//       .catch((error) => {
//         console.error("Error getting address:", error);
//         toastMessages(
//           error?.response?.data?.error || "Something went wrong",
//           "error"
//         );
//       });
//   };

//   return (
//     <div
//       key={order.id}
//       className="border border-[#ddd] rounded-xl p-4 mb-4 flex justify-between"
//     >
//       <div>
//         <div className="mb-2 text-[#555] flex items-center gap-2">
//           Order #{order.order_id} |{" "}
//           {moment(order?.created_at).format("ddd, MMM DD, YYYY, hh:mm A")}
//           <div className="bg-[#CCFFCF] text-[#08A300] font-bold px-2 py-1 rounded-lg ml-4">
//             {order.status}
//           </div>
//         </div>
//         {/* <p className="text-[#555] text-sm mb-1">{`${order?.shipping_address?.address},${order?.shipping_address?.city},${order?.shipping_address?.state}`}</p> */}
//         <p className="text-[#555] text-sm mb-1 flex gap-2 items-center">
//           <Location />
//           {order?.address}
//         </p>
//         <p className="text-black text-sm font-extrabold mb-1">Items Order</p>
//         {order?.items?.map((itm, index) => (
//           <p
//             className="text-[#555] text-sm"
//             key={index}
//           >{`${itm?.product?.name} (${itm?.quantity})`}</p>
//         ))}
//       </div>
//       <div className="flex flex-col justify-between items-end mt-4 py-4">
//         <div className="text-[#333] text-sm">
//           <span className="text-black font-extrabold text-sm">Total Paid:</span>{" "}
//           {order?.total_amount || "0.00"}
//         </div>
//         <div className="flex gap-2 mt-2">
//           <div
//             className="rounded-full p-2 bg-[#F2FFEC] cursor-pointer"
//             onClick={() => handleOrder(order?.id)}
//           >
//             <Eye />
//           </div>
//           {showCartIcon && (
//             <div
//               className="rounded-full p-2 bg-[#F2FFEC] cursor-pointer"
//               onClick={() => handleRepeatOrder(order)}
//             >
//               {CART}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };
const SingleOrder = ({ order, handleOrder, showCartIcon = false }) => {
  const handleRepeatOrder = async (order) => {
    console.log(order, "this is order");
    const payload = order?.items?.map((item) => ({
      product_variant: item?.product?.id,
      quantity: item?.quantity,
    }));

    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(REORDER_ENDPOINT, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toastMessages(T["order_successful"], "success");
    } catch (error) {
      console.error("Error getting address:", error);
      toastMessages(
        error?.response?.data?.error || T["something_went_wrong"],
        "error"
      );
    }
  };

  return (
    <div
      key={order.id}
      className="border border-[#ddd] rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 flex flex-col sm:flex-row justify-between gap-4 sm:gap-6"
    >
      <div className="w-full sm:w-2/3">
        <div className="mb-2 text-[#555] flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex items-center gap-2">
            <span>{T["order_number"]}{order.order_id}</span>
            <span className="hidden sm:inline">|</span>
          </div>
          <div className="text-sm sm:text-base">
            {moment(order?.created_at).format("ddd, MMM DD, YYYY, hh:mm A")}
          </div>
          <div className="bg-[#CCFFCF] text-[#08A300] font-bold px-2 py-1 rounded-lg md:ml-4 w-fit">
            {order?.status ? STATUS_TO_TEXT[order?.status] : T["not_available"]}
          </div>
        </div>
        <p className="text-[#555] text-sm mb-1 flex gap-2 items-center">
          {LOCATION_ICON}
          <span className="break-words">{order?.address}</span>
        </p>
        <p className="text-black text-sm font-extrabold mb-1">{T["items_order"]}</p>
        <div className="max-h-[150px] overflow-y-auto">
          {order?.items?.length > 0 ? (
            order?.items?.map((itm, index) => (
              <p
                className="text-[#555] text-sm mb-1"
                key={index}
              >{`${itm?.product?.name || ""} (${itm?.quantity || ""})`}</p>
            ))
          ) : (
            <p className="text-[#555] text-sm">{T["no_items_found"]}</p>
          )}
        </div>
      </div>

      <div className="flex flex-row sm:flex-col justify-between items-start sm:items-end sm:w-1/3">
        <div className="text-[#333] text-sm">
          <span className="text-black font-extrabold text-sm">{T["total_paid"]}</span>{" "}
          <span className="whitespace-nowrap">{order.final_amount}</span>
        </div>
        <div className="flex gap-2">
          <img
            className="h-[40px] w-[40px] sm:h-[56px] sm:w-[56px] flex items-center justify-center rounded-[50px] bg-[#F2FFEC] p-[10px] sm:p-[15px] cursor-pointer"
            onClick={() => handleOrder(order?.id)}
            src="/images/eye-icon.svg"
            alt="View Order"
          />
          {/* {showCartIcon && (
            <img
              className="h-[40px] w-[40px] sm:h-[56px] sm:w-[56px] flex items-center justify-center rounded-[50px] bg-[#F2FFEC] p-[8px] sm:p-[10px] cursor-pointer"
              onClick={() => handleRepeatOrder(order)}
              src="/images/repeat-order.svg"
              alt="Repeat Order"
            />
          )} */}
        </div>
      </div>
    </div>
  );
};
