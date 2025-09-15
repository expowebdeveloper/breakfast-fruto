"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import CommonButton from "@/_components/_common/CommonButton";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { COMPANY_NAME, COMPANY_SIZE, DEFAULT_ERROR_MESSAGE, EMAIL_ADDRESS, NAME_REQUIRED,EMAIL_REQUIRED, ENTER_COMPANY_NAME, ENTER_COMPANY_SIZE, PHONE_NUMBER_REQUIRED, TELEPHONE_NUMBER, VALID_EMAIL, VALID_PHONE_NUMBER } from "@/_constants/constant";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { CONTACT_ENDPOINT } from "@/_Api-Handlers/APIUrls";
import CommonTextInput from "@/_form-fields/CommonTextInput";
import FAQSection from "@/_components/FaqSection";

const page = () => {
  const [buttonLoader, setButtonLoader] = useState(false);
  const formConfig = useForm({
    defaultValues: {
      name: "",
      email: "",
      contact_no: "",
      message: "",
    },
  });

  const { handleSubmit } = formConfig;

  const onSubmit = (data) => {
    setButtonLoader((prev) => true);
    callApi({
      endPoint: CONTACT_ENDPOINT,
      method: METHODS?.post,
      payload: data,
      instanceType: INSTANCE.authorize,
    })
      .then((res) => {
        const responseMessage = res?.data?.message;
        toastMessages(
          T["contact_success_message"],
          successType
        );
      })
      .catch((err) => {
        const error = err?.response?.data?.message;
        toastMessages(error || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setButtonLoader((prev) => false);
        formConfig?.reset();
      });
  };



  return (
    <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div>
        <div className="h-[300px] sm:h-[400px] flex flex-col justify-center items-center text-center bg-gradient-to-r from-[#D8FFB0] to-yellow-100 px-4">
          <h1 className="uppercase font-bebas-neue text-3xl sm:text-[50px] font-bold leading-tight sm:leading-[78px] text-customOrange">
            Kontakta oss
          </h1>
          <p className="text-base sm:text-lg mt-2 max-w-2xl">
            Starta dagen på bästa sätt med våra frukostkorgar - en smakfull kombination av frukt, godsaker och kärlek i varje korg.
          </p>
        </div>
      </div>      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 text-center mb-8 sm:mb-12 mt-8 sm:mt-[3rem]">
        {[
          {
            icon: (
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 24 24"
                className="h-32 w-32 sm:h-[200px] sm:w-[200px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill="none" d="M0 0h24v24H0z"></path>
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"></path>
              </svg>
            ),
            title: "E-postadress",
            content: EMAIL_ADDRESS
          },
          {
            icon: (
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 512 512"
                className="h-32 w-32 sm:h-[200px] sm:w-[200px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"></path>
              </svg>
            ),
            title: "Telefonnummer",
            content: "+070 123 45 67"
          },
          {
            icon: (
              <svg
                stroke="currentColor"
                fill="currentColor"
                strokeWidth="0"
                viewBox="0 0 288 512"
                className="h-32 w-32 sm:h-[200px] sm:w-[200px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M112 316.94v156.69l22.02 33.02c4.75 7.12 15.22 7.12 19.97 0L176 473.63V316.94c-10.39 1.92-21.06 3.06-32 3.06s-21.61-1.14-32-3.06zM144 0C64.47 0 0 64.47 0 144s64.47 144 144 144 144-64.47 144-144S223.53 0 144 0zm0 76c-37.5 0-68 30.5-68 68 0 6.62-5.38 12-12 12s-12-5.38-12-12c0-50.73 41.28-92 92-92 6.62 0 12 5.38 12 12s-5.38 12-12 12z"></path>
              </svg>
            ),
            title: "kontorsadress ",
            content: ["Gustaf Dahlénsgatan 30, 417 24", "Gothenburg, Sweden"]
          }
        ].map((item, index) => (
          <div key={index} className="border p-4 sm:p-6 rounded-lg shadow-lg">
            <div className="flex justify-center items-center mb-4 contact-icon">
              {item.icon}
            </div>
            <h3 className="font-bold text-lg text-customOrange mb-3">
              {item.title}
            </h3>
            {Array.isArray(item.content) ? (
              item.content.map((line, i) => <p key={i} className="text-sm sm:text-base">{line}</p>)
            ) : (
              <p className="text-sm sm:text-base">{item.content}</p>
            )}
          </div>
        ))}
      </div>
      <div>
        <div className="max-w-screen-xl w-full px-4 mx-auto">
          <div className="bg-gradient-to-r from-[#D8FFB0] to-yellow-100 p-4 sm:p-8 rounded-lg shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center">
              Få en offert
            </h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <CommonTextInput
                  formConfig={formConfig}
                  placeholder="Ange ditt namn"
                  fieldName="name"
                  rules={{ required: NAME_REQUIRED }}
                  label="Fullständigt namn *"
                />
                <CommonTextInput
                  formConfig={formConfig}
                  placeholder="Ange e-postadress"
                  fieldName="email"
                  rules={{
                    required: EMAIL_REQUIRED ,
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: VALID_EMAIL,
                    },
                  }}
                  label="E-postadress *"
                />
                <CommonTextInput
                  formConfig={formConfig}
                  placeholder={ENTER_COMPANY_NAME}
                  fieldName="company_name"
                  label={COMPANY_NAME}
                />
                <CommonTextInput
                  formConfig={formConfig}
                  placeholder={ENTER_COMPANY_SIZE}
                  fieldName="company_size"
                  isNumberOnly={true}
                  label={COMPANY_SIZE}
                />

                <CommonTextInput
                  formConfig={formConfig}
                  placeholder="e.g., 0731234567"
                  fieldName="contact_no"
                  rules={{
                    required: PHONE_NUMBER_REQUIRED,
                    pattern: {
                      value: /^(46\d{9}|0\d{9})$/,
                      message:
                        VALID_PHONE_NUMBER,
                    },
                  }}
                  label={`${TELEPHONE_NUMBER}*`}
                  isNumberOnly={true}
                  maxLength={10}
                />

                <CommonTextInput
                  formConfig={formConfig}
                  placeholder="Ange meddelande"
                  fieldName="message"
                  rules={{ required: "Meddelande är obligatoriskt" }}
                  label="Meddelande *"
                  type="textarea"
                  rows={4}
                />
              </div>

              <div className="text-center">
                <CommonButton
                  type="submit"
                  text="Skicka"
                  loader={buttonLoader}
                  disabled={buttonLoader}
                  className="bg-gradient-to-r from-[#92C64E] to-[#4BAF50] text-white px-4 sm:px-6 min-w-[140px] sm:min-w-[180px] py-3 sm:py-4 rounded-full hover:bg-orange-700 transition duration-300 uppercase tracking-widest font-semibold inline-flex justify-center mt-4 sm:mt-5 items-center text-sm sm:text-base"
                />
              </div>
            </form>
          </div>
        </div>
      </div>

      <FAQSection />
    </div>
  );
};

export default page;
