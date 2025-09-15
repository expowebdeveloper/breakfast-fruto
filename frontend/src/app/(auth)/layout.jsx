import Image from "next/image";
import React from "react";
import { FACEBOOK, INSTAGRAM, TWITTER } from "../../../public/images/SvgIcons";
import { AUTH_FOOTER_LINK, SOCIAL_LINK } from "./_constant";
import Link from "next/link";
import PowerBy from "@/_components/_common/PowerBy";

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-background">
      <div className="w-full flex flex-col items-center">
        <div className="w-full px-5">{children}</div>
        <div className="max-w-[800px] mx-auto relative">
          <div className="container">
            <div className="login-copyright">
              <div>
                <ul className="flex gap-5">
                  {AUTH_FOOTER_LINK.map((link, i) => (
                    <li className="login-copyright-li" key={i}>
                      <Link href={link.link}>{link.name}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="career-social-icon">
                  {SOCIAL_LINK.map((link, i) => (
                    <Link href={link.link} key={i}>
                      {link.icon}
                    </Link>
                  ))}
                </div>
                <h4 className="text-base font-normal">

                  © 2025 Frukto. Alla rättigheter förbehållna.
                </h4>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
