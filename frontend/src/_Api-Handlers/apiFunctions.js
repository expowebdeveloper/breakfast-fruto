import { INSTANCE } from "@/app/_constant/UrlConstant";
import { authAxios, authorizeAxios, baseURL } from "./apiConfig";
import { cleanFilters } from "@/_utils/helpers";
import { setWishList } from "@/Redux/addToWishListSlice";
import { CART_LIST, WISHLIST } from "./APIUrls";
import { setCartList } from "@/Redux/addToCartSlice";
import { setUserBasket } from "@/Redux/addToBasketSlice";
import axios from "axios";

export const METHODS = {
  get: "GET",
  post: "POST",
  put: "PUT",
  patch: "PATCH",
  delete: "DELETE",
};

export const callApi = async ({
  endPoint,
  method,
  params,
  payload,
  instanceType = INSTANCE.auth,
}) => {
  console.log(params, "these are params");
  try {
    let API_INSTANCE = null;
    if (instanceType === INSTANCE.auth) {
      API_INSTANCE = authAxios;
    } else if (instanceType === INSTANCE.formInstance) {
      API_INSTANCE = authorizeFileInstance;
    } else {
      API_INSTANCE = authorizeAxios;
    }

    switch (method) {
      case METHODS.get: {
        const config = params ? { params: { ...params } } : {};
        return await API_INSTANCE.get(endPoint, config);
      }

      case METHODS.post: {
        return await API_INSTANCE.post(endPoint, { ...payload });
      }

      case METHODS.put: {
        return await API_INSTANCE.put(endPoint, { ...payload });
      }

      case METHODS.patch: {
        return params && Object.keys(params)?.length
          ? await API_INSTANCE.patch(endPoint, payload, { params })
          : await API_INSTANCE.patch(endPoint, payload);
      }

      case METHODS.delete: {
        const config = {
          ...(payload && { data: payload }), // Include payload if provided
          ...(params && Object.keys(params)?.length && { params }), // Include params if provided
        };
        return await API_INSTANCE.delete(endPoint, config);
      }

      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  } catch (error) {
    console.log(`API call failed: ${error}`);
    throw error;
  }
};

export const login = (payload) => {
  return authAxios.post("/login/", payload);
};

export const fetchWishList = (dispatch, setPageLoader) => {
  callApi({
    endPoint: WISHLIST,
    method: METHODS.get,
    instanceType: INSTANCE.authorize,
  })
    .then((res) => {
      dispatch(setWishList(res?.data?.results || []));
      console.log(res, "this is wishlist");
    })
    .catch((err) => {
      console.log(err, "this is wishlist error");
    })
    .finally(() => {
      setPageLoader((prev) => false);
    });
};

export const fetchUserBasket = (dispatch, setPageLoader) => {
  setPageLoader((prev) => true);
  callApi({
    endPoint: "/user_basket/",
    method: METHODS.get,
    instanceType: INSTANCE.authorize,
  })
    .then((res) => {
      dispatch(setUserBasket(res?.data?.results || []));
      console.log(res, "this is user basket data");
    })
    .catch((err) => {
      console.log(err, "this is wishlist error");
    })
    .finally(() => {
      setPageLoader((prev) => false);
    });
};

// export const fetchCart = (dispatch, setPageLoader) => {
//   callApi({
//     endPoint: "/cart/",
//     method: METHODS.get,
//     instanceType: INSTANCE.authorize,
//   })
//     .then((res) => {
//       console.log(res, "cart item response");
//       dispatch(setCartList(res?.data?.cart_items || []));
//       console.log(res, "this is cart");
//     })
//     .catch((err) => {
//       console.log(err, "this is cart error");
//     })
//     .finally(() => {
//       setPageLoader((prev) => false);
//     });
// };

export const fetchCart = async (
  dispatch,
  setPageLoader,
  callback = () => {}
) => {
  console.log("insid updated fetch cart");
  const apiUrl = `${baseURL}/cart/`;
  const token = localStorage.getItem("token");
  setPageLoader(true);

  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

    const response = await axios.get(apiUrl, {
      headers,
      withCredentials: true,
    });

    console.log(response, "cart item response");

    await dispatch(setCartList(response?.data?.items || []));
    callback();
    console.log(response, "this is cart");
  } catch (err) {
    console.log(err, "this is cart error");
  } finally {
    setPageLoader(false);
  }
};

export const verifyEmail = (payload) => {
  return authAxios.post("/send-verification-email/", payload);
};
export const verifyEmailOTP = (payload) => {
  return authAxios.post("/verify-email/", payload);
};
