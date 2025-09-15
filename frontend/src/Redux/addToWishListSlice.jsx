import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  wishList: [],
};

export const addToWishListSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    setWishList: (state, action) => {
      state.wishList = action.payload;
    },
    addToWishList: (state, action) => {
      state.wishList.push(action.payload);
    },
    removeFromWishList: (state, action) => {
      state.wishList = state.wishList.filter(
        (item) => item.product_id !== action.payload.product_id
      );
    },
  },
});

export const { setWishList, addToWishList, removeFromWishList } =
  addToWishListSlice.actions;
  
export default addToWishListSlice.reducer;
