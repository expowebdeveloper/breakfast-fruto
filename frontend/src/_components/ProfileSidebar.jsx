"use client";

import { callApi } from "@/_Api-Handlers/apiFunctions";
import { PROFILE_UPDATE, UPDATE_PASSWORD } from "@/_Api-Handlers/APIUrls";
import { profileValidations } from "@/_constants/constant";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import { imagePlaceholder } from "@/_Svgs/Svg";
import { createPreview } from "@/_utils/helpers";
import { toastMessages } from "@/_utils/toastMessage";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { LOCATION_ICON } from "@/Assets/SVGIcons";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CLOSED_EYE, OPEN_EYE } from "../../public/images/SvgIcons";
import ErrorMessage from "./_common/ErrorMessage";
import { T } from "@/_utils/LanguageTranslator";

const ProfileSidebar = ({
  isSidebarOpen,
  toggleSidebar,
  sideBarItems,
  handleChangePassword,
  profileData,
  ordersData,
  sidebarItemId,
  handleProfileData,
}) => {
  const customer_type = localStorage?.getItem("customer_type");
  console.log(customer_type);
  const formConfig = useForm({ mode: "onChange" });
  const {
    handleSubmit,
    watch,
    reset,
    register,
    setValue,
    getValues,
    formState: { errors },
  } = formConfig;
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleShowOldPassword = () => {
    setShowOldPassword((prev) => !prev);
  };

  const toggleShowNewPassword = () => {
    setShowNewPassword((prev) => !prev);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);
  const validateEmailDomain = (email) => {
    const domain = getValues("company_domain");
    if (!domain) {
      return "Company domain is required";
    }
    const emailDomain = email.split("@")[1];
    if (emailDomain !== domain) {
      return `Email domain must match the company domain (${domain})`;
    }
    return true;
  };

  const fetchProfileData = () => {
    callApi({
      endPoint: PROFILE_UPDATE,
      method: "GET",
      instanceType: INSTANCE?.authorize,
    })
      .then((res) => {
        const data = res?.data;
        console.log(data, "prefill logic");
        setValue("first_name", data?.user?.first_name);
        setValue("last_name", data?.user?.last_name);
        setValue("email", data?.user?.email);
        setValue("phone_number", data?.contact_no);
        setValue("name", data?.name);
        setValue("vat_id", data?.vat_id);
        setValue("company_domain", data?.company_domain);
        setValue("organization_no", data?.organization_no);
        setValue("organization_name", data?.organization_name);
      })
      .catch((error) => {
        console.log("Error getting address:", error);
        toastMessages("Something went wrong", "error");
      })
      .finally(() => {});
  };
  const onSubmit = (values) => {
    let updatedData;
    if (sideBarItems === "editProfile") {
      const payload = {
        user: {
          first_name: values?.first_name,
          last_name: values?.last_name,
          email: values?.email,
          contact_no: values?.phone_number,
        },
        // name: values?.name,

        vat_id: values?.vat_id,
        organization_no: values?.organization_no,
        organization_name: values?.organization_name,
      };
      callApi({
        endPoint: PROFILE_UPDATE,
        method: "PATCH",
        instanceType: INSTANCE?.authorize,
        payload: payload,
      })
        .then((res) => {
          updatedData = res?.data?.data;
          toastMessages("Profile updated successfully", "success");
          Cookies.set("firstName", values?.first_name);
          Cookies.set("lastName", values?.last_name);
          handleProfileData();
          fetchProfileData();
        })
        .catch((error) => {
          // const fieldError = error?.response?.data?.error;
          // toastMessages(fieldError, "error");
          toastMessages("Something went wrong", "error");
        });
    } else {
      callApi({
        endPoint: UPDATE_PASSWORD,
        method: "POST",
        instanceType: INSTANCE?.authorize,
        payload: {
          old_password: values.old_password,
          new_password: values.new_password,
          confirm_password: values.confirm_password,
        },
      })
        .then((res) => {
          toastMessages("Password updated successfully", "success");
        })
        .catch((error) => {
          console.error("Error getting address:", error);
          toastMessages(
            error?.response?.data?.error || "Something went wrong",
            "error"
          );
        });
    }
    toggleSidebar();
    reset();
    if (updatedData) {
      setValue("first_name", updatedData?.user?.first_name);
      setValue("last_name", updatedData?.user?.last_name);
      setValue("email", updatedData?.user?.email);
      setValue("phone_number", updatedData?.contact_no);
    } else {
      handleProfileData();
    }
  };

  //   useEffect(() => {
  //   console.log(profileData, "profileData2");

  //     setValue("first_name", profileData?.user?.first_name);
  //     setValue("last_name", profileData?.user?.last_name);
  //     setValue("email", profileData?.user?.email);
  //     setValue("phone_number", profileData?.contact_no);
  //     setValue("vat_id", profileData?.vat_id);
  //   }, [profileData]);

  const currentItem = ordersData?.filter((itm) => itm.id === sidebarItemId);
  console.log(currentItem, "currentItem");

  const handleChangePasswordClick = () => {
    handleChangePassword();
    reset();
  };

  const handleClose = () => {
    toggleSidebar();
    // setValue("first_name", profileData?.user?.first_name);
    // setValue("last_name", profileData?.user?.last_name);
    // setValue("email", profileData?.user?.email);
    // setValue("phone_number", profileData?.contact_no);
  };

  const organizationNo = watch("organization_no");
  const vatId = watch("vat_id");

  const validateVatId = (value) => {
    if (!/^SE\d{12}$/.test(value)) {
      return "VAT ID must start with 'SE' and be exactly 14 characters";
    }

    const orgNo = formConfig.getValues("organization_no");

    if (orgNo && orgNo.length === 10) {
      const vatDigits = value.slice(10, 12); // 11th and 12th characters
      const orgDigits = orgNo.slice(-2); // last 2 of org number

      if (vatDigits !== orgDigits) {
        return "11th and 12th digits of VAT ID must match last two digits of Organization Number";
      }
    }

    return true;
  };

  const validateOrganizationNo = (value) => {
    if (!/^\d{10}$/.test(value)) {
      return "Organization Number must be exactly 10 digits";
    }

    const vatId = formConfig.getValues("vat_id");

    if (vatId && /^SE\d{12}$/.test(vatId)) {
      const vatDigits = vatId.slice(10, 12);
      const orgDigits = value.slice(-2);

      if (vatDigits !== orgDigits) {
        return "Last two digits of Organization Number must match 11th and 12th digits of VAT ID";
      }
    }

    return true;
  };

  return (
    <div
      style={{
        height: "730px",
        overflowX: "auto",
        overflowY: "scroll",
      }}
      className={`fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-lg hide-scrollbar z-50 transform ${
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 z-40`}
    >
      {sideBarItems === "orders" ? (
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
              Order #{currentItem?.[0]?.order_id}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex gap-4 mb-6">
              <div>{LOCATION_ICON}</div>
              <div className="font-medium text-black">Breakfast</div>
            </div>
            <div className="flex gap-4">
              <div>{LOCATION_ICON}</div>
              <div>
                <div>{currentItem?.[0]?.customer_name}</div>
                <div className="text-[#878787]">
                  {currentItem?.[0]?.address}
                </div>
              </div>
            </div>
            <p className="text-gray-500 text-sm ml-10">
              {/* {`${currentItem?.[0]?.shipping_address.address},${currentItem?.[0]?.shipping_address.city}`} */}
              <br />
              {/* {currentItem?.[0]?.shipping_address.state} */}
            </p>
            <div className="ml-10">
              {currentItem?.[0]?.delivery_date ? (
                <>
                  <p className="text-black font-medium mt-2">
                    Delivered on{" "}
                    {moment(currentItem?.[0]?.delivery_date).format(
                      "ddd, MMM DD, YYYY, hh:mm A"
                    )}
                  </p>
                  <span className="inline-block bg-[#E8E4FF] text-[#0003A3] text-xs font-medium px-2 py-1 rounded mt-2">
                    On Time
                  </span>
                </>
              ) : (
                ""
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-black">Order Details</h3>
            <ul className="mt-4 space-y-4">
              {currentItem?.[0]?.items?.map((itm, index) => (
                <li key={index} className="flex items-center">
                  {itm?.product?.product?.images?.find(
                    (ele) => ele?.is_featured === true
                  )?.image ? (
                    <img
                      src={createPreview(
                        itm?.product?.product?.images?.find(
                          (ele) => ele?.is_featured === true
                        )?.image
                      )}
                      alt="Premium Croissant"
                      className="w-12 h-12 rounded mr-4"
                    />
                  ) : (
                    <div className="basket-imagePlaceholder">
                      {imagePlaceholder}
                    </div>
                  )}
                  <div className="flex-grow">
                    <p className="font-medium text-black">
                      {itm?.product?.name}
                    </p>
                    <p className="text-sm text-[#FF6363]">{itm?.price} SEK</p>
                  </div>
                  <p className="font-medium text-black">
                    {Number(itm?.price) * itm?.quantity}.00 SEK
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Item Totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between mb-4">
              <p className="text-black">Items Total</p>
              <p className="text-black">
                {currentItem?.[0]?.total_amount || "0.00"} SEK
              </p>
            </div>
            {/* <div className="flex justify-between text-gray-600">
              <p>Order Packing Charges</p>
              <p>{currentItem?.[0]?.packing_fee || "0.00"} SEK</p>
            </div> */}
            {/* <div className="flex justify-between text-gray-600">
              <p>Platform Fee</p>
              <p>{currentItem?.[0]?.platform_fee || "0.00"} SEK</p>
            </div> */}
            {currentItem?.[0]?.coupon_name && (
              <div className="flex justify-between text-green-600">
                <p>Discount Applied ({currentItem?.[0]?.coupon_name})</p>
                <p>-{currentItem?.[0]?.discounted_amount || "0.00"} SEK</p>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <p>Delivery Fee</p>
              <p>{currentItem?.[0]?.delivery_fees || "0.00"} SEK</p>
            </div>
            <div className="flex justify-between text-gray-600">
              <p>Gift Wrap Price</p>
              <p>{currentItem?.[0]?.gift_wrap_price || "0.00"} SEK</p>
            </div>
            <div className="flex justify-between text-gray-600">
              <p>VAT</p>
              <p>{currentItem?.[0]?.vat_amount || "0.00"} SEK</p>
            </div>
          </div>

          {/* Total Bill */}
          <div className="mt-6 border-t border-black pt-4 flex justify-between">
            <div className="text-black">Paid via Card</div>
            <div className="text-black font-bold">Total Bill</div>
            <div className="text-black font-bold">
              {currentItem?.[0]?.final_amount || "0.00"} SEK
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-4">
            <div className="flex justify-between">
              <button
                className="text-gray-500 hover:text-gray-800"
                onClick={handleClose}
                type="button"
              >
                ✖
              </button>
              <div className="text-lg font-bold text-black">Edit Profile</div>
            </div>
            <div className="mt-4 space-y-6">
              {sideBarItems === "editProfile" ? (
                customer_type === "C" ? (
                  <div>
                    {/* Company fields */}
                    <CommonTextInput
                      formConfig={formConfig}
                      placeholder="Enter First Name"
                      fieldName={"first_name"}
                      rules={profileValidations?.["company_name"]}
                      label="First Name *"
                    />
                    <CommonTextInput
                      formConfig={formConfig}
                      placeholder="Enter Last Name"
                      fieldName={"last_name"}
                      rules={profileValidations?.["last_name"]}
                      label="Last Name *"
                    />
                    <CommonTextInput
                      formConfig={formConfig}
                      placeholder="Enter Company Name"
                      fieldName={"organization_name"}
                      rules={profileValidations?.["company_name"]}
                      label="Company Name *"
                    />
                    <CommonTextInput
                      fieldName="company_domain"
                      formConfig={formConfig}
                      type="text"
                      placeholder="E.g. example.com"
                      rules={{
                        required: "Company domain is required",
                        pattern: {
                          value:
                            /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/,
                          message:
                            "Enter a valid domain name (e.g., example.com)",
                        },
                      }}
                      label="Company Domain Name *"
                    />
                    <CommonTextInput
                      formConfig={formConfig}
                      placeholder="Enter Email"
                      fieldName={"email"}
                      rules={{
                        required: "Company email is required",
                        pattern: {
                          value:
                            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: "Enter a valid email address",
                        },
                        validate: validateEmailDomain,
                      }}
                      label="Company Email Address *"
                    />

                    <CommonTextInput
                      formConfig={formConfig}
                      placeholder="Enter Contact Number"
                      fieldName={"phone_number"}
                      rules={profileValidations?.["phone_number"]}
                      label="Contact Number *"
                      isNumberOnly={true}
                      maxLength={10}
                    />
                    <div>
                      <label className="label">Organization Number *</label>
                      <div className="relative">
                        <input
                          id="organization_no"
                          type="text"
                          maxLength={10}
                          placeholder="E.g. 1234567890"
                          className="px-4 py-3 bg-gray-100 focus:bg-transparent w-full text-sm outline-[#333] rounded-sm transition-all"
                          {...formConfig.register("organization_no", {
                            required: `${T["organization_no_required"]} is required`,
                            validate: validateOrganizationNo,
                            onChange: (e) => {
                              const val = e.target.value;
                              formConfig.setValue("organization_no", val);
                              formConfig.trigger("vat_id"); // trigger vat_id to re-validate
                            },
                          })}
                        />

                        <ErrorMessage
                          errors={errors?.["organization_no"]?.message}
                        />
                      </div>
                    </div>

                    {/* VAT ID Input */}
                    <div>
                      <label className="label">VAT ID *</label>
                      <div className="relative">
                        <input
                          id="vat_id"
                          type="text"
                          maxLength={14}
                          placeholder="E.g. SE123456789012"
                          className="px-4 py-3 bg-gray-100 focus:bg-transparent w-full text-sm outline-[#333] rounded-sm transition-all"
                          {...formConfig.register("vat_id", {
                            required: `${T["vat_id"]} is required`,
                            validate: validateVatId,
                            onChange: (e) => {
                              formConfig.setValue("vat_id", e.target.value);
                            },
                          })}
                        />

                        <ErrorMessage errors={errors?.["vat_id"]?.message} />
                      </div>
                    </div>
                    <div
                      className="text-[#01A933] underline cursor-pointer mt-6"
                      onClick={handleChangePasswordClick}
                    >
                      Change Password
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Individual fields */}
                    <CommonTextInput
                      formConfig={formConfig}
                      placeholder="Enter First Name"
                      fieldName={"first_name"}
                      rules={profileValidations?.["company_name"]}
                      label="First Name *"
                    />
                    <CommonTextInput
                      formConfig={formConfig}
                      placeholder="Enter Last Name"
                      fieldName={"last_name"}
                      rules={profileValidations?.["last_name"]}
                      label="Last Name *"
                    />
                    <CommonTextInput
                      formConfig={formConfig}
                      placeholder="Enter Email"
                      fieldName={"email"}
                      rules={profileValidations?.["company_email"]}
                      label="Email Address *"
                    />
                    <CommonTextInput
                      formConfig={formConfig}
                      placeholder="Enter Contact Number"
                      fieldName={"phone_number"}
                      rules={profileValidations?.["phone_number"]}
                      label="Contact Number *"
                      isNumberOnly={true}
                      maxLength={10}
                    />
                    <div
                      className="text-[#01A933] underline cursor-pointer mt-6"
                      onClick={handleChangePasswordClick}
                    >
                      Change Password
                    </div>
                  </div>
                )
              ) : (
                <div className="mt-4 space-y-6">
                  <CommonTextInput
                    formConfig={formConfig}
                    placeholder="Enter Old Password"
                    fieldName={"old_password"}
                    rules={profileValidations?.["old_password"]}
                    label="Enter Old Password *"
                    type={showOldPassword ? "text" : "password"}
                    onIconClick={toggleShowOldPassword}
                    icon={showOldPassword ? CLOSED_EYE : OPEN_EYE}
                  />
                  <CommonTextInput
                    formConfig={formConfig}
                    placeholder="Enter New Password"
                    fieldName={"new_password"}
                    rules={profileValidations?.["new_password"]}
                    label="Enter New Password *"
                    type={showNewPassword ? "text" : "password"}
                    onIconClick={toggleShowNewPassword}
                    icon={showNewPassword ? CLOSED_EYE : OPEN_EYE}
                  />
                  <CommonTextInput
                    formConfig={formConfig}
                    placeholder="Confirm New Password"
                    fieldName={"confirm_password"}
                    rules={profileValidations?.["confirm_password"]}
                    label="Confirm New Password *"
                    type={showConfirmPassword ? "text" : "password"}
                    onIconClick={toggleShowConfirmPassword}
                    icon={showConfirmPassword ? CLOSED_EYE : OPEN_EYE}
                  />
                </div>
              )}

              <div className="flex justify-center mt-20">
                <button
                  className="bg-[#01A933] text-white py-2 px-4 rounded-md"
                  type="submit"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfileSidebar;
