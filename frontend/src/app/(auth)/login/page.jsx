"use client";
import AuthRedirectSection from "@/_components/_common/AuthRedirectSection";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import CommonButton from "@/_components/_common/CommonButton";
import { callApi, login, METHODS } from "@/_Api-Handlers/apiFunctions";
import { useRouter } from "next/navigation";
import { BUTTON_TYPE, DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { requiredValidation } from "@/_validations/validations";
import { CLOSED_EYE, OPEN_EYE } from "../../../../public/images/SvgIcons";
import AuthFormTitleSection from "@/_components/AuthFormTitleSection";
import { INSTANCE, URLS } from "@/app/_constant/UrlConstant";
import { LoginValidations } from "@/_validations/authValidations";
import Cookies from "js-cookie";
import { useDispatch } from "react-redux";
import { setUser } from "@/Redux/userSlice";
import { T } from "@/_utils/LanguageTranslator";

const Login = ({ setShowLoginModal }) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const formConfig = useForm();
  const [loader, setLoader] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { handleSubmit, setValue } = formConfig;
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  useEffect(() => {
    const passwrd = localStorage.getItem("rememberedPassword");
    const email = localStorage.getItem("rememberedEmail");
    setValue("user_name", email);
    setValue("password", passwrd);
    if (passwrd || email) {
      setRememberMe(true);
    }
  }, []);

  const onSubmit = (values) => {
    setLoader(true);
    // login(values)
    callApi({
      endPoint: "/login/",
      method: METHODS.post,
      instanceType: INSTANCE.auth,
      payload: {
        email: values?.user_name,
        password: values?.password,
      },
    })
      .then((res) => {
        console.log(res, "this is response");
        const data = res?.data?.token_data;
        console.log(data, "this is data at jkdfsdk");
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", values.user_name);
          localStorage.setItem("rememberedPassword", values.password);
        } else {
          localStorage.removeItem("rememberedEmail");
          localStorage.removeItem("rememberedPassword");
        }
        const userInfo = {
          token: data?.access || "",
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          email: data?.email || "",
        };
        dispatch(setUser(userInfo));
        localStorage.setItem("token", data?.access);
        localStorage.setItem("user_id", res?.data?.user_id);

        Cookies.set("token", data?.access);
        if (res?.data?.customer_type) {
          localStorage.setItem("customer_type", res?.data?.customer_type);
        }
        localStorage.setItem("refresh_token", data.refresh);
        // setLoader(false);
        if (setShowLoginModal) {
          setShowLoginModal(false);
          if (typeof window !== "undefined") {
            router.push("/");
            window.location.reload();
          }
        }
        router.push("/");
      })
      .catch((err) => {
        toastMessages(
          err?.response?.data?.non_field_errors[0]?.toLowerCase().includes('invalid email') 
            ? T["invalid_email_or_password"] 
            : err?.response?.data?.non_field_errors[0] || DEFAULT_ERROR_MESSAGE
        );
        setLoader(false);
      });
  };
  const handleRememberMe = (e) => {
    const isChecked = e.target.checked;
    setRememberMe(isChecked);
  };
  return (
    <div className="login-form-container">
      <AuthFormTitleSection title={T["login_title"]} />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-5 rounded-none shadow-lg w-full"
      >
        <CommonTextInput
          fieldName={"user_name"}
          formConfig={formConfig}
          type="text"
          placeholder={T["enter_username"]}
          rules={LoginValidations.email}
          label={T["username_or_email_address"]}
        />

        <CommonTextInput
          fieldName="password"
          formConfig={formConfig}
          placeholder={T["enter_password"]}
          rules={LoginValidations.password}
          label={T["your_password"]}
          type={showPassword ? "text" : "password"}
          //   for adding icons
          onIconClick={toggleShowPassword}
          icon={showPassword ? CLOSED_EYE : OPEN_EYE}
        />
        <div className="text-[16px] font-normal ml-1 flex justify-between items-baseline">
          <div className="text-[16px] font-normal ml-1 sm:flex-col">
            <input
              className="form-check-input"
              type="checkbox"
              value=""
              onChange={(e) => handleRememberMe(e)}
              id="flexCheckDefault"
              checked={rememberMe}
            />
            <label
              className="text-[16px] font-normal ml-1"
              htmlFor="flexCheckDefault"
            >
              {T["remember_me"]}
            </label>
          </div>
          <AuthRedirectSection
            text=""
            linkText={T["forgot_your_password"]}
            linkUrl={URLS.FORGET_PASSWORD}
            className="text-right primary-text-color text-[16px] font-normal"
          />
        </div>
        <CommonButton
          type={BUTTON_TYPE.submit}
          className="auth-btn"
          text={T["login_button"]}
          loader={loader}
          disabled={loader}
        />
        <div className="h-[70px] md:h-[20px]"></div>
        <AuthRedirectSection
          text={T["dont_have_account"]}
          linkText={T["sign_up"]}
          linkUrl={URLS.REGISTER}
          className="primary-text-color text-[16px] font-bold text-center"
        />
      </form>
    </div>
  );
};

export default Login;
