import { useState } from "react";
import { T } from "./LanguageTranslator";
import { SWEDEN_COUNTY_OPTIONS } from "@/_constants/constant";
import moment from "moment";

// export const returnAddressInfo = (addressComponents) => {
//   if (addressComponents) {
//     const countryObj = addressComponents?.find((component) =>
//       component.types.includes("country")
//     );

//     const stateObj = addressComponents?.find((component) =>
//       component.types.includes("administrative_area_level_1")
//     );

//     const cityObj = addressComponents?.find(
//       (component) =>
//         component.types.includes("locality") ||
//         component.types.includes("sublocality") ||
//         component.types.includes("administrative_area_level_2") ||
//         component.types.includes("route")
//     );
//     const city = cityObj?.long_name;

//     return {
//       country: countryObj?.short_name || null,
//       state: stateObj?.short_name || null,
//       city: cityObj?.long_name || null,
//     };
//   }
// };

// export const manageUserAuthorization = ({
//   action,
//   token = null,
//   refreshToken = null,
// }) => {
//   if (action === "remove") {
//   } else {
//     Cookies.set("token", token);
//     Cookies.set("refreshToken", refreshToken);
//     localStorage.setItem("token", token);
//     localStorage.setItem("refreshToken", refreshToken);
//   }
// };  // not in use

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
// export const baseURL = "http://13.48.246.188:8002/"; // for future use

// Custom Hook: useItemCount

// export const useItemCount = () => {
//   const [count, setCount] = useState(0);

//   const increase = () => setCount(prevCount => prevCount + 1);

//   const decrease = () => {
//     if (count > 0) {
//       setCount(prevCount => prevCount - 1);
//     }
//   };

//   const reset = () => setCount(0);

//   return {
//     count,
//     increase,
//     decrease,
//     reset
//   };
// };
export const createRequiredValidation = (fieldName, customMessage) => {
  if (customMessage) {
    // if custom message is true then inside fieldname custom message will be passed
    return { required: customMessage };
  } else {
    const field = fieldName || "This field";
    return { required: `${field} is required` };
  }
};

export function getCurrentDate(location) {
  const date = new Date();
  if (location === "india") {
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } else {
    return date.toLocaleString("sv-SE", {
      timeZone: "Europe/Stockholm",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // 24-hour format
    });
  }
}

export async function getWeather(countryCode = "SE") {
  const API_KEY = "YOUR_OPENWEATHER_API_KEY";

  try {
    // Step 1: Get User's Location (City) via IP
    const locationRes = await fetch("https://ipapi.co/json/");
    const locationData = await locationRes.json();

    if (!locationData.city || locationData.country !== countryCode) {
      throw new Error("Unable to determine city");
    }

    const city = locationData.city; // Auto-detected city

    // Step 2: Fetch Weather Data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},${countryCode}&units=metric&appid=${API_KEY}`;
    const weatherRes = await fetch(weatherUrl);
    const weatherData = await weatherRes.json();

    return `${Math.round(weatherData.main.temp)}°C, ${
      weatherData.weather[0].description
    } in ${city}`;
  } catch (error) {
    console.error("Error fetching weather:", error);
    return "Weather Unavailable";
  }
}

export const extractProducts = (products = [], count = 4) => {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }
  return products.slice(0, count);
};

export const cleanFilters = (filters) => {
  return Object.keys(filters).reduce((acc, key) => {
    if (filters[key]) {
      // acc[key] = encodeURIComponent(filters[key]); // Encode the value
      acc[key] = filters[key];
    }
    return acc;
  }, {});
};

export const formatDate = (date, format) => {
  if (date && format) {
    return moment(date).format(format);
  }
};

export const createPreview = (image) => {
  console.log(image, "inside create preview");
  if (image) {
    console.log(`${baseURL}${image}`, "sasad");
    return `${baseURL}${image}`;
  } else {
    return null;
  }
};
export const getWishlistMessage = (isLiked) => {
  return isLiked
    ? T["product_removed_from_wishlist"]
    : T["product_added_to_wishlist"];
};

export const sumQuantities = (items) => {
  if (items?.length) {
    return items.reduce((total, item) => total + item.quantity, 0);
  } else {
    return 0;
  }
};
export const SORT_VALUES = ["asc", "desc"];
export const onPageChange = (selectedPage, setPage) => {
  // react paginated gives page inside selected object and also it is one less than the actual page
  const { selected } = selectedPage;
  const page = selected + 1;
  setPage(page);
};
export const formatTimeTo12Hour = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // Convert 0 or 12 to 12, and 13-23 to 1-11
  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

export const createProductParams = (
  selectedCategory,
  page,
  sortBy,
  selectedSubCategory
) => {
  let temp = {};

  if (selectedCategory === "All") {
    temp = { page };
  } else {
    temp = {
      page,
      search: selectedSubCategory
        ? selectedSubCategory?.name
        : selectedCategory?.name || selectedCategory,
    };
  }

  // Sorting logic
  if (sortBy) {
    if (SORT_VALUES.includes(sortBy)) {
      temp["sort"] = sortBy;
      temp["sort_by"] = "";
    } else {
      temp["sort_by"] = removeLeadingDash(sortBy);
      temp["sort"] = getSortValue(sortBy);
    }
  }

  return temp;
};

export const createWishlistParams = (sortBy) => {
  let temp = {};

  if (sortBy) {
    if (SORT_VALUES.includes(sortBy)) {
      temp["sort"] = sortBy;
      temp["sort_by"] = "";
    } else {
      temp["sort_by"] = removeLeadingDash(sortBy);
      temp["sort"] = getSortValue(sortBy);
    }
  }

  return temp;
};

export const removeLeadingDash = (value) => {
  if (value.startsWith("-")) {
    return value.slice(1);
  }
  return value;
};

export const getSortValue = (value) => {
  if (value.startsWith("-") || value === "z_to_a") {
    return "desc";
  } else {
    return "asc";
  }
};

export const checkisEligible = (basket, productId) => {
  const products = basket?.products_detail || [];
  console.log(productId, "products inside isEligible");
  const index = products?.findIndex((itm) => itm?.id == productId);
  console.log(basket, productId, index, "inside is eligible");
  return index !== -1;
};

export const getCurrentUserBasket = (userBaskets, selectedBasket) => {
  console.log(userBaskets, "inside helper");
  console.log(selectedBasket, "inside helper");
  const selectedBasketId = selectedBasket?.id;

  if (userBaskets?.length) {
    const currentBasket = userBaskets?.find(
      (basket) =>
        basket?.original_basket?.original_basket_id == selectedBasket?.id
    );
    return currentBasket;
  }
};

export const getTotalPrice = (products) => {
  if (!products?.length) {
    return 0;
  }

  return products.reduce((total, product) => {
    const price = product?.product_variant?.inventory?.regular_price || 0;
    return total + price * (product.quantity || 0);
  }, 0);
};

export const getTotalQuantity = (products) => {
  if (!Array.isArray(products) || products.length === 0) return 0;

  return products.reduce((total, product) => {
    const quantity = Number(product?.quantity) || 0; // Ensure it's a number
    return total + quantity;
  }, 0);
};

export const extractOption = (options, valueToExtract, key) => {
  if (options?.length && valueToExtract) {
    const elem = options?.find((curElem) => curElem?.[key] == valueToExtract);
    return elem;
  }
};

export const extractImageUrls = (images) => {
  if (images?.length) {
    const filteredImages = images.filter((image) => !image.isFeature);
    const imageUrls = filteredImages.map((image) => image.image);
    return imageUrls;
  } else {
    return [];
  }
};
export const returnAddressInfo = (addressComponents) => {
  if (!addressComponents) {
    return { country: null, state: null, city: null, zip: null };
  }

  const countryObj = addressComponents.find((component) =>
    component.types.includes("country")
  );

  const stateObj = addressComponents.find((component) =>
    component.types.includes("administrative_area_level_1")
  );

  // Include postal_town as a fallback for city if locality or sublocality is not present
  const cityObj = addressComponents.find(
    (component) =>
      component.types.includes("locality") ||
      component.types.includes("sublocality") ||
      component.types.includes("administrative_area_level_2") ||
      component.types.includes("postal_town") || // Fallback for city
      component.types.includes("route") // Even fallback to street name
  );

  const zipObj = addressComponents.find((component) =>
    component.types.includes("postal_code")
  );
  console.log(zipObj, "this is zip obj");

  return {
    country: countryObj?.short_name || null,
    state: stateObj?.short_name || "Unknown State", // Fallback to a placeholder value
    city: cityObj?.long_name || "Unknown City", // Fallback to a placeholder value
    zip: zipObj?.long_name || null, // Return null if postal code is not found
  };
};
export const getState = (stateName) => {
  if (!stateName) return null;

  const match = SWEDEN_COUNTY_OPTIONS.find((option) =>
    stateName.toLowerCase().includes(option.label.toLowerCase())
  );

  return match ? match.value : null;
};

export const handlePrintPdf = async (url) => {
  // Ensure the URL starts with a slash
  if (!url?.startsWith("/")) {
    url = "/" + url;
  }

  const base_url = process.env.NEXT_PUBLIC_BASE_URL;

  const absoluteUrl = `${base_url}${url}`;

  try {
    const response = await fetch(absoluteUrl);

    if (!response.ok) {
      throw new Error("Failed to fetch the PDF");
    }

    const responseData = await response.blob();
    const pdfUrl = window.URL.createObjectURL(responseData);
    const printWindow = window.open(pdfUrl);

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      console.error("Failed to open print window. Please allow pop-ups.");
    }
  } catch (error) {
    console.error("Error loading PDF:", error);
  }
};

export const truncateString = (string, length = 20) => {
  if (!string) return "";
  return string?.length > length ? string.slice(0, length) + "..." : string;
};
