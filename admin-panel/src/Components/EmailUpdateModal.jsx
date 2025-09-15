import React from "react";
import { closeIcon } from "../assets/Icons/Svg";
import CommonTextField from "../Form Fields/CommonTextField";
import { EMAIL_REGEX } from "../regex/regex";
import { T } from "../utils/languageTranslator";
import CommonButton from "./Common/CommonButton";

const EmailUpdateModal = ({ onClose, onSubmit, emailFormConfig, loader }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, control },
  } = emailFormConfig;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white p-8 rounded-xl max-w-[500px] w-full text-center border-2 border-purple-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
          aria-label="Close"
        >
          {closeIcon}
        </button>

        {/* Headline */}
        <h2 className="text-[24px] font-bold text-green-600 leading-tight">
          Update Email
        </h2>

        {/* Email Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <CommonTextField
            fieldName="email"
            formConfig={emailFormConfig}
            type="text"
            placeholder="E.g. john@example.com"
            rules={{
              pattern: {
                value: EMAIL_REGEX,
                message: T["enter_valid_email"],
              },
              required: "Email is required",
            }}
            label="Email *"
            disabled={false}
          />

          <CommonButton
            type="submit"
            text="Update Email"
            loader={loader}
            disabled={loader}
            className="text-center orange_btn"
          />
        </form>
      </div>
    </div>
  );
};

export default EmailUpdateModal;
