import { EMAIL_REGEX, INVALID_EMAIL_MESSAGE } from "@/_validations/validations";
import item1 from "../../././public/images/item1.png";
import item2 from "../../././public/images/item2.png";
import item3 from "../../././public/images/item3.png";
import item4 from "../../././public/images/item4.png";
import item5 from "../../././public/images/item5.png";
import item6 from "../../././public/images/item6.png";
import item7 from "../../././public/images/item7.png";

export const DEFAULT_ERROR_MESSAGE = "Något gick fel";
export const SIDE_BAR_OPTIONS = [
  "All",
  "Fruits",
  "Dairy",
  "Breakfast",
  "Munchies",
  "Cold drinks & Juices",
  "Toppings",
  "Coffee & Health Drink",
  "Bakery & Biscuits",
  "Sweet Tooth",
  "Dry Fruits",
  "Flakes & Kids Cerenals",
];
export const categorySettings = {
  dots: false,
  infinite: false,
  speed: 500,
  slidesToShow: 5,
  slidesToScroll: 1,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 4 } },
    { breakpoint: 768, settings: { slidesToShow: 3 } },
    { breakpoint: 480, settings: { slidesToShow: 2 } },
  ],
};

export const PRODUCTS_SORT_BY = [
  { label: "Pris (Lågt till Högt)", value: "price_asc" },
  { label: "Pris (Högt till Lågt)", value: "-price_desc" },
  { label: "Datum (Nyast)", value: "created_at" },
  { label: "Datum (Äldst)", value: "-created_at" },
  { label: "Total Kvantitet (Högst till Lägst)", value: "total_quantity" },
  { label: "Total Kvantitet (Lägst till Högst)", value: "-total_quantity" },
];
export const ITEM_CATEGORY = [
  {
    category_image: item4,
    name: "Vegetables",
  },
  {
    category_image: item3,
    name: "Fruits",
  },
  {
    category_image: item2,
    name: "Seasonal",
  },
  {
    category_image: item6,
    name: "Exotics",
  },
  {
    category_image: item7,
    name: "Freshly Cut",
  },
  {
    category_image: item1,
    name: "Frozen",
  },
  {
    category_image: item5,
    name: "Herbs",
  },
];
export const SWEDEN_COUNTY_OPTIONS = [
  { label: "Stockholm", value: "Stockholm" },
  { label: "Västernorrland", value: "Västernorrland" },
  { label: "Västmanland", value: "Västmanland" },
  { label: "Västra Götaland", value: "Västra Götaland" },
  { label: "Östergötland", value: "Östergötland" },
  { label: "Dalarna", value: "Dalarna" },
  { label: "Gävleborg", value: "Gävleborg" },
  { label: "Gotland", value: "Gotland" },
  { label: "Halland", value: "Halland" },
  { label: "Jämtland", value: "Jämtland" },
  { label: "Jönköping", value: "Jönköping" },
  { label: "Kalmar", value: "Kalmar" },
  { label: "Kronoberg", value: "Kronoberg" },
  { label: "Norrbotten", value: "Norrbotten" },
  { label: "Örebro", value: "Örebro" },
  { label: "Skåne", value: "Skåne" },
  { label: "Södermanland", value: "Södermanland" },
  { label: "Uppsala", value: "Uppsala" },
  { label: "Värmland", value: "Värmland" },
  { label: "Västerbotten", value: "Västerbotten" },
  { label: "Blekinge", value: "Blekinge" },
  { label: "Nordmaling", value: "Nordmaling" },
];
export const IMAGE_CATEGORY = [
  {
    name: "Product",
    image: item4,
  },
  {
    name: "Product",
    image: item4,
  },
  {
    name: "Product",
    image: item4,
  },
  {
    name: "Product",
    image: item4,
  },
  //  {
  //     name: "Product",
  //     image: productImg,
  //   },
  //   {
  //     name: "Product",
  //     image: productImg,
  //   },
];
export const HEADER_NAV_OPTIONS = [
  // {
  //   name: "Produkter",
  //   url: "products",
  // },
  // { name: "Korgar", url: "baskets" },
  // { name: "Om oss", url: "about" },
  // {
  //   name: "Kontakta Frukto",
  //   url: "contact",
  // },
  {
    name: "Products",
    url: "products",
  },
  { name: "Baskets", url: "baskets" },
  { name: "About Us", url: "about" },
  {
    name: "Contact",
    url: "contact",
  },
];
export const BASKET_TYPE_OPTIONS = [
  // {
  //   label:"All",
  //   value:""
  // },
  {
    label: "Ej anpassningsbar",
    value: false,
  },
  {
    label: "Anpassningsbar",
    value: true,
  },
];

export const BUTTON_TYPE = {
  button: "button",
  submit: "submit",
};

export const stripHtmlTags = (str) => {
  return str?.replace(/<\/?[^>]+(>|$)/g, "");
};

const date = new Date();
export const RESEND_OTP_TIMER = 1 * 60; //In minutes
// orders statuses
export const PAYMENT_PENDING = "payment_pending";
export const DELIVERED = "delivered";
export const IN_PROGRESS = "in_progress";
export const REJECTED = "rejected";
export const CANCELED = "canceled";
export const IN_TRANSIT = "in_transit";

export const profileValidations = {
  first_name: {
    required: "First Name is required",
  },
  last_name: {
    required: "Last Name is required",
  },
  organization_no: {
    required: "Organization Number is required",
  },
  email: {
    required: "Email address is required",
    pattern: {
      value: EMAIL_REGEX,
      message: INVALID_EMAIL_MESSAGE,
    },
  },
  phone_number: {
    required: "Phone number is required",
    minLength: {
      value: 10,
      message: "Phone number must be exactly 10 digits",
    },
  },
  old_password: {
    required: "Old password is required",
  },
  new_password: {
    required: "New password is required",
  },
  confirm_password: {
    required: "Confirm password is required",
  },
  address_one: {
    required: "This field is required",
  },
  address_two: {
    required: "This field is required",
  },
  company_name: {
    required: "Company name is required",
  },
  company_email: {
    required: "Company email is required",
    pattern: {
      value: EMAIL_REGEX,
      message: INVALID_EMAIL_MESSAGE,
    },
  },
  vat_id: {
    required: "VAT ID is required",
  },
  // company_address: {
  //   required: "Company address is required",
  // },
  // zip_code: {
  //   required: "ZIP code is required",
  // },
  // business_type: {
  //   required: "Business type is required",
  // },
};
export const EMAIL_ADDRESS = "order@frukto.se";
export const EMAIL_REQUIRED = "E-postadress är obligatorisk";
export const NAME_REQUIRED = "Namn är obligatoriskt";
export const VALID_EMAIL = "Vänligen ange en giltig e-postadress";
export const ENTER_COMPANY_NAME = "Ange företagsnamn";
export const COMPANY_NAME = "Företagsnamn";
export const ENTER_COMPANY_SIZE = "Ange företagsstorlek";
export const COMPANY_SIZE = "Företagsstorlek";
export const PHONE_NUMBER_REQUIRED = "Telefonnummer är obligatorisk";
export const TELEPHONE_NUMBER = "Telefonnummer";
export const VALID_PHONE_NUMBER = "Vänligen ange ett giltigt svenskt telefonnummer som börjar med 46 eller 0 följt av 9 siffror.";


