"use client";

import { callApi } from "@/_Api-Handlers/apiFunctions";
import { ADDRESS } from "@/_Api-Handlers/APIUrls";
import CommonSelect from "@/_components/CommonSelect";
import LocationField from "@/_components/LocationField";
import NewAddressForm from "@/_components/NewAddressForm";
import Pagination from "@/_components/Pagination";
import { SWEDEN_COUNTY_OPTIONS } from "@/_constants/constant";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import { crossIcon } from "@/_Svgs/Svg";
import { createRequiredValidation, returnAddressInfo } from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import { toastMessages } from "@/_utils/toastMessage";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { LOCATION_ICON } from "@/Assets/SVGIcons";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

// import React, { useEffect, useState } from "react";
// import CommonTextInput from "@/_form-fields/CommonTextInput";
// import { useForm } from "react-hook-form";
// import { SWEDEN_COUNTY_OPTIONS } from "@/_constants/constant";
// import { LOCATION_ICON } from "@/Assets/SVGIcons";
// import LocationField from "@/_components/LocationField";
// import { ADDRESS, CHECK_ZIP } from "@/_Api-Handlers/APIUrls";
// import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
// import { INSTANCE } from "@/app/_constant/UrlConstant";
// import CommonSelect from "@/_components/CommonSelect";
// import Pagination from "@/_components/Pagination";
// import { crossIcon } from "@/_Svgs/Svg";
// import { toastMessages } from "@/_utils/toastMessage";

const Address = ({ handleDeleteAddress }) => {
  const [addresses, setAddresses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    getAddress();
  }, [currentPage]);
  const getAddress = () => {
    callApi({
      endPoint: ADDRESS,
      method: "GET",
      instanceType: INSTANCE?.authorize,
    })
      .then((res) => {
        setAddresses(res?.data?.results || []);
        setTotalCount(res?.data?.total_count || 0);
      })
      .catch((error) => {
        console.error("Error getting address:", error);
      });
  };

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editID, setEditID] = useState();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [editInfo, setEditInfo] = useState({
    isEdit: false,
    editItem: null,
  });

  const formConfig = useForm();
  const {
    handleSubmit,
    watch,
    register,
    setValue,
    reset,
    setError,
    clearErrors,
  } = formConfig;

  const watchedAddress = watch("address");
  // commented for future use
  // const onSubmit = (values) => {
  //   const addressInfo = {
  //     city: "",
  //     state: "",
  //   };
  //   if (isEdit && !values?.address?.address_components) {
  //     addressInfo.state = watch("state");
  //     addressInfo.city = watch("city");
  //   } else {
  //     const { state, city, country } = returnAddressInfo(
  //       values?.address?.address_components
  //     );
  //     addressInfo.state = state;
  //     addressInfo.city = city;
  //   }
  //   const payload = {
  //     name: values?.name,
  //     email: values?.email,
  //     contact_no: values?.phone_number,
  //     address: values?.address?.formatted_address || values?.address,
  //     // city: values?.city?.formatted_address ||values?.city,
  //     city: values?.city?.formatted_address || values?.city,
  //     state: values?.state?.value || values?.state,
  //     // city: addressInfo.city,
  //     // state: getState(addressInfo?.state),
  //     zipcode: values?.zip_code,
  //     // "country": "SE",
  //     primary: false,
  //   };

  //   callApi({
  //     endPoint: isEdit ? `${ADDRESS}${editID}/` : ADDRESS,
  //     method: isEdit ? "PATCH" : "POST",
  //     instanceType: INSTANCE?.authorize,
  //     payload: payload,
  //   })
  //     .then((res) => {
  //       toastMessages(
  //         ` Address ${isEdit ? "updated" : "created"} successfully`,
  //         "success"
  //       );
  //       getAddress();
  //       reset();
  //       setShowAddressForm(false);
  //     })
  //     .catch((error) => {
  //       console.error("Error adding to cart:", error);
  //       toastMessages(
  //         error?.response?.data?.error || "Something went wrong",
  //         "error"
  //       );
  //     });
  // };

  useEffect(() => {
    if (watchedAddress?.address_components) {
      const { state, city } = returnAddressInfo(
        watchedAddress.address_components
      );
      // setValue("state", { label: state, value: state });
      // setValue("city", city);
    }
  }, [watchedAddress, setValue]);

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      const zipCode = watch("zip_code");
      if (zipCode) {
        const payload = { zipcode: zipCode };
        callApi({
          endPoint: CHECK_ZIP,
          method: METHODS.post,
          payload: payload,
        })
          .then((response) => {
            toastMessages(response.data?.delivery_message, "success");
            clearErrors("zip_code");
          })
          .catch((err) => {
            console.error("Error validating zip code:", err);
            toastMessages(err.response?.data?.message, "error");
            setError("zip_code", {
              type: "manual",
              message: "Please enter a valid zip code.",
            });
          });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimeout);
  }, [watch("zip_code")]);
  console.log(editInfo?.isEdit, "isEdit");

  useEffect(() => {
    if (editInfo?.isEdit) {
      callApi({
        endPoint: ADDRESS,
        method: "GET",
        instanceType: INSTANCE?.authorize,
      })
        .then((res) => {
          const primaryAddress = res?.data?.results.find(
            // (address) => address.primary === true
            (address) => address.id === editID
          );
          if (primaryAddress) {
            setValue("name", primaryAddress.name);
            setValue("phone_number", primaryAddress.contact_no);
            setValue("email", primaryAddress.email);
            setValue("city", primaryAddress.city);
            setValue("state", {
              label: primaryAddress.state,
              value: primaryAddress.state,
            });
            setValue("zip_code", primaryAddress.zipcode);
            setValue("address", primaryAddress.address);
          } else {
            console.log("Primary address not found");
          }
        })
        .catch((error) => {
          console.error("Error adding to cart:", error);
        });
    }
  }, [editInfo?.isEdit, showAddressForm]);

  const handleDelete = (id) => {
    setSelectedAddressId(id);
    setShowConfirmationModal(true);
  };

  const confirmDelete = () => {
    callApi({
      endPoint: `${ADDRESS}${selectedAddressId}/`,
      method: "DELETE",
      instanceType: INSTANCE?.authorize,
    })
      .then((res) => {
        toastMessages(T["address_deleted_successfully"], "success");
        handleDeleteAddress(selectedAddressId);
        getAddress();
      })
      .catch((error) => {
        console.error("Error getting address:", error);
        toastMessages("Something went wrong", "error");
      });
    setShowConfirmationModal(false);
  };

  // const handleMakeDefault = (id) => {
  //   console.log(`Make card with id: ${id} default`);
  // };

  const handleEdit = (id) => {
    setIsEdit(true);
    setShowAddressForm(true);
    setEditID(id);
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
      // method: editInfo?.isEdit ? "PUT" : "POST",
      // update it once fixed from the backend
      method: editInfo?.isEdit ? "POST" : "POST",
      instanceType: INSTANCE?.authorize,
      payload: payload,
    })
      .then((res) => {
        console.log(res, "this is res");
        toastMessages(
          res?.data?.message ||
            (editInfo?.isEdit
              ? T["address_updated_successfully"]
              : T["address_added_successfully"]),
          "success"
        );

        setShowAddressForm(false);
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
  return (
    <>
      {showAddressForm ? (
        <div className="p-6 w-full">
          <NewAddressForm
            formConfig={formConfig}
            onSubmit={onSubmit}
            loader={buttonLoader}
            editInfo={editInfo}
            onClose={() => {
              setShowAddressForm(false);
              formConfig.reset();
            }}
          />
          {/* <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <CommonTextInput
                fieldName="city"
                formConfig={formConfig}
                placeholder="Enter City"
                label="City *"
              />
              <CommonTextInput
                formConfig={formConfig}
                placeholder="Enter State"
                fieldName={"state"}
                rules={BillingDetailsValidations?.["state"]}
                label="State"
              />
              <CommonSelect
                formConfig={formConfig}
                label="State *"
                selectType="react-select"
                placeholder="Select State"
                options={SWEDEN_COUNTY_OPTIONS}
                fieldName="state"
                // rules={BillingDetailsValidations["state"]}
                // className="add-edit-input"
              />
              <CommonTextInput
                formConfig={formConfig}
                placeholder="Enter Zip Code"
                fieldName={"zip_code"}
                // rules={BillingDetailsValidations?.["zip_code"]}
                label="Zipcode *"
                isNumberOnly={true}
                maxLength={6}
              />
            </div>
            <button
              className="bg-[#FF6D2F] text-white py-2 px-4 rounded-md mt-4"
              type="submit"
            >
              submit{" "}
            </button>
          </form> */}
        </div>
      ) : (
        <div className="p-6 w-full">
          <button
            className="mb-2 bg-gradient-to-r from-[#92C64E] to-[#4BAF50] text-white py-2 px-4 rounded-md"
            onClick={() => setShowAddressForm(true)}
          >
            {T["add_address"]}
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {addresses?.length > 0 ? (
              addresses?.map((card, index) => (
                <div
                  key={index}
                  className="border border-gray-300 rounded-lg p-4 shadow-md flex gap-4 bg-white relative"
                >
                  {card?.primary && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      {T["default"]}
                    </div>
                  )}

                  <div className="bg-gray-300 p-2 w-min h-min shrink-0">
                    {LOCATION_ICON}
                  </div>

                  <div className="flex flex-col justify-between flex-1 gap-4 min-w-0">
                    <div className="text-black text-sm break-words">{`${card.address}, ${card.city}, ${card.state}`}</div>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-4">
                        <div
                          className="text-green-600 text-sm cursor-pointer hover:text-green-700"
                          onClick={() => {
                            setEditInfo({
                              isEdit: true,
                              editItem: card,
                            });
                            setShowAddressForm(true);
                          }}
                        >
                          {T["edit"]}
                        </div>
                        <div
                          className="text-gray-400 text-sm cursor-pointer hover:text-gray-600"
                          onClick={() => handleDelete(card.id)}
                        >
                          {T["delete"]}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center">{T["no_saved_addresses"]}</div>
            )}
            <div className="col-span-full">
              <Pagination
                totalData={totalCount}
                itemsPerPage={10}
                currentPage={currentPage}
                onPageChange={(page) => onPageChange(page, setCurrentPage)}
              />
            </div>
          </div>
        </div>
      )}

      {showConfirmationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                  <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">{T["confirm_deletion"]}</h3>
          <p>{T["are_you_sure_delete_address"]}</p>
          <div className="flex gap-4 mt-4">
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-md"
              onClick={confirmDelete}
            >
              {T["confirm"]}
            </button>
            <button
              className="px-4 py-2 bg-gray-300 rounded-md"
              onClick={() => setShowConfirmationModal(false)}
            >
              {T["cancel"]}
            </button>
          </div>
        </div>
        </div>
      )}
    </>
  );
};

export default Address;
