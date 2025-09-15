import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authImage from "../assets/images/authImage.png";
import AuthFormTitleSection from "../Components/AuthTitleSection";

const PublicLayout = () => {
  const isToken = localStorage.getItem("token");

  return (
    <div className="login-form-container">
      <>

        {/* Section 2 */}
        <div className="section2 w-full p-6  text-center bg-[#f2f2f2]">
          <AuthFormTitleSection title={"Login!"} />
          {!isToken ? <Outlet /> : <Navigate to="/dashboard" />}{" "}
          <h4 className="text-base font-normal">
            © copyright 2025 briova.se
          </h4>
          <h4 className="text-base font-normal">
            Powered by Rexett
          </h4>
        </div>
      </>
    </div>
  );
};

export default PublicLayout;
