"use client";
import {
  SWEDEN_COUNTY_OPTIONS,
} from "@/_constants/constant";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import React, { useEffect, useState } from "react";
import Button from "./Button";
import { useDispatch } from "react-redux";
import { T } from "@/_utils/LanguageTranslator";
import { createRequiredValidation } from "@/_utils/helpers";
import { crossIcon } from "@/_Svgs/Svg";
import LocationField from "../LocationField";
import CommonSelect from "../CommonSelect";

function AddAddress({ formConfig, onSubmit, editInfo, onClose }) {
  const dispatch = useDispatch();
  const { isEdit, editItem } = editInfo;
  const { handleSubmit, setValue, watch } = formConfig;

  // useEffect(() => {
  //   if (isEdit?.edit) {
  //     callApi({
  //       endPoint: `/profile/addresses/${isEdit?.id}`,
  //       method: METHODS.get,
  //       instanceType: INSTANCE.authorize,
  //     })
  //       .then((res) => {
  //         setValue("address_line_1", res.data.address_line1);
  //         setValue("address_line_2", res.data.address_line2);
  //         setValue("address_line_3", res.data.address_line3);
  //         setValue("city", res.data.city);
  //         setValue("zip_code", res.data.zipcode);
  //         setSaveAddress(res?.data.is_default);
  //         dispatch(getAddressList());
  //       })
  //       .catch((err) => {
  //         console.log(err);
  //         // toastMessages(err?.response?.data?.detail || DEFAULT_ERROR_MESSAGE);
  //       });
  //   }
  // }, [isEdit]);

  // // const onSubmit = async (data) => {
  // //   setLoader(true);
  // //   if (isEdit?.edit) {
  // //     callApi({
  // //       endPoint: `/profile/addresses/${isEdit?.id}/`,
  // //       method: METHODS.patch,
  // //       instanceType: INSTANCE.authorize,
  // //       payload: {
  // //         address_line1: data.address_line_1,
  // //         address_line2: data.address_line_2,
  // //         address_line3: data.address_line_3,
  // //         city: data.city,
  // //         zipcode: data.zip_code,
  // //         is_default: saveAddress,
  // //       },
  // //     })
  // //       .then((res) => {
  // //         setShowAddAddress(false);
  // //         dispatch(getAddressList());
  // //         setIsEdit({ edit: false, id: "" });
  // //         setLoader(false);
  // //         toastMessages(res.data.message, successType);
  // //       })
  // //       .catch((err) => {
  // //         console.log(err);
  // //         setLoader(false);
  // //         //   toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
  // //       });
  // //   } else {
  // //     await callApi({
  // //       endPoint: "/profile/addresses/",
  // //       method: METHODS.post,
  // //       instanceType: INSTANCE.authorize,
  // //       payload: {
  // //         address_line1: data.address_line_1,
  // //         address_line2: data.address_line_2,
  // //         address_line3: data.address_line_3,
  // //         city: data.city,
  // //         zipcode: data.zip_code,
  // //         is_default: saveAddress,
  // //       },
  // //     })
  // //       .then((res) => {
  // //         setShowAddAddress(false);
  // //         dispatch(getAddressList());
  // //         toastMessages(res.data.message, successType);
  // //       })
  // //       .catch((err) => {
  // //         toastMessages(err?.response?.data?.detail || DEFAULT_ERROR_MESSAGE);
  // //       });
  // //   }
  // // };
  // const handleSetAsDefault = (e) => {
  //   setSaveAddress(!saveAddress);
  // };
  return (
    <div className="p-6 w-full">
      <button className="closeIcon" type="button" onClick={onClose}>
        {crossIcon}
      </button>
      <div>{T["add_new_address"]}</div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LocationField
            fieldName="address"
            formConfig={formConfig}
            rules={createRequiredValidation(T["address"])}
            placeholder="Enter Address"
            label="Address *"
            options={{
              types: ["address"], // Ensures a detailed address, including postal codes
              componentRestrictions: { country: ["se"] }, // Restrict to Sweden
            }}
          />
          <CommonTextInput
            fieldName="city"
            formConfig={formConfig}
            placeholder="Enter City"
            label="City *"
            rules={createRequiredValidation(T["city"])}
          />
          <CommonSelect
            formConfig={formConfig}
            label="State *"
            selectType="react-select"
            placeholder="Select State"
            options={SWEDEN_COUNTY_OPTIONS}
            fieldName="state"
            rules={createRequiredValidation(T["state"])}
            // className="add-edit-input"
          />

          <CommonTextInput
            formConfig={formConfig}
            placeholder="Enter Zip Code"
            fieldName={"zip_code"}
            rules={createRequiredValidation(T["zip_code"])}
            label="Zipcode *"
            isNumberOnly={true}
            maxLength={6}
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-4">
          <Button
            className="bg-[#FF6D2F] text-white py-2 px-4 rounded-md w-full sm:w-auto order-2 sm:order-1"
            btnType="submit"
            btnText={isEdit ? T["update_address"] : T["add_address"]}
          />
          <label className="flex items-center gap-2 text-gray-500 text-sm sm:text-base order-1 sm:order-2">
            <input
              type="checkbox"
              {...formConfig.register("isPrimary")}
              className="w-4 h-4"
              checked={watch("isPrimary")}
            />
            Set as default address
          </label>
        </div>
      </form>
    </div>
  );
}

export default AddAddress;
