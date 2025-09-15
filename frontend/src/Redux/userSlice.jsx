import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  token: null,
  first_name: "",
  last_name: "",
  email: "",
  showCategories: false,
  showCartSidebar: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.token = action.payload.token;
      state.first_name = action.payload.first_name;
      state.last_name = action.payload.last_name;
      state.email = action.payload.email;
    },
    updateUser: (state, action) => {
      state.first_name = action.payload.first_name || state.first_name;
      state.last_name = action.payload.last_name || state.last_name;
      state.email = action.payload.email || state.email;
    },
    setShowCartSidebar: (state, action) => {
      state.showCartSidebar = action.payload;
    },
    clearUser: (state) => {
      state.token = null;
      state.first_name = "";
      state.last_name = "";
      state.email = "";
    },
    setShowCategories: (state, action) => {
      state.showCategories = action.payload;
    },
  },
});

export const {
  setUser,
  updateUser,
  clearUser,
  setShowCategories,
  setShowCartSidebar,
} = userSlice.actions;
export const userReducer = userSlice.reducer;
