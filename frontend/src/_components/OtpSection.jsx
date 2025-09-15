import React, { useState } from "react";
import OTPInput from "react-otp-input";
import CommonButton from "./_common/CommonButton";
import { T } from "@/_utils/LanguageTranslator";

const numInputs = 6;

const OtpSection = ({ handleSubmitOTP, loader }) => {
  const [otp, setOtpValue] = useState("");
  const [showErrorMsg, setShowErrorMsg] = useState({
    show: false,
    msg: "",
  });

  const handleOtpInputChange = (otp) => {
    if (isNaN(otp)) return;
    setOtpValue(otp);
    if (showErrorMsg.show) {
      setShowErrorMsg({ show: false, msg: "" });
    }
  };

  return (
    <div className="shadow-[0_0_14px_#0000001F] p-[20px] bg-white">
      {" "}
      <p>{T["enter_verification_code_message"]}</p>
      <OTPInput
        value={otp}
        onChange={handleOtpInputChange}
        numInputs={numInputs} //6
        renderInput={(props) => (
          <input {...props} placeholder="-" className="otpInput" />
        )}
        isInputNum={true}
        containerStyle="OTPInputContainer"
      />
      {showErrorMsg.show && (
        <p className="error-msg">{showErrorMsg?.message}</p>
      )}
      <CommonButton
        type="button"
        text={T["submit"]}
        loader={loader}
        disabled={loader}
        onClick={() => {
          if (otp.length !== numInputs) {
            setShowErrorMsg({ show: true, message: T["please_enter_otp"] });
          } else {
            handleSubmitOTP(otp);
          }
        }}
      />
    </div>
  );
};

export default OtpSection;
