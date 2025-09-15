import { LOGO } from "@/Assets/Images";
import Image from "next/image";
import React from "react";
import { T } from "@/_utils/LanguageTranslator";

const AuthFormTitleSection = ({
  title,
  subTitle = (
    <>
      {T["more_than"]} <span className="text-[#067200] font-bold">{T["products_count"]}</span>{" "}
      {T["from_around_world"]}
    </>
  ),
}) => {
  return (
    <div>
      <div>
        <Image
          src={LOGO}
          alt="auth_logo"
          width={500}
          height={20}
          priority={false}
          className="w-[200px] mx-auto mt-5 md:w-[170px] md:mt-0"
        />
      </div>
      <div className="md:text-[14px]">
        <h2 className="text-center text-[27px] font-bold mt-2">{title}</h2>
        <p className="text-lg text-center font-light mt-0 mb-5">{subTitle}</p>
      </div>
    </div>
  );
};

export default AuthFormTitleSection;
