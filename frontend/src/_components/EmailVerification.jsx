import React from "react";
import CommonButton from "./_common/CommonButton";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import { BUTTON_TYPE } from "@/_constants/constant";
import AuthRedirectSection from "./_common/AuthRedirectSection";
import { URLS } from "@/app/_constant/UrlConstant";
import { T } from "@/_utils/LanguageTranslator";

const EmailVerification = ({
  onSubmit,
  formConfig,
  loader,
  signupType,
  setSignupType,
}) => {
  const { handleSubmit, setValue, clearErrors, getValues } = formConfig;

  // Custom validation function for email
  const validateEmailDomain = (email) => {
    if (signupType === "company") {
      const domain = getValues("company_domain");
      if (!domain) {
        return T["company_domain_required"];
      }
      const emailDomain = email.split("@")[1];
      if (emailDomain !== domain) {
        return `${T["email_domain_mismatch"]} (${domain})`;
      }
    }
    return true;
  };

  return (
    <div className="w-full">
      <form
        className="bg-white p-5 rounded-none shadow-lg w-full"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="">
          <label htmlFor="signupType" className="label">
            {T["signup_as"]}
          </label>
          <select
            id="signupType"
            value={signupType}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "individual") {
                setValue("company_domain", "");
              }
              clearErrors();
              setValue("email", "");
              setSignupType(value);
            }}
            className="px-4 py-3 bg-gray-100 focus:bg-transparent w-full text-sm outline-[#333] rounded-sm transition-all mb-2"
          >
            <option value="individual">{T["individual"]}</option>
            <option value="company">{T["company"]}</option>
          </select>
        </div>
        {signupType === "company" && (
          <CommonTextInput
            fieldName="company_domain"
            formConfig={formConfig}
            type="text"
            placeholder="E.g. example.com"
            rules={{
              required: T["company_domain_required"],
              pattern: {
                value: /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/,
                message: T["valid_domain_name_message"],
              },
            }}
            label={T["company_domain_name"]}
          />
        )}

        <CommonTextInput
          fieldName="email"
          formConfig={formConfig}
          type="text"
          placeholder={
            signupType === "company"
              ? T["enter_your_company_email"]
              : T["enter_your_email"]
          }
          rules={{
            required:
              signupType === "individual"
                ? T["email_required"]
                : T["company_email_required"],
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: T["invalid_email_message"],
            },
            validate: validateEmailDomain,
          }}
          label={
            signupType === "company" ? T["company_email"] : T["email_address"]
          }
        />

        <CommonButton
          type={BUTTON_TYPE.submit}
          className="auth-btn"
          text={T["verify_your_email"]}
          loader={loader}
          disabled={loader}
        />
        <AuthRedirectSection
          text={T["already_have_account_question"]}
          linkText={T["login_here"]}
          linkUrl={URLS.LOGIN}
          className="primary-text-color text-[16px] font-bold text-center mt-2"
        />
      </form>
    </div>
  );
};

export default EmailVerification;
