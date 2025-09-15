"use client";
import Link from "next/link";
import {
  ADDRESS_ICON,
  EMAIL_ICON,
  FACEBOOK_ICON,
  LINKEDIN_ICON,
  PHONE_ICON,
  TWITTER_ICON,
} from "../../../public/images/SvgIcons";
import { EMAIL_ADDRESS } from "@/_constants/constant";
import Image from "next/image";
import { FOOTER_LOGO } from "@/Assets/Images";
import { T } from "@/_utils/LanguageTranslator";
import { useRouter } from "next/navigation";
const Footer = () => {
  const router = useRouter();
  return (
    <>
      <div className="bg-black text-white py-6 px-4 mt-4" id="footer">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-0">
          <div className="border-b border-gray-600 border-opacity-50 p-6">
            <div className="flex gap-4 items-start justify-start mb-5">
              <span className="bg-[#262626] w-12 h-12 flex justify-center items-center rounded-[50px]">
                {EMAIL_ICON}
              </span>
              <div>
                <h2 className="text-lg font-semibold">{T["email"]}</h2>
                <p className="text-gray-300 text-sm">{EMAIL_ADDRESS}</p>
              </div>
            </div>
            <div className="flex gap-4 items-start justify-start mb-5">
              <span className="bg-[#262626] w-12 h-12 flex justify-center items-center rounded-[50px]">
                {PHONE_ICON}
              </span>
              <div>
                <h2 className="text-lg font-semibold">{T["phone"]}</h2>
                <p className="text-gray-300 text-sm">+070 123 45 67</p>
              </div>
            </div>
            <div className="flex gap-4 items-start justify-start mb-5">
              <span className="bg-[#262626] w-12 h-12 flex justify-center items-center rounded-[50px]">
                {ADDRESS_ICON}
              </span>
              <div>
                <h2 className="text-lg font-semibold">{T["address"]}</h2>
                <span className="text-gray-300 text-sm">{T["footer_address"]}</span>
              </div>
            </div>
          </div>
          <div className="border-b border-l border-gray-600 p-6 border-opacity-50 space-y-4">
            <h1 className="text-xl font-bold">{T["customer_center"]}</h1>
            <div className="grid grid-cols-2 gap-6">
              <ul className="space-y-2 text-gray-300 text-sm">
                {[
                  { text: T["faq"], link: "/contact", scrollTo: "faq" },
                  { text: T["contact_frukto"], link: "/contact" },
                  { text: T["purchase_and_delivery_terms"], link: "/terms" },
                  { text: T["privacy_policy"], link: "/privacy" }
                ].map((item, index) => (
                  <li
                    key={index}
                    onClick={() => {
                      router.push(item.link);
                      if (item.scrollTo) {
                        setTimeout(() => {
                          const element = document.getElementById(item.scrollTo);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 500);
                      }
                    }}
                    className="cursor-pointer hover:text-white"
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex space-x-4">
              <Link href="">
                <span className="text-blue-400 hover:text-blue-600">{FACEBOOK_ICON}</span>
              </Link>
              <Link href="">
                <span className="text-blue-400 hover:text-blue-600">{TWITTER_ICON}</span>
              </Link>
              <Link href="">
                <span className="text-blue-400 hover:text-blue-600">{LINKEDIN_ICON}</span>
              </Link>
            </div>
          </div>
          <div className="border-b border-l flex items-center flex-col text-center text-sm justify-center border-gray-600 border-opacity-50 p-6 space-y-4">
            {/* <p className="text-gray-400">There are many variations of passages of Lorem Ipsum available.</p> */}
            <Image src={FOOTER_LOGO} alt="footer-logo" width={250} height={250} />
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-4 flex flex-col md:flex-row justify-center items-center border-opacity-50 text-sm text-gray-400">
          <span>{T["footer_copyright"]}</span>
        </div>
      </div>
    </>
  );
};
export default Footer;