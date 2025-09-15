import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { productReducer } from "./productDetailsSlice";
import addToWishListReducer from "./addToWishListSlice";
import { addToBasketReducer } from "./addToBasketSlice";
import storage from "redux-persist/lib/storage";
import persistReducer from "redux-persist/es/persistReducer";
import persistStore from "redux-persist/es/persistStore";
import { addToCartReducer } from "./addToCartSlice";
import { productCountSlice } from "./productCountSlice";
import { userReducer } from "./userSlice";

const persistConfig = {
  key: "basket",
  storage,
  whitelist: ["addToBasket"],
};

const rootReducer = combineReducers({
  product: productReducer,
  user: userReducer,
  addToWishList: addToWishListReducer,
  addToBasket: addToBasketReducer,
  addToCart: addToCartReducer,
  AddToItemCounter: productCountSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
