"use client";
import AddressCard from "@/_components/_common/AddressCard";
import React, { useEffect, useState } from "react";
import { ADDRESS_CARD_DATA } from "../../_constant/Constant";
import Button from "@/_components/_common/Button";
import Summary from "@/_components/_common/Summary";
import Cart from "@/_components/Cart";
import { CART_LIST } from "@/_Api-Handlers/APIUrls";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import NewAddressForm from "@/_components/NewAddressForm";
import { useForm } from "react-hook-form";
import { toastMessages } from "@/_utils/toastMessage";
import AddAddress from "@/_components/_common/AddAddress";

const Page = () => {
  const formConfig = useForm();
  const [buttonLoader, setButtonLoader] = useState(false);
  const [cartItems, setCartItems] = useState();
  const [showAddress, setShowAddress] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editInfo, setEditInfo] = useState({
    isEdit: false,
    editItem: null,
  });

  useEffect(() => {
    getAddress();
  }, []);
  const getAddress = () => {
    callApi({
      endPoint: CART_LIST,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
      params: {
        page: "1",
      },
    })
      .then((res) => {
        console.log(res, "results");
        toastMessages(res?.data?.message, successType);
        setCartItems(res?.data?.cart_items);
      })
      .catch((err) => {
        toastMessages(err.response.data.error || DEFAULT_ERROR_MESSAGE);
      });
  };
  const onSubmit = (data) => {
    console.log(data, "this is data");
    setButtonLoader((prev) => true);
    const payload = {
      ...data,
      state: data?.state?.value,
    };
    callApi({
      endPoint: "bakery/customer-addresses/",
      method: isEdit ? "PATCH" : "POST",
      instanceType: INSTANCE?.authorize,
      payload: payload,
    })
      .then((res) => {
        console.log(res, "this is res");
        toastMessages(
          res?.data?.message || "Address added successfully",
          "success"
        );
        setShowAddAddress(false);
        getAddress();
        formConfig.reset();
      })
      .catch((err) => {
        console.log(err, "this is err");
        toastMessages(
          err?.response?.data?.message ||
            err?.response?.data?.state?.[0] ||
            "Something went wrong",
          "error"
        );
      })
      .finally(() => {
        setButtonLoader((prev) => false);
      });
  };

  const addAddress = () => {
    console.log(data, "this is data");
    setButtonLoader((prev) => true);
    const payload = {
      ...data,
      state: data?.state?.value,
    };
    callApi({
      endPoint: "bakery/customer-addresses/",
      method: isEdit ? "PATCH" : "POST",
      instanceType: INSTANCE?.authorize,
      payload: payload,
    })
      .then((res) => {
        console.log(res, "this is res");
        toastMessages(
          res?.data?.message || "Address added successfully",
          "success"
        );
        setShowAddAddress(false);
        fetchAddress();
        formConfig.reset();
      })
      .catch((err) => {
        console.log(err, "this is err");
        toastMessages(
          err?.response?.data?.message ||
            err?.response?.data?.state?.[0] ||
            "Something went wrong",
          "error"
        );
      })
      .finally(() => {
        setButtonLoader((prev) => false);
      });
  };

  return (
    <div className="col-span-2 flex ml-10">
      <button
        className="bg-green-500 text-white py-2 px-4 rounded-md"
        onClick={() => setShowAddAddress(true)}
      >
        Add Address
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
        <div className="flex flex-col items-center ml-14 my-6 gap-2">
          <div className="grid grid-cols-2 gap-6 px-10 mt-4">
            {ADDRESS_CARD_DATA?.map((item, idx) => (
              <div className="gap-8" key={idx}>
                <h1 className="text-black">Saved Addresses</h1>
                <AddressCard address={item} />
              </div>
            ))}
          </div>
          <h1 className="w-[90%]">Apply Coupon</h1>
          <div className=" common-card w-full">
            <div className="flex justify-between w-full">
              <h1>Available Coupon</h1>
              <h4 className="text-green-300  ">See All Offers</h4>
            </div>
            <div className="flex relative w-full">
              <input className="rounded-lg w-full h-10 bg-green-200  pl-4 pr-28 " />
              <Button
                className="absolute right-0 top-1/2 transform -translate-y-1/2 common-btn rounded-lg w-24 "
                btnText="Apply"
              />
            </div>
            <h1>Enter Coupon</h1>
            <div className="flex">
              <input className="rounded-lg w-full h-10" />
              <Button className="common-btn rounded-lg w-24" btnText="Apply" />
            </div>
          </div>
          <h1 className="w-[90%]">
            Schedule Delivery
            <span className="text-gray-400">(only applicable for basket)</span>
          </h1>
          <div className="common-card w-full">
            <div className="flex gap-2">
              <input type="checkbox" className="rounded-checkbox" />
              <h1>One Time Purchase</h1>
            </div>
            <div className="flex gap-4">
              <Button
                btnText={"6:00 AM"}
                className={"common-btn rounded-lg w-24"}
              />
              <Button
                btnText={"7:00 AM"}
                className="common-btn rounded-lg w-24"
              />
              <Button
                btnText={"8:00 AM"}
                className="common-btn rounded-lg w-24"
              />
              <Button
                btnText={"9:00 AM"}
                className="common-btn rounded-lg w-24"
              />
              <Button
                btnText={"10:00 AM"}
                className="common-btn rounded-lg w-24"
              />
            </div>
            <div className="flex gap-8 mt-2">
              <span className="text-red-500">1 order left</span>
              <span className="text-red-500">40 order left</span>
              <span className="text-red-500">No order left</span>
              <span className="text-red-500">50 order left</span>
              <span className="text-red-500">33 order left</span>
            </div>
            <div className="flex gap-2 ">
              <input type="checkbox" className="rounded-checkbox" />
              <h1 className="text-black">Schedule Order</h1>
            </div>
          </div>
          <div className="common-card mt-10 w-full">
            <h1 className="text-lg font-semibold mb-4">Note</h1>
            <textarea
              placeholder="Add Note"
              className="w-full h-24 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      )}
      <div className="ml-auto mt-8">
        <h1>Summary</h1>
        <Cart />
      </div>
    </div>
  );
};

export default Page;
