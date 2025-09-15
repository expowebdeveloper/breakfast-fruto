import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { BASKETS } from "@/_Api-Handlers/APIUrls";
import { DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import { T } from "@/_utils/LanguageTranslator";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedBasket: {},
  basketList: [],
  basket: [],
  userBasket: [],
};

const addToBasketSlice = createSlice({
  name: "addToBasket",
  initialState,
  reducers: {
    setSelectedBasket: (state, action) => {
      state.selectedBasket = { ...action.payload }; // Ensures a new reference
    },
    setBasketList: (state, action) => {
      state.basketList = action.payload;
    },
    setBasket: (state, action) => {
      state.basket = action.payload;
    },
    setUserBasket: (state, action) => {
      state.userBasket = action.payload;
    },
  },
});

export const { setSelectedBasket, setBasketList, setBasket, setUserBasket } =
  addToBasketSlice.actions;

export const getBasketList = () => {
  return async (dispatch) => {
    try {
      const res = await callApi({
        endPoint: BASKETS,
        method: METHODS.get,
        params: {
          page: 1,
        },
        instanceType: INSTANCE.authorize,
      });
      dispatch(setBasketList(res.data));
      toastMessages(res.data.message, successType);
    } catch (err) {
      console.log(err);
      toastMessages(err?.response?.data?.message, DEFAULT_ERROR_MESSAGE);
    }
  };
};
export const getSelectedBasketById = (id) => {
  return async (dispatch) => {
    try {
      const res = await callApi({
        endPoint: `/user-basket/${id}/`,
        method: METHODS.get,
        instanceType: INSTANCE.authorize,
      });
      dispatch(setBasket(res?.data));
      toastMessages(res.data.message, successType);
    } catch (err) {
      console.log(err);
      toastMessages(err?.response?.data?.message, DEFAULT_ERROR_MESSAGE);
    }
  };
};

export const addItemToBasket = (basketId, variantId, quantity) => {
  return async (dispatch) => {
    try {
      const res = await callApi({
        endPoint: `/user-basket/${basketId}/`,
        method: METHODS.post,
        instanceType: INSTANCE.authorize,
        payload: {
          products: [
            {
              product_variant_id: variantId,
              quantity: quantity,
            },
          ],
        },
      });
      console.log(res, "addItemToBasket");
      dispatch(setUserBasket(res?.data));
      toastMessages(res.data.message || T["product_added_to_basket_successfully"], successType);
      callback && callback();
    } catch (err) {
      console.log(err);
      toastMessages(err?.response?.data?.message, DEFAULT_ERROR_MESSAGE);
    }
  };
};

export const updateItemCount = (basketId, variantId, quantity, callback) => {
  return async (dispatch) => {
    try {
      const res = await callApi({
        endPoint: `/user-basket/${basketId}/`,
        method: METHODS.patch,
        instanceType: INSTANCE.authorize,
        payload: {
          products: [
            {
              product_variant_id: variantId,
              quantity: quantity,
            },
          ],
        },
      });
      dispatch(setUserBasket(res?.data));
      toastMessages(res.data.message, successType);
      callback && callback();
    } catch (err) {
      console.log(err);
      toastMessages(err?.response?.data?.message, DEFAULT_ERROR_MESSAGE);
    }
  };
};
export const addToBasketReducer = addToBasketSlice.reducer;
