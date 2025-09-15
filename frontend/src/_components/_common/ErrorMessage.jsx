import React from "react";

const ErrorMessage = ({ errors }) => {
  return <>{errors && <p className="text-red-500">{errors}</p>}</>;
};

export default ErrorMessage;
