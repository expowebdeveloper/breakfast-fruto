import { useState } from "react";
import { LoginValidations } from "../Validations/loginValidations";
import { useForm } from "react-hook-form";
import CommonTextField from "../Form Fields/CommonTextField";
import { ClosedEye, OpenEye } from "../assets/Icons/Svg";
import { login } from "../api/apiFunctions";
import { toastMessage } from "../utils/toastMessage";
import CommonButton from "../Components/Common/CommonButton";
import { ROLES } from "../constant";
import { T } from "../utils/languageTranslator";
import { useProfile } from "../contexts/ProfileProvider";
import { createRequiredValidation } from "../utils/helpers";

const Login = () => {
  const formConfig = useForm();
  const { updateProfile } = useProfile();
  const {
    handleSubmit,
    formState: { isValid },
  } = formConfig;
  const [showPassword, setShowPassword] = useState(false);
  const [btnLoader, setBtnLoader] = useState(false);
  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };
  const allowedRoles = [
    ROLES?.accountManager,
    ROLES?.admin,
    ROLES?.stockManager,
  ];
  const onSubmit = (values) => {
    setBtnLoader((prev) => true);
    login(values)
      .then((res) => {
        console.log(res, "this is response");
        const data = res?.data?.token_data;
        const role = data?.role;
        console.log(data, "this is response");
        // const role = ROLES?.stockManager;
        if (!allowedRoles.includes(role)) {
          toastMessage("Invalid email or password");
          return;
        }
        localStorage.setItem("token", data?.access);
        localStorage.setItem("refreshToken", data?.refresh);
        localStorage.setItem("role", role);
        console.log(data, "resdata");
        // commented for future use
        localStorage.setItem("user_id", data?.id);

        const userName = `${data?.first_name} ${data?.last_name}`;
        localStorage.setItem("userName", userName);
        localStorage.setItem("email", data?.email);
        const profile = {
          first_name: data?.first_name,
          last_name: data?.last_name,
          profile_picture: data?.profile?.profile_picture,
        };
        updateProfile(profile);
        handleNavigate(role);
      })
      .catch((err) => {
        const fieldError =
          err?.response?.data?.non_field_errors?.[0] ||
          err?.response?.data?.email?.[0];
        if (fieldError) {
          toastMessage(fieldError || DEFAULT_ERROR_MESSAGE);
        }
      })
      .finally(() => setBtnLoader((prev) => false));
  };
  const handleNavigate = (role) => {
    if (role === ROLES?.admin) {
      window.location.href = "/dashboard";
    } else if (role === ROLES?.accountManager) {
      window.location.href = "/orders-management";
    } else if (role === ROLES?.stockManager) {
      window.location.href = "/products";
    } else {
      window.location.href = "/dashboard";
    }
  };
  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-5 rounded-none shadow-lg w-full max-w-[584px] mx-auto mb-10"
      >
        <h2 className="text-3xl font-bold mb-4">Login!</h2>
        <CommonTextField
          fieldName="email"
          formConfig={formConfig}
          type="text"
          placeholder={T["enter_email"]}
          rules={LoginValidations["email"]}
          label={`${T["email_address"]} *`}
          className="px-4 py-3 bg-gray-100 focus:bg-transparent w-full text-sm outline-[#333] rounded-sm transition-all mb-2"
          labelClassName="mb-1 text-sm leading-5 font-semibold"
        />
        <CommonTextField
          fieldName="password"
          formConfig={formConfig}
          placeholder={T["enter_password"]}
          rules={LoginValidations["password"]}
          // rules={createRequiredValidation(T["password"])}
          label={`${T["your_password"]} *`}
          className="px-4 py-3 bg-gray-100 focus:bg-transparent w-full text-sm outline-[#333] rounded-sm transition-all mb-2"
          labelClassName="mb-1 text-sm leading-5 font-semibold"
          type={showPassword ? "text" : "password"}
          onIconClick={toggleShowPassword}
          icon={showPassword ? ClosedEye : OpenEye}
          showTooltip={true}
        />
        <CommonButton
          text={T["sign_in"]}
          type="submit"
          loader={btnLoader}
          className={`auth-btn`}
          disabled={!isValid || btnLoader}
        />
        {/* commented for future  use */}
        {/* <SocialLogin
          afterAPISuccess={() => {
            afterAPISuccess;
          }}
        /> */}
      </form>
    </>
  );
};

export default Login;
