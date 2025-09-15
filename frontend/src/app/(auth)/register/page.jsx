"use client";
import AuthRedirectSection from "@/_components/_common/AuthRedirectSection";
import CommonButton from "@/_components/_common/CommonButton";
import AuthFormTitleSection from "@/_components/AuthFormTitleSection";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import { requiredValidation } from "@/_validations/validations";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { CLOSED_EYE, OPEN_EYE } from "../../../../public/images/SvgIcons";
import { INSTANCE, URLS } from "@/app/_constant/UrlConstant";
import {
  callApi,
  METHODS,
  verifyEmail,
  verifyEmailOTP,
} from "@/_Api-Handlers/apiFunctions";
import { BUTTON_TYPE, DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import { successType, toastMessages } from "@/_utils/toastMessage";
import PasswordInputField from "@/_components/_common/PasswordInputField";
import { PASSWORD_REGEX } from "@/_validations/authValidations";
import { PASSWORD_PATTEN_ERROR } from "@/app/_constant/ErrorMessagesConstant";
import EmailVerification from "@/_components/EmailVerification";
import OtpSection from "@/_components/OtpSection";
import { T } from "@/_utils/LanguageTranslator";
import { createRequiredValidation, getState } from "@/_utils/helpers";
import LocationComponent from "@/_components/LocationComponent";
import ErrorMessage from "@/_components/_common/ErrorMessage";
import Link from "next/link";

const Page = () => {
  const formConfig = useForm({
    mode: "onChange",
  });
  const router = useRouter();
  const [loader, setLoader] = useState();
  const [signupType, setSignupType] = useState("company");
  const {
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    register,
    setError,
    formState: { errors },
  } = formConfig;
  const [showPass, setShowPass] = useState({
    password: false,
    confirm_password: false,
  });
  const [formDetails, setFormDetails] = useState();
  const [verifyMessage, setVerifyMessage] = useState(false);
  const [step, setStep] = useState("");
  const searchParams = useSearchParams();
  const key = searchParams.get("id");
  const [passwordUpdatePayload, setPasswordUpdatePayload] = useState({
    otp: "",
    email: "",
  });
  console.log(errors, "these are errors");

  useEffect(() => {
    if (formDetails) {
      setValue("email", formDetails?.email);
      setValue("first_name", formDetails.first_name);
      setValue("last_name", formDetails.last_name);
    }
  }, [formDetails]);

  useEffect(() => {
    if (key) {
      callApi({
        endPoint: `/register/${key}/`,
        method: METHODS.get,
        instanceType: INSTANCE.auth,
      })
        .then((res) => {
          setFormDetails(res.data.data);
        })
        .catch((err) => {
          toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
        });
    }
  }, [key]);

  const handleChangePassword = (value, type) => {
    const password = watch("password");
    const confirmPassword = watch("confirm_password");
    if (type === "password" && password?.length && confirmPassword?.length) {
      if (value === confirmPassword) {
        clearErrors("confirm_password");
      } else {
        setError("confirm_password", {
          type: "manual",
          message: T["password_confirm_password_mismatch"],
        });
      }
    }
  };

  const handleToglePassword = (type) => {
    setShowPass({ ...showPass, [type]: !showPass?.[type] });
  };

  const onSubmit = (values) => {
    console.log(values, "these are values");
    setLoader((prev) => true);
    let payload;
    const addressFields = {
      state: values?.state,
      city: values?.city,
      state: getState(values?.state?.value),
      address: values?.address,
      country: "SE",
      zipcode: +values?.zipcode,
    };
    if (signupType === "individual") {
      payload = {
        contact_no: values.phone_no,
        customer_type: "I",
        // name: values?.company_name,
        ...addressFields,
        user: {
          first_name: values.first_name,
          last_name: values.last_name,
          email: passwordUpdatePayload?.email || watch("email"),
          password: values?.password,
          role: "customer",
        },
      };
    } else {
      payload = {
        contact_no: values.phone_no,
        name: values?.name,
        organization_no: values?.organization_no,
        vat_id: values?.vat_id,
        company_domain: values?.company_domain,
        customer_type: "C",
        ...addressFields,
        user: {
          // name: values?.name,
          first_name: values.first_name,
          last_name: values.last_name,
          email: passwordUpdatePayload?.email || watch("email"),
          password: values?.password,
          role: "customer",
        },
      };
    }
    console.log(payload, "payload");
    callApi({
      endPoint: `/bakery/register/`,
      method: METHODS.post,
      instanceType: INSTANCE.auth,
      payload: payload,
    })
      .then((res) => {
        console.log(res, "ressdasdas");
        toastMessages(T["user_registered_successfully"], successType);
        router.push("/login");
      })
      .catch((err) => {
        console.log(err, "ersadsadsar");
        const error = err?.response?.data;
        const fieldError =
          error?.contact_no?.[0] ||
          error?.name?.[0] ||
          error?.user?.email?.[0] ||
          error?.organization_no?.[0] ||
          error?.vat_id?.[0] ||
          error?.error;
        setLoader(false);
        toastMessages(fieldError || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setLoader((prev) => false);
      });
  };
  const handleVerify = (values) => {
    setPasswordUpdatePayload({
      ...passwordUpdatePayload,
      email: values?.email,
    });
    const { email } = values;
    let payload;
    if (signupType === "individual") {
      payload = {
        email: email,
        customer_type: "I",
      };
    } else {
      payload = {
        email: email,
        customer_type: "C",
        company_domain: watch("company_domain"),
      };
    }
    setLoader((prev) => true);
    verifyEmail(payload)
      .then((res) => {
        setStep("otp");
        toastMessages(
          T["verification_email_sent_successfully"],
          successType
        );
      })
      .catch((err) => {
        console.log(err, "this is err");
        toastMessages(
          err?.response?.data?.message?.toLowerCase().includes('email already exists')
            ? T["email_already_exists"] 
            : err?.response?.data?.message || DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        setLoader((prev) => false);
      });
  };

  const handleSubmitOTP = (otp) => {
    setPasswordUpdatePayload({ ...passwordUpdatePayload, otp: otp });

    const payload = {
      otp: otp,
      email: passwordUpdatePayload?.email,
    };
    setLoader((prev) => true);
    verifyEmailOTP(payload)
      .then((res) => {
        toastMessages(T["otp_verified_successfully"], successType);
        setStep("signup-form");
        setValue("email", passwordUpdatePayload?.email);
      })
      .catch((err) => {
        console.log(err, "errerrerrerr");
        // update required: add invalid otp message according to the api response
        toastMessages(
          err?.response?.data?.message?.toLowerCase().includes('otp did not matched') 
            ? T["otp_did_not_match"]
            : err?.response?.data?.message || DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        setLoader((prev) => false);
      });
  };

  const organizationNo = watch("organization_no");
  const vatId = watch("vat_id");

  // // Custom validation for organization_no
  // const validateOrganizationNo = (value) => {
  //   // Ensure the number is exactly 10 digits
  //   if (!/^\d{10}$/.test(value)) {
  //     return "Organization number must be exactly 10 digits";
  //   }

  //   // Check if the last two digits match the vat_id (if vat_id is provided)
  //   if (vatId && vatId.length >= 14 && value.slice(-2) !== vatId.slice(-2)) {
  //     return "Last two digits must match VAT ID";
  //   }

  //   return true;
  // };

  const validateOrganizationNo = (value) => {
    if (!/^\d{10}$/.test(value)) {
      return T["organization_number_exact_digits"];
    }

    if (
      vatId &&
      vatId.length === 14 &&
      value.slice(-2) !== vatId.slice(10, 12) // match 11th and 12th digits (0-based index)
    ) {
      return T["vat_id_org_number_match"];
    }

    return true;
  };

  // // Custom validation for vat_id
  // const validateVatId = (value) => {
  //   // Ensure VAT ID starts with 'SE' and is 14 characters long
  //   if (!/^SE\d{12}$/.test(value)) {
  //     return "VAT ID must start with 'SE' and be exactly 14 characters";
  //   }

  //   // Check if the last two digits match the organization_no (if organization_no is provided)
  //   if (
  //     organizationNo &&
  //     organizationNo.length === 10 &&
  //     value.slice(-2) !== organizationNo.slice(-2)
  //   ) {
  //     return "Last two digits must match Organization Number";
  //   }

  //   return true;
  // };

  const validateVatId = (value) => {
    if (!/^SE\d{12}$/.test(value)) {
      return T["vat_id_format_validation"];
    }

    if (
      organizationNo &&
      organizationNo.length === 10 &&
      value.slice(10, 12) !== organizationNo.slice(-2) // match 11th and 12th digits
    ) {
      return T["vat_id_org_number_match"];
    }

    return true;
  };

  return (
    <div className="login-form-container">
      <AuthFormTitleSection title={T["sign_up_title"]} />
      {step !== "signup-form" && step !== "otp" && (
        <>
          <EmailVerification
            onSubmit={handleVerify}
            formConfig={formConfig}
            loader={loader}
            setSignupType={setSignupType}
            signupType={signupType}
          />
        </>
      )}
      {step === "otp" && (
        <OtpSection handleSubmitOTP={handleSubmitOTP} loader={loader} />
      )}
      {step === "signup-form" && (
        <>
          {/* <div className="tab-headers">
            <button
              className={activeTab === "individual" ? "active" : ""}
              onClick={() => setActiveTab("individual")}
            >
              {T["indivisual_signup"]}{" "}
            </button>
            <button
              className={activeTab === "company" ? "active" : ""}
              onClick={() => setActiveTab("company")}
            >
              {T["company_signup"]}{" "}
            </button>
          </div> */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-5 rounded-none shadow-lg w-full"
          >
            {signupType === "individual" && (
              <>
                <CommonTextInput
                  fieldName={"first_name"}
                  formConfig={formConfig}
                  type="text"
                  placeholder={"E.g. John"}
                  rules={requiredValidation.first_name}
                  label={T["first_name"]}
                />
                <CommonTextInput
                  fieldName={"last_name"}
                  formConfig={formConfig}
                  type="text"
                  placeholder={"E.g. Doe"}
                  rules={requiredValidation.last_name}
                  label={T["last_name"]}
                />
                <CommonTextInput
                  fieldName={"email"}
                  formConfig={formConfig}
                  type="text"
                  placeholder={"E.g. Doe"}
                  rules={requiredValidation.email}
                  label={T["email"]}
                  disabled={true}
                />
                <LocationComponent
                  label={T["address"]}
                  fieldName="address"
                  formConfig={formConfig}
                  rules={{ required: T["address_required"] }}
                  placeholder={T["enter_address"]}
                  className="px-4 py-3 bg-gray-100 focus:bg-transparent w-full text-sm outline-[#333] rounded-sm transition-all"
                />
                <CommonTextInput
                  fieldName="zipcode"
                  formConfig={formConfig}
                  isNumberOnly={true}
                  placeholder="E.g. 16028"
                  maxLength={6}
                  rules={{
                    required: T["zipcode_required"],
                  }}
                  label={T["zipcode"]}
                />
                <CommonTextInput
                  fieldName="phone_no"
                  formConfig={formConfig}
                  isNumberOnly={true}
                  maxLength={12}
                  placeholder="E.g. 9472727712"
                  rules={requiredValidation["phone_no"]}
                  label={T["phone_number"]}
                />
                <div>
                  <div className="label">{T["password"]}</div>
                  <PasswordInputField
                    register={register("password", {
                      ...requiredValidation["password"],
                      pattern: {
                        value: PASSWORD_REGEX,
                        message: T["password_pattern_error"],
                      },
                      onChange: (e) => {
                        setValue("password", e.target.value);
                        handleChangePassword(e.target.value, "password");
                      },
                    })}
                    type={showPass?.password ? "text" : "password"}
                    placeholder={T["enter_your_password"]}
                    toggleType={() => handleToglePassword("password")}
                    icon={showPass?.password ? CLOSED_EYE : OPEN_EYE}
                    errors={errors?.["password"]?.message}
                  />
                  <div className="label">{T["confirm_password"]}</div>
                  <PasswordInputField
                    register={register("confirm_password", {
                      ...requiredValidation["confirm_password"],
                      validate: (value) =>
                        value === watch("password") ||
                        T["password_confirm_password_mismatch"],
                      onChange: (e) => {
                        setValue("confirm_password", e.target.value);

                        handleChangePassword(
                          e.target.value,
                          "confirm_password"
                        );
                      },
                    })}
                    type={showPass?.confirm_password ? "text" : "password"}
                    placeholder={T["confirm_your_password"]}
                    toggleType={() => handleToglePassword("confirm_password")}
                    icon={showPass?.confirm_password ? CLOSED_EYE : OPEN_EYE}
                    errors={errors?.["confirm_password"]?.message}
                  />
                </div>
              </>
            )}

            {signupType === "company" && (
              // customer_type,
              // organization_name,
              // organization_no,
              // vat_id,
              // company_domain

              <>
                <CommonTextInput
                  fieldName={"name"}
                  formConfig={formConfig}
                  type="text"
                  placeholder={"E.g. ABC Corp"}
                  rules={requiredValidation.organization_name}
                  label={T["organization_name"]}
                />
                {/* 
                <CommonTextInput
                  fieldName="organization_no"
                  formConfig={formConfig}
                  type="text"
                  isNumberOnly={true}
                  placeholder="E.g. 1234567890"
                  rules={{
                    required: `${T["organization_no_required"]} is required`,
                    pattern: {
                      value: /^\d{10}$/,
                      message: "Organization number must be exactly 10 digits",
                    },
                    validate: {
                      matchLastTwoWithVatId: (value) => {
                        const vatId = formConfig.watch("vat_id") || "";
                        if (
                          vatId.length >= 14 &&
                          value.slice(-2) !== vatId.slice(-2)
                        ) {
                          return "Last two digits must match VAT ID";
                        }
                        return true;
                      },
                    },
                  }}
                  label="Organization Number *"
                  maxLength={10}
                  onChange={(e) => {
                    formConfig.setValue("organization_no", e.target.value);
                    formConfig.trigger("vat_id");
                  }}
                  onChangeRequired={true}
                />

                <CommonTextInput
                  fieldName="vat_id"
                  formConfig={formConfig}
                  type="text"
                  placeholder="E.g. SE123456789012"
                  rules={{
                    required: `${T["vat_id"]} is required`,
                    pattern: {
                      value: /^SE\d{12}$/,
                      message:
                        "VAT ID must start with 'SE' and be exactly 14 characters",
                    },
                    validate: {
                      matchLastTwoWithOrgNo: (value) => {
                        const orgNo = formConfig.watch("organization_no") || "";
                        if (
                          orgNo.length === 10 &&
                          value.slice(-2) !== orgNo.slice(-2)
                        ) {
                          return "Last two digits must match Organization Number";
                        }
                        return true;
                      },
                    },
                  }}
                  label="VAT ID *"
                  onChangeRequired={true}
                  maxLength={14}
                  onChange={(e) => {
                    formConfig.setValue("vat_id", e.target.value);
                    formConfig.trigger("organization_no"); // trigger re-validation of org number
                  }}
                /> */}
                <div>
                  <label className="label">{T["organization_number"]}</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="px-4 py-3 bg-gray-100 focus:bg-transparent w-full text-sm outline-[#333] rounded-sm transition-all"
                      id="organization_no"
                      {...register("organization_no", {
                        required: `${T["organization_no_required"]}`,
                        validate: validateOrganizationNo,
                        onChange: (e) => {
                          formConfig?.setValue(
                            "organization_no",
                            e.target.value
                          );
                          formConfig?.trigger("vat_id");
                        },
                        onBlur: () => {
                          formConfig?.trigger("organization_no");
                          formConfig?.trigger("vat_id");
                        },
                      })}
                      placeholder="E.g. 1234567890"
                      maxLength={10}
                    />
                    <ErrorMessage
                      errors={errors?.["organization_no"]?.message}
                    />
                  </div>
                </div>

                {/* VAT ID Input */}
                <div>
                  <label className="label">{T["vat_id"]}</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="px-4 py-3 bg-gray-100 focus:bg-transparent w-full text-sm outline-[#333] rounded-sm transition-all"
                      id="vat_id"
                      {...formConfig?.register("vat_id", {
                        required: `${T["vat_id"]} is required`,
                        validate: validateVatId,
                        onChange: (e) => {
                          formConfig?.setValue("vat_id", e.target.value);
                          formConfig?.trigger("organization_no");
                        },
                        onBlur: () => {
                          formConfig?.trigger("vat_id");
                          formConfig?.trigger("organization_no");
                        },
                      })}
                      placeholder="E.g. SE123456789012"
                      maxLength={14}
                    />
                    <ErrorMessage errors={errors?.["vat_id"]?.message} />
                  </div>
                </div>

                <CommonTextInput
                  fieldName={"first_name"}
                  formConfig={formConfig}
                  type="text"
                  placeholder={"E.g. John"}
                  rules={requiredValidation.first_name}
                  label={T["first_name"]}
                />
                <CommonTextInput
                  fieldName={"last_name"}
                  formConfig={formConfig}
                  type="text"
                  placeholder={"E.g. Doe"}
                  rules={requiredValidation.last_name}
                  label={T["last_name"]}
                />
                <LocationComponent
                  label={T["address"]}
                  fieldName="address"
                  formConfig={formConfig}
                  rules={{ required: T["address_required"] }}
                  placeholder={T["enter_address"]}
                  className="px-4 py-3 bg-gray-100 focus:bg-transparent w-full text-sm outline-[#333] rounded-sm transition-all"
                />

                <CommonTextInput
                  fieldName="zipcode"
                  formConfig={formConfig}
                  isNumberOnly={true}
                  placeholder="E.g. 16028"
                  rules={{
                    required: T["zipcode_required"],
                  }}
                  label={T["zipcode"]}
                  maxLength={6}
                />
                <CommonTextInput
                  fieldName={"email"}
                  formConfig={formConfig}
                  type="text"
                  placeholder={"E.g. Doe"}
                  rules={requiredValidation.email}
                  label={T["company_email"]}
                  disabled={true}
                />

                <CommonTextInput
                  fieldName="company_domain"
                  formConfig={formConfig}
                  type="text"
                  placeholder="E.g. example.com"
                  rules={{
                    required: T["domain_name_required"],
                    pattern: {
                      value:
                        /^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/,
                      message: T["valid_domain_name_message"],
                    },
                  }}
                  label={T["company_domain_name"]}
                  disabled={true}
                />
                <CommonTextInput
                  fieldName="phone_no"
                  formConfig={formConfig}
                  isNumberOnly={true}
                  placeholder="E.g. 9472727712"
                  rules={{
                    ...requiredValidation["phone_no"],
                  }}
                  label={T["phone_number"]}
                />
                <div>
                  <div className="label">{T["password"]}</div>
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
                    placeholder={T["enter_your_password"]}
                    toggleType={() => handleToglePassword("password")}
                    icon={showPass?.password ? CLOSED_EYE : OPEN_EYE}
                    errors={errors?.["password"]?.message}
                  />
                  <div className="label">{T["confirm_password"]}</div>
                  <PasswordInputField
                    register={register("confirm_password", {
                      ...requiredValidation["confirm_password"],
                      validate: (value) =>
                        value === watch("password") ||
                        T["password_confirm_password_mismatch"],
                      onChange: (e) => {
                        handleChangePassword(
                          e.target.value,
                          "confirm_password"
                        );
                        setValue("confirm_password", e.target.value);
                      },
                    })}
                    type={showPass?.confirm_password ? "text" : "password"}
                    placeholder={T["confirm_your_password"]}
                    toggleType={() => handleToglePassword("confirm_password")}
                    icon={showPass?.confirm_password ? CLOSED_EYE : OPEN_EYE}
                    errors={errors?.["confirm_password"]?.message}
                  />
                </div>
              </>
            )}
            <CommonButton
              type={BUTTON_TYPE.submit}
              className="auth-btn"
              text={T["register"]}
              loader={loader}
              disabled={loader}
            />
            <div className="h-[70px] md:h-[20px]"></div>
            <AuthRedirectSection
              text={T["already_have_account"]}
              linkText={T["login"]}
              linkUrl={URLS.LOGIN}
              className="primary-text-color text-[16px] font-bold text-center"
            />
          </form>

          {/* <form
            onSubmit={handleSubmit(onSubmit)}
            className="bg-white p-5 rounded-none shadow-lg w-full"
          >
            <CommonTextInput
              fieldName={"company_name"}
              formConfig={formConfig}
              type="text"
              placeholder={"E.g. ABC Corp"}
              rules={requiredValidation.company_name}
              label={"Company Name"}
            />
            <CommonTextInput
              fieldName={"first_name"}
              formConfig={formConfig}
              type="text"
              placeholder={"E.g. John"}
              rules={requiredValidation.first_name}
              label={"First Name"}
            />
            <CommonTextInput
              fieldName={"last_name"}
              formConfig={formConfig}
              type="text"
              placeholder={"E.g. Doe"}
              rules={requiredValidation.last_name}
              label={"Last Name"}
            />
            <CommonTextInput
              fieldName={"email"}
              formConfig={formConfig}
              type="text"
              placeholder={"E.g. Doe"}
              rules={requiredValidation.email}
              label={"Email"}
              disabled={true}
            />
            <CommonTextInput
              fieldName="phone_no"
              formConfig={formConfig}
              isNumberOnly={true}
              placeholder="E.g. 9472727712"
              rules={requiredValidation["phone_no"]}
              label="Phone Number"
            />
            <div>
              <div className="label">Password</div>
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
              <div className="label">Confirm Password</div>
              <PasswordInputField
                register={register("confirm_password", {
                  ...requiredValidation["confirm_password"],
                  validate: (value) =>
                    value === watch("password") ||
                    "Password and confirm password must match",
                  onChange: (e) => {
                    handleChangePassword(e.target.value, "confirm_password");
                    setValue("confirm_password", e.target.value);
                  },
                })}
                type={showPass?.confirm_password ? "text" : "password"}
                placeholder={"Confirm your password"}
                toggleType={() => handleToglePassword("confirm_password")}
                icon={showPass?.confirm_password ? CLOSED_EYE : OPEN_EYE}
                errors={errors?.["confirm_password"]?.message}
              />
            </div>
            <CommonButton
              type={BUTTON_TYPE.submit}
              className="auth-btn"
              text={"Register"}
              loader={loader}
              // disabled={key == null}
            />
            <div className="h-[70px] md:h-[20px]"></div>
            <AuthRedirectSection
              text="Already Have An Account? "
              linkText="Login"
              linkUrl={URLS.LOGIN}
              className="primary-text-color text-[16px] font-bold text-center"
            />
          </form> */}
        </>
      )}
    </div>
  );
};

export default Page;
