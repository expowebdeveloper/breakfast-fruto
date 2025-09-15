"use client";
import Banner from "@/_components/Banner";
import React, { useState } from "react";
import {
  FACEBOOK_ICON,
  LINKEDIN_ICON,
  TWITTER_ICON,
} from "../../../../public/images/SvgIcons";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { EMAIL_REGEX, INVALID_EMAIL_MESSAGE } from "@/_validations/validations";
import CommonButton from "@/_components/_common/CommonButton";
import ErrorMessage from "@/_components/_common/ErrorMessage";
import { T } from "@/_utils/LanguageTranslator";
import Image from "next/image";

const page = () => {
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
        console.log(res, "success response");
        setValue("email", "");
        toastMessages(
          T["subscription_success_message"],
          successType
        );
      })
      .catch((err) => {
        console.log(err, "error response");
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
    <div>
      <Banner isAbout={true} />
      <section className="our-team py-10">
        <div className="px-4 sm:px-8 w-full desktop-calc1200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-[50px]">
            <div>
              <h4 className="text-[#3bb77e] mb-3 text-[20px] sm:text-[24px] font-bold leading-[1.2]">
                {" "}
                Vårt resa
              </h4>
              <div className="pb-5 text-[24px] sm:text-[30px] font-bold leading-[1.2] sm:leading-[30px]">
                Hur det började{" "}
              </div>
              <p className="text-sm sm:text-base font-normal leading-[24px] sm:leading-[28px] text-[#7e7e7e]">
                Frukto föddes ur en enkel idé - att göra vardagen lite godare med noggrant
                utvalda frukter och vackert sammansatta korgar. Vi ville skapa något som
                både smakar gott och känns genomtänkt.
              </p>
            </div>
            {/* images section */}
            <div className="image-1 relative our-team-img mt-8 md:mt-0">
              <img className="rounded-[15px] w-full" src="/images/about-1.png" alt="Team member" />
              <div className="rounded-[15px] bg-white p-4 sm:p-[30px] max-w-[90%] sm:max-w-[80%] relative z-[2] -mt-[60px] sm:-mt-[90px] mx-auto transition duration-200 shadow-[5px_5px_15px_rgba(0,0,0,0.05)] our-team-box">
                <a className="font-bold text-[18px] sm:text-[20px]" href="#" target="_blank">
                  {" "}
                  H. Merinda
                </a>
                <p className="text-[15px] sm:text-[17px] text-[#7e7e7e] transition-all duration-300 ease-in-out">
                  VD & Medgrundare
                </p>
                <div className="flex space-x-3 sm:space-x-4 mt-2">
                  <Link href="">
                    <span className="text-[20px] sm:text-[24px]">{FACEBOOK_ICON}</span>
                  </Link>
                  <Link href="">
                    <span className="text-[20px] sm:text-[24px]">{TWITTER_ICON}</span>
                  </Link>
                  <Link href="">
                    <span className="text-[20px] sm:text-[24px]">{LINKEDIN_ICON}</span>
                  </Link>
                  <Link href="">
                    <span className="text-[20px] sm:text-[24px]">{LINKEDIN_ICON}</span>
                  </Link>
                </div>
              </div>
            </div>
            <div className="image-2 relative our-team-img mt-8 lg:mt-0">
              <img className="rounded-[15px] w-full" src="/images/about-2.png" alt="Team member" />
              <div className="rounded-[15px] bg-white p-4 sm:p-[30px] max-w-[90%] sm:max-w-[80%] relative z-[2] -mt-[60px] sm:-mt-[90px] mx-auto transition duration-200 shadow-[5px_5px_15px_rgba(0,0,0,0.05)] our-team-box">
                <a className="font-bold text-[18px] sm:text-[20px]" href="#" target="_blank">
                  {" "}
                  H. Merinda
                </a>
                <p className="text-[15px] sm:text-[17px] text-[#7e7e7e] transition-all duration-300 ease-in-out">
                  VD & Medgrundare
                </p>
                <div className="flex space-x-3 sm:space-x-4 mt-2">
                  <Link href="">
                    <span className="text-[20px] sm:text-[24px]">{FACEBOOK_ICON}</span>
                  </Link>
                  <Link href="">
                    <span className="text-[20px] sm:text-[24px]">{TWITTER_ICON}</span>
                  </Link>
                  <Link href="">
                    <span className="text-[20px] sm:text-[24px]">{LINKEDIN_ICON}</span>
                  </Link>
                  <Link href="">
                    <span className="text-[20px] sm:text-[24px]">{LINKEDIN_ICON}</span>
                  </Link>
                </div>
              </div>
            </div>
            {/* images section */}
          </div>
        </div>
      </section>
      <section>
        <div className="px-4 sm:px-8 w-full desktop-calc1200 py-6 sm:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-[50px] items-center">
            <div className="banner">
              <img src="/images/about-3.png" className="w-full rounded-lg" alt="About us" />
            </div>
            <div>
              <h4 className="text-[#3bb77e] mb-2 sm:mb-3 text-[20px] sm:text-[24px] font-bold leading-[1.2]">
                {" "}
                Vilka vi är
              </h4>
              <div className="pb-3 sm:pb-5 text-[24px] sm:text-[30px] font-bold leading-[1.2] sm:leading-[30px]">
                Teknik möter passion för färska <br className="hidden sm:block"></br>
                råvaror och kvalitet
              </div>
              <p className="text-sm sm:text-base font-normal leading-[24px] sm:leading-[28px] text-[#7e7e7e] mb-6 sm:mb-10">
                Vi är ett passionerat team med teknisk bakgrund som har valt att kombineravår digitala kompetens med vår kärlek till färska råvaror. Resultatet blev Frukto - en plats där kvalitet, omtanke och användarvänlighet möts.              
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-[50px] items-start pt-10 sm:pt-20">
            {[
              {
                title: "Varför vi startade",
                description: "Vi såg ett behov av en mer personlig och pålitlig lösning för fruktleveranser – något som inte bara levererar frukt, utan också upplevelse. Det blev starten på Frukto."
              },
              {
                title: "Vår samarbete",
                description: "Idag samarbetar vi med en av Sveriges främsta fruktleverantörer för att säkerställa högsta kvalitet i varje korg. Tillsammans strävar vi efter att ge våra kunder något som verkligen gör skillnad, både i vardagen och vid speciella tillfällen."
              },
              {
                title: "Vårt uppdrag",
                description: "Att leverera färska, ekologiska fruktkorgar och frukostår med omtanke och kvalitet – för att göra varje arbetsdag friskare, enklare och mer njutbar."
              }
            ].map((item, index) => (
              <div key={index}>
                <h5 className="pb-1 text-[24px] sm:text-[32px] font-semibold">{item.title}</h5>
                <p className="text-sm sm:text-base font-normal leading-[24px] sm:leading-[28px] text-[#7e7e7e]">
                  {" "}
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section>
        <div className="px-4 sm:px-8 w-full desktop-calc1200 py-6 sm:py-10">
          <div className="about-banner relative">
            <h4 className="mb-6 sm:mb-10 text-[#253d4e] text-[36px] sm:text-[48px] lg:text-[72px] leading-[1.2] sm:leading-[1] font-bold">
              Specialerbjudande – Prova innan du startar abonnemang
            </h4>
            <p className="text-base sm:text-[18px] mb-6 sm:mb-[45px]">
              Vi tror på vår kvalitet. Därför får du två kostnadsfria fruktkorgar under din första vecka – helt utan förpliktelser.
              <br className="hidden sm:block" />
              Bara färsk, noggrant utvald frukt som ger dig en smak av Frukto.
            </p>

            <p className="text-base sm:text-[18px] mb-6 sm:mb-[45px]">
              <b>
                Prova Frukto – helt utan risk
              </b>
            </p>
            <div className="relative inline-block w-full max-w-[450px]">
              <form onSubmit={handleSubmit(onSubmit)}>
                <input
                  className="border-0 rounded-[50px] h-[48px] sm:h-[64px] pl-4 sm:pl-[30px] pr-[90px] py-0 !important w-full max-w-[450px] text-sm sm:text-base"
                  type="email"
                  {...register("email", {
                    required: T["email_required"],
                    pattern: {
                      value: EMAIL_REGEX,
                      message: T?.invalid_email_message,
                    },
                  })}
                  placeholder={T?.email_placeholder}
                ></input>
                <CommonButton
                  disabled={buttonLoader}
                  loader={buttonLoader}
                  type="submit"
                  text="Prenumeration nu"
                  className="pointer absolute inline-block rounded-full right-0 bg-gradient-to-r from-[#92C64E] to-[#4BAF50] h-[48px] sm:h-[64px] text-white px-4 sm:px-[30px] py-0 !important text-sm sm:text-base"
                />
                <div className="text-center mt-2">
                  <ErrorMessage errors={errors?.email?.message} />
                </div>
              </form>
            </div>
            <Image 
              className="about-4-image w-full sm:w-auto mt-8 sm:mt-0" 
              src="/images/Frukto-fruit-2.png" 
              alt="Frukto fruit" 
              width={500} 
              height={500} 
            />
          </div>
        </div>
      </section>
    </div >
  );
};

export default page;
