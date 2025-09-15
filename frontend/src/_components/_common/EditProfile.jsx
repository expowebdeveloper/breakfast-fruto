"use client";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import CommonButton from "./CommonButton";
import { requiredValidation } from "@/_validations/validations";
import PasswordInputField from "./PasswordInputField";
import { PASSWORD_REGEX } from "@/_validations/authValidations";
import { PASSWORD_PATTEN_ERROR } from "@/app/_constant/ErrorMessagesConstant";
import { CLOSED_EYE, OPEN_EYE } from "../../../public/images/SvgIcons";
import { BUTTON_TYPE, DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { CHANGE_PASSWORD, UPDATE_PROFILE } from "@/_Api-Handlers/APIUrls";
import { INSTANCE } from "@/app/_constant/UrlConstant";

function EditProfile({ isSidebarOpen, toggleSidebar, user }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loader, setLoader] = useState(false);
  const formConfig = useForm();
  const {
    setValue,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    register,
    formState: { errors },
  } = formConfig;
  const [showPass, setShowPass] = useState({
    old_password: false,
    password: false,
    confirm_password: false,
  });

  useEffect(() => {
    setValue("first_name", user?.first_name);
    setValue("last_name", user?.last_name);
    setValue("email", user?.email);
    setValue("phone_no", user?.phone_number);
  }, [user]);

  const handleToglePassword = (type) => {
    setShowPass({ ...showPass, [type]: !showPass?.[type] });
  };

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleChangePassword = (value, type) => {
    const password = watch("password");
    const confirmPassword = watch("confirm_password");
    if (type === "password" && password !== undefined) {
      if (value === confirmPassword) {
        if (confirmPassword.length) {
          clearErrors("confirm_password");
        }
      } else {
        if (confirmPassword?.length) {
          setError("confirm_password", {
            type: "manual",
            message: "password and confirm password must match",
          });
        }
      }
    }
  };
  const onSubmit = (data) => {
    setLoader(true);
    if (showPassword) {
      callApi({
        endPoint: CHANGE_PASSWORD,
        method: METHODS.post,
        instanceType: INSTANCE.authorize,
        payload: {
          old_password: data.old_password,
          new_password: data.password,
          confirm_password: data.confirm_password,
        },
      })
        .then((res) => {
          toastMessages(res.data.message, successType);
          setLoader(false);
          toggleSidebar();
        })
        .catch((err) => {
          setLoader(false);
          toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
        });
    } else {
      callApi({
        endPoint: UPDATE_PROFILE,
        method: METHODS.put,
        instanceType: INSTANCE.authorize,
        payload: {
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone_number: data.phone_no,
        },
      })
        .then((res) => {
          toastMessages(res.data.message, successType);
          setLoader(false);
          toggleSidebar();
        })
        .catch((err) => {
          setLoader(false);
          toggleSidebar();
          toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
        });
    }
  };
  return (
    <div
      className={`fixed top-0 right-0 w-full max-w-md h-screen bg-white shadow-lg  z-50 transform ${
        isSidebarOpen ? "translate-x-0" : "translate-x-full"
      } transition-transform duration-300 z-40`}
    >
      {!showPassword ? (
        <button
          className="text-gray-500 hover:text-gray-800"
          onClick={toggleSidebar}
        >
          ✖
        </button>
      ) : (
        <button
          className="w-10 h-10 rounded-lg border-2 border-green-600 flex items-center justify-center text-green-600 hover:bg-green-600 hover:text-white transition-colors duration-200"
          onClick={() => setShowPassword(false)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}
      <div className="p-4 flex flex-col ">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col ">
            <div className="flex-grow justify-end h-screen">
              {!showPassword ? (
                <>
                  <CommonTextInput
                    fieldName="first_name"
                    formConfig={formConfig}
                    type="text"
                    placeholder="Eg. John "
                    rules={requiredValidation["first_name"]}
                    label="First Name*"
                  />
                  <CommonTextInput
                    fieldName="last_name"
                    formConfig={formConfig}
                    type="text"
                    placeholder="Eg. Doe"
                    rules={requiredValidation["last_name"]}
                    label="Last Name*"
                  />
                  <CommonTextInput
                    fieldName="email"
                    formConfig={formConfig}
                    type="text"
                    placeholder="E.g. johndeo@yopmail.com"
                    rules={requiredValidation["email"]}
                    label="Email*"
                  />
                  <CommonTextInput
                    fieldName="phone_no"
                    formConfig={formConfig}
                    type="text"
                    placeholder="E.g. 4634567890"
                    rules={requiredValidation["phone_no"]}
                    label="Phone Number*"
                    isNumberOnly={true}
                  />
                  <span
                    className="text-sm text-green-500 underline"
                    onClick={handleShowPassword}
                  >
                    Change Password
                  </span>
                </>
              ) : (
                <>
                  <div className="label">Enter Old Password</div>
                  <PasswordInputField
                    register={register("old_password", {
                      ...requiredValidation["old_password"],
                      pattern: {
                        value: PASSWORD_REGEX,
                        message: PASSWORD_PATTEN_ERROR,
                      },
                      onChange: (e) => {
                        handleChangePassword(e.target.value, "old_password");
                        setValue("old_password", e.target.value);
                      },
                    })}
                    type={showPass?.old_password ? "text" : "password"}
                    placeholder={"Enter your password"}
                    toggleType={() => handleToglePassword("old_password")}
                    icon={showPass?.old_password ? CLOSED_EYE : OPEN_EYE}
                    errors={errors?.["old_password"]?.message}
                  />
                  <div className="label">Enter New Password</div>
                  <PasswordInputField
                    register={register("password", {
                      ...requiredValidation["password"],
                      pattern: {
                        value: PASSWORD_REGEX,
                        message: PASSWORD_PATTEN_ERROR,
                      },
                      onChange: (e) => {
                        handleChangePassword(e.target.value, "password");
                        setValue("password", e.target.value);
                      },
                    })}
                    type={showPass?.password ? "text" : "password"}
                    placeholder={"Enter your password"}
                    toggleType={() => handleToglePassword("password")}
                    icon={showPass?.password ? CLOSED_EYE : OPEN_EYE}
                    errors={errors?.["password"]?.message}
                  />
                  {/* confirm password */}
                  <div className="label">Confirm New Password</div>
                  <PasswordInputField
                    register={register("confirm_password", {
                      ...requiredValidation["confirm_password"],
                      validate: (value) =>
                        value === watch("password") ||
                        "Password and confirm password must match",
                      onChange: (e) => {
                        handleChangePassword(
                          e.target.value,
                          "confirm_password"
                        );
                        setValue("confirm_password", e.target.value);
                      },
                    })}
                    type={showPass?.confirm_password ? "text" : "password"}
                    placeholder={"Confirm your password"}
                    toggleType={() => handleToglePassword("confirm_password")}
                    icon={showPass?.confirm_password ? CLOSED_EYE : OPEN_EYE}
                    errors={errors?.["confirm_password"]?.message}
                  />
                </>
              )}
              <CommonButton
                type={BUTTON_TYPE.submit}
                text="Submit"
                loader={loader}
                disabled={loader}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
