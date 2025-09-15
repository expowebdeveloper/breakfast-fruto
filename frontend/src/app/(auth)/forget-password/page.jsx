"use client";
import AuthRedirectSection from "@/_components/_common/AuthRedirectSection";
import CommonButton from "@/_components/_common/CommonButton";
import AuthFormTitleSection from "@/_components/AuthFormTitleSection";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import { requiredValidation } from "@/_validations/validations";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { CLOSED_EYE, OPEN_EYE } from "../../../../public/images/SvgIcons";
import { INSTANCE, URLS } from "@/app/_constant/UrlConstant";
import { FORGOT_PASSWORD_STEP } from "../_constant";
import VerifyOtp from "@/_components/VerifyOtp";
import ChangePasswordForm from "@/_components/ChangePasswordForm";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import { T } from "@/_utils/LanguageTranslator";

const Page = () => {
  const router = useRouter();
  const formConfig = useForm();
  const { handleSubmit } = formConfig;
  const [loader, setLoader] = useState();
  const [payloadValues, setPayloadValues] = useState();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStep, setSelectedStep] = useState(
    FORGOT_PASSWORD_STEP.FORGOT_PASSWORD
  );
  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };
  const onSubmit = (values) => {
    setLoader(true);
    setPayloadValues(values);
    if (selectedStep === FORGOT_PASSWORD_STEP.FORGOT_PASSWORD) {
      callApi({
        endPoint: "/password/forget/",
        method: METHODS.post,
        instanceType: INSTANCE.auth,
        payload: values,
      })
        .then((res) => {
          toastMessages(res.data.message, successType);
          setSelectedStep(FORGOT_PASSWORD_STEP.OTP);
          setLoader(false);
        })
        .catch((err) => {
          console.log(err, "error");
          setLoader(false);
          toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
        });
    }
  };

  const handleSubmitOTP = (otp) => {
    setLoader(true);
    if (selectedStep === FORGOT_PASSWORD_STEP.OTP) {
      callApi({
        endPoint: "/password/otp-reset/",
        method: METHODS.post,
        instanceType: INSTANCE.auth,
        payload: {
          otp: otp,
          email: payloadValues.email,
        },
      })
        .then((res) => {
          toastMessages(res.data.message, successType);
          setSelectedStep(FORGOT_PASSWORD_STEP.CHANGE_PASSWORD);
          setLoader(false);
        })
        .catch((err) => {
          console.log(err, "error");
          setLoader(false);
          toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
        });
    }
  };

  const getTitleSubTitle = () => {
    switch (selectedStep) {
      case FORGOT_PASSWORD_STEP.FORGOT_PASSWORD:
        return {
          title: T["forgot_password"],
          sub_title: T["enter_email_for_reset_password"],
        };
      case FORGOT_PASSWORD_STEP.CHANGE_PASSWORD:
        return {
          title: T["reset_password"],
          sub_title: T["reset_your_password"],
        };
      case FORGOT_PASSWORD_STEP.OTP:
        return {
          title: T["verify_code"],
          sub_title: T["verify_code_sent_to_email"],
        };
    }
  };
  return (
    <div className="login-form-container">
      <AuthFormTitleSection
        title={getTitleSubTitle().title}
        subTitle={getTitleSubTitle().sub_title}
      />
      <div className="bg-white p-5 rounded-none shadow-lg w-full">
        {selectedStep === FORGOT_PASSWORD_STEP.FORGOT_PASSWORD && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CommonTextInput
              fieldName="email"
              formConfig={formConfig}
              type="text"
              placeholder={T["email_placeholder_example"]}
              rules={requiredValidation["email"]}
              label={T["email"]}
            />
            <CommonButton
              type="submit"
              text={T["login_button"]}
              loader={loader}
              disabled={loader}
            />
            <div className="h-[70px] md:h-[20px]"></div>
            <div className="flex primary-text-color">
              <AuthRedirectSection
                linkText={T["remember_password_login"]}
                linkUrl={URLS.LOGIN}
                className="primary-text-color text-[16px] font-bold text-center"
              />
            </div>
          </form>
        )}
        {selectedStep === FORGOT_PASSWORD_STEP.OTP && (
          <VerifyOtp
            handleSubmitOTP={handleSubmitOTP}
            loader={loader}
            payloadValues={payloadValues}
          />
        )}
        {selectedStep === FORGOT_PASSWORD_STEP.CHANGE_PASSWORD && (
          <ChangePasswordForm payloadValues={payloadValues} />
        )}
      </div>
    </div>
  );
};

export default Page;
