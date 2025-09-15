import React from "react";

const AuthFormTitleSection = ({
    title,
    subTitle = (
        <>
            More than <span className="text-[#067200] font-bold">120+ Products</span>{" "}
            from around the world!
        </>
    ),
}) => {
    return (
        <div>
            <div>
                <img
                    src={"/images/logo-1.png"}
                    alt="auth_logo"
                    width={500}
                    height={20}
                    priority={false}
                    className="w-[200px] mx-auto mt-5 md:w-[170px] md:mt-0 mb-4"
                />
            </div>
            <div className="md:text-[14px]">
                {/* <h2 className="text-center text-[27px] font-bold mt-2">{title}</h2> */}
                <p className="text-lg text-center font-light mt-0 mb-5">{subTitle}</p>
            </div>
        </div>
    );
};

export default AuthFormTitleSection;
