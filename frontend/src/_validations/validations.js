// export const requiredValidation = (fieldName = "This field") => {
//   return { required: `${fieldName} is required` };
// };
import { T } from "@/_utils/LanguageTranslator";

export const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const INVALID_EMAIL_MESSAGE = T["invalid_email_message"];

export const requiredValidation = {
  first_name: {
    required: T["first_name_required"],
  },
  organization_name: {
    required: T["organization_name_required"],
  },
  company_name: {
    required: T["company_name_required"],
  },
  last_name: {
    required: T["last_name_required"],
  },
  email: {
    required: T["email_required"],
    pattern: {
      value: EMAIL_REGEX,
      message: INVALID_EMAIL_MESSAGE,
    },
  },
  phone_no: {
    required: T["phone_number_required"],
    pattern: {
      value: /^(46\d{9}|0\d{9})$/,
      message: T["swedish_phone_number_validation"],
    },
  },
    password: {
    required: T["password_required"],
  },
  confirm_password: {
    required: T["confirm_password_required"],
  },
  old_password: {
    required: T["old_password_required"],
  },
  address_line_1: {
    required: T["address_line_1_required"],
  },
  address_line_2: {
    required: T["address_line_2_required"],
  },
  address_line_3: {
    required: T["address_line_3_required"],
  },
  city: {
    required: T["city_required"],
  },
  zip_code: {
    required: T["zip_code_required"],
  },
};
