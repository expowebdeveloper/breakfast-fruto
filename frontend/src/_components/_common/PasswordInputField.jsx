import React from "react";
import ErrorMessage from "./ErrorMessage";

const PasswordInputField = ({
  register,
  type,
  placeholder,
  toggleType,
  icon,
  errors,
}) => {
  return (
    <>
      <div className="flex mb-2">
        <div className="w-[95%]">
          <input
            {...register}
            type={type}
            placeholder={placeholder}
            className="auth-input rounded-e-none"
          />
        </div>
        <div
          className="flex items-center p-3 rounded-e-lg bg-gray-100 cursor-pointer"
          onClick={toggleType}
        >
          {icon}
        </div>
      </div>
      <ErrorMessage errors={errors} />
    </>
  );
};

export default PasswordInputField;
