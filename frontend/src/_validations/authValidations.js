import { T } from "@/_utils/LanguageTranslator";

export const PASSWORD_REGEX =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^A-Za-z0-9]).{6,}$/g;

export const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const INVALID_EMAIL_MESSAGE = "Please enter a valid email";
export const LoginValidations = {
  email: {
    required: T["email_is_required"],
    pattern: {
      value: EMAIL_REGEX,
      message: T["invalid_email_message"],
    },
  },
  password: {
    required: T["password_is_required"],
  },
    
};
