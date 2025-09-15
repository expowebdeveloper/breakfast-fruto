import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cartList: [],
};

export const addToCartSlice = createSlice({
  name: "AddToCart",
  initialState,
  reducers: {
    setCartList: (state, action) => {
      state.cartList = action.payload;
    },
  },
});

export const { setCartList } = addToCartSlice.actions;
export const addToCartReducer = addToCartSlice.reducer;
