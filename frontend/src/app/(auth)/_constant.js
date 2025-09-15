import { T } from "@/_utils/LanguageTranslator";
import { FACEBOOK, INSTAGRAM, TWITTER } from "../../../public/images/SvgIcons";

export const AUTH_FOOTER_LINK = [
  {
    name: T["home"],
    link: "/",
  },
  {
    name: T["products"],
    link: "/products",
  },
  {
    name: T["about_us"],
    link: "/about",
  },
  {
    name: T["contact_us"],
    link: "/contact",
  },
];

export const SOCIAL_LINK = [
  {
    icon: FACEBOOK,
    link: "/",
  },
  {
    icon: TWITTER,
    link: "/",
  },
  {
    icon: INSTAGRAM,
    link: "/",
  },
];

export const INDIVIDUAL = "Individual";
export const COMPANY = "Company";

export const TABS = [INDIVIDUAL, COMPANY];

export const FORGOT_PASSWORD_STEP = {
  OTP: "OTP",
  CHANGE_PASSWORD: "CHANGE_PASSWORD",
  FORGOT_PASSWORD: "FORGOT_PASSWORD",
};
