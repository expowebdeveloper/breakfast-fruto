import React from "react";
import { LOCATION_ICON } from "@/Assets/SVGIcons";

const OrderDetails = ({ isSidebarOpen, toggleSidebar }) => {
  return (
    <div
      className={`fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-lg overflow-y-auto z-50 transform ${
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 z-40`}
    >
      <div className="p-4">
        {/* Order Header */}
        <div className="flex gap-6">
          <button
            className="text-gray-500 hover:text-gray-800"
            onClick={toggleSidebar}
          >
            ✖
          </button>
          <div className="text-lg font-bold text-black">
            Order #187812973688596
          </div>
        </div>

        <div className="mt-4">
          <div className="flex gap-4 mb-6">
            <div>{LOCATION_ICON}</div>
            <div className="font-medium text-black">bakery</div>
          </div>
          <div className="flex gap-4">
            <div>{LOCATION_ICON}</div>
            <div className="text-black">David Williams</div>
          </div>
          <p className="text-gray-500 text-sm ml-10">
            Storgatan 45, 2 tr (2nd floor), 123 45
            <br />
            Göteborg, Sweden
          </p>
          <div className="ml-10">
            <p className="text-black font-medium mt-2">
              Delivered on Mon, Oct 14, 2024, 12:15 AM
            </p>
            <span className="inline-block bg-[#E8E4FF] text-[#0003A3] text-xs font-medium px-2 py-1 rounded mt-2">
              On Time
            </span>
          </div>
        </div>

        {/* Order Details */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-black">Order Details</h3>
          <ul className="mt-4 space-y-4">
            {[1, 2, 3].map((_, index) => (
              <li key={index} className="flex items-center">
                <img
                  src="/images/bread.png"
                  alt="Premium Croissant"
                  className="w-12 h-12 rounded mr-4"
                />
                <div className="flex-grow">
                  <p className="font-medium text-black">Premium Croissant</p>
                  <p className="text-sm text-[#FF6363]">$20.00</p>
                </div>
                <p className="font-medium text-black">$120.00</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Item Totals */}

        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between mb-4">
            <p className="text-black">Items Total</p>
            <p className="text-black">$360.00</p>
          </div>
          {/* <div className="flex justify-between text-gray-600">
            <p>Order Packing Charges</p>
            <p>$5.00</p>
          </div> */}
          {/* <div className="flex justify-between text-gray-600">
            <p>Platform Fee</p>
            <p>$3.00</p>
          </div> */}
          <div className="flex justify-between text-green-600">
            <p>Discount Applied (FLAT10)</p>
            <p>-$20.00</p>
          </div>
          <div className="flex justify-between text-gray-600">
            <p>Delivery Fee</p>
            <p>$10.00</p>
          </div>
          <div className="flex justify-between text-gray-600">
            <p>Taxes</p>
            <p>$6.00</p>
          </div>
        </div>

        {/* Total Bill */}
        <div className="mt-6 border-t border-black pt-4 flex justify-between">
          <div className="text-black">Paid via Card</div>
          <div className="text-black font-bold">Total Bill</div>
          <div className="text-black font-bold">$364.00</div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
