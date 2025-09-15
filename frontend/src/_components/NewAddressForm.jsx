"use client";
import React, { useEffect, useRef } from "react";
import LocationField from "./LocationField";
import { createRequiredValidation, extractOption } from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import Button from "./_common/Button";
import { crossIcon } from "@/_Svgs/Svg";
import { SEARCH_ZIPCODE } from "@/_Api-Handlers/APIUrls";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { toastMessages } from "@/_utils/toastMessage";
import CommonSelect from "./CommonSelect";
import { SWEDEN_COUNTY_OPTIONS } from "@/_constants/constant";
import LocationComponent from "./LocationComponent";

const NewAddressForm = ({
  formConfig,
  onSubmit,
  editInfo,
  loader,
  onClose,
}) => {
  const timerRef = useRef(null);
  const { editItem, isEdit } = editInfo;
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
    setValue,
  } = formConfig;

  useEffect(() => {
    if (isEdit) {
      console.log(editItem, "edititem");
      formConfig.setValue("address", editItem?.address);
      formConfig.setValue("city", editItem?.city);
      formConfig.setValue("zipcode", editItem?.zipcode);
      formConfig.setValue("primary", editItem?.primary);
      const extractedState = extractOption(
        SWEDEN_COUNTY_OPTIONS,
        editItem?.state,
        "value"
      );
      formConfig.setValue("state", extractedState);
    }
  }, [isEdit]);
  // useEffect(() => {
  //   const debounceTimeout = setTimeout(() => {
  //     const zipCode = watch("zipcode");
  //     if (zipCode) {
  //       const payload = { zipcode: zipCode };
  //       callApi({
  //         endPoint: SEARCH_ZIPCODE,
  //         method: METHODS.post,
  //         instanceType: INSTANCE.authorize,
  //         payload: {
  //           zipcode: zipCode || "",
  //         },
  //       })
  //         .then((response) => {
  //           console.log(response, "response");
  //           toastMessages(response.data?.message, "success");
  //           clearErrors("zipcode");
  //         })
  //         .catch((err) => {
  //           console.error("Error validating zip code:", err);
  //           toastMessages(err.response?.data?.message, "error");
  //           setError("zipcode", {
  //             type: "manual",
  //             message: "Please enter a valid zip code.",
  //           });
  //         });
  //     }
  //   }, 700); // 500ms debounce

  //   return () => clearTimeout(debounceTimeout);
  // }, [watch("zipcode")]);

  const handleZipChange = (e) => {
    const numbersOnly = e.target.value.replace(/[^0-9]/g, "");
    if (numbersOnly?.length) {
      setValue("zipcode", numbersOnly, { shouldValidate: true });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        checkZipcode(numbersOnly);
      }, 700); // Increased debounce time to 300ms for better performance
    }
  };

  // const checkZipcode = (zipcode) => {
  //   if (zipcode) {
  //     const payload = { zipcode: zipcode };
  //     callApi({
  //       endPoint: SEARCH_ZIPCODE,
  //       method: METHODS.post,
  //       instanceType: INSTANCE.authorize,
  //       payload: {
  //         zipcode: zipcode || "",
  //       },
  //     })
  //       .then((response) => {
  //         console.log(response, "response");
  //         toastMessages(response.data?.message, "success");
  //         clearErrors("zipcode");
  //       })
  //       .catch((err) => {
  //         console.error("Error validating zip code:", err);
  //         toastMessages(err.response?.data?.message, "error");
  //         setError("zipcode", {
  //           type: "manual",
  //           message: "Please enter a valid zip code.",
  //         });
  //       });
  //   }
  // };

  return (
    <div className=" mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">{T["add_new_address"]}</h2>
      <div
        className="closeicon cursor-pointer float-right mt-[-50px]"
        onClick={onClose}
      >
        {crossIcon}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Address Line 1 */}
        <div>
          <LocationComponent
            label={T["address"]}
            fieldName="address"
            formConfig={formConfig}
            rules={{ required: T["address_required"] }}
            placeholder={T["enter_address"]}
            className="w-full px-4 py-2 border rounded-md"
          />
          {/* <label>State</label>
          <input
            type="text"
            {...register("state", { required: "This field is required" })}
            placeholder="Address Line 1 *"
            className="w-full px-4 py-2 border rounded-md"
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">
              {errors?.address?.message}
            </p>
          )} */}
        </div>

        {/* Address Line 2 (State) */}
        <CommonSelect
          formConfig={formConfig}
          label={T["state"]}
          fieldName="state"
          options={SWEDEN_COUNTY_OPTIONS}
          rules={createRequiredValidation(T["state"])}
          placeholder={T["select_state"]}
          className=" w-full rounded-lg bg-[#F5F5F5]"
        />

        {/* City */}
        <div>
          <label>{T["city"]}</label>
          <input
            type="text"
            {...register("city", { required: T["this_field_is_required"] })}
            placeholder={T["city"]}
            className="w-full px-4 py-2 border rounded-md"
          />
          {errors?.city && (
            <p className="text-red-500 text-sm mt-1">{errors?.city?.message}</p>
          )}
        </div>

        {/* Zipcode */}
        <div>
          <label>{T["zipcode"]}</label>
          <input
            type="text"
            {...register("zipcode", {
              required: T["zip_code_is_required"],
              onChange: (e) => {
                // handleZipChange(e);
                const numbersOnly = e.target.value.replace(/[^0-9]/g, "");
                setValue("zipcode", numbersOnly, { shouldValidate: true });
              },
            })}
            placeholder={T["zipcode"]}
            className="w-full px-4 py-2 border rounded-md"
            maxLength={6}
          />
        </div>

        {/* Primary Address Checkbox */}
        <div className="flex items-center">
          <input type="checkbox" {...register("primary")} className="mr-2" />
          <label className="text-sm">{T["set_as_default_address"]}</label>
        </div>

        {/* Submit Button */}
        <Button
          btnText={isEdit ? T["update"] : T["save"]}
          loader={loader}
          disabled={loader}
          btnType="submit"
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        />
      </form>
    </div>
  );
};

export default NewAddressForm;
