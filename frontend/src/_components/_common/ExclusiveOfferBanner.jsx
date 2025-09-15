import React, { useState } from "react";
import { T } from "@/_utils/LanguageTranslator";
import { useForm } from "react-hook-form";
import { EMAIL_REGEX, INVALID_EMAIL_MESSAGE } from "@/_validations/validations";
import ErrorMessage from "./ErrorMessage";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { successType, toastMessages } from "@/_utils/toastMessage";
import CommonButton from "./CommonButton";

const ExclusiveOfferBanner = () => {
  const [buttonLoader, setButtonLoader] = useState(false);
  const {
    handleSubmit,
    register,
    formState: { errors },
    setValue,
  } = useForm();

  const onSubmit = (data) => {
    setButtonLoader((prev) => true);
    callApi({
      endPoint: "/delivery/subscribe/",
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: data,
    })
      .then((res) => {
        setValue("email", "");
        toastMessages(
            T["subscription_success_message"],
          successType
        );
      })
      .catch((err) => {
        toastMessages(
          err?.response?.data?.detail?.toLowerCase().includes('subscription already exists')
            ? T["subscription_already_exists"]
            : err?.response?.data?.detail
        );
      })
      .finally(() => {
        setButtonLoader((prev) => false);
      });
  };

  return (
    <section className="py-[60px] offers_sales">
      <div className="max-w-screen-xl w-full px-4 mx-auto">
        <div className="flex items-center sale-width-mob">
          <div className="exclusive-bg">
            <p className="text-[#4FB050] text-[15px] font-medium">
              {T.dont_miss_deals}
            </p>
            <h6 className="text-[#F4F4F4] font-extrabold text-[40px] leading-[25px] md:text-[32px] md:leading-[45px]">
              {T.exclusive}
            </h6>
            <h6 className="text-[#F4F4F4] font-extrabold text-[40px] leading-[25px] md:text-[32px] md:leading-[45px]">
              {T.offers}
            </h6>
            <p className="text-[#4FB050] text-[15px] font-medium mt-[20px]">
              {T.voucher_worth}
            </p>
          </div>
          <div className="newletter-bg">
            <div className="">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="max-w-[500px] w-full flex flex-col items-center justify-center mx-auto">
                  <input
                    {...register("email", {
                      required: "E-post krävs",
                      pattern: {
                        value: EMAIL_REGEX,
                        message: INVALID_EMAIL_MESSAGE,
                      },
                    })}
                    className=" p-[18px] px-[20px] rounded-full w-full"
                    type="text"
                    id="first_name"
                    placeholder={T["email_address"]}
                  />
                  <div className="mt-2">
                    <ErrorMessage errors={errors?.["email"]?.message} />
                  </div>
                  <CommonButton
                    type="submit"
                    text={T.subscribe}
                    loader={buttonLoader}
                    disabled={buttonLoader}
                    className="w-full bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[10px_30px] rounded-full text-white font-semibold items-center mt-[20px]"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExclusiveOfferBanner;
