import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { ADD_ADDRESS, BASKETS } from "@/_Api-Handlers/APIUrls";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { createSlice } from "@reduxjs/toolkit";
import { act } from "react";

const initialState = {
    itemDetails:[],
    itemQuantity : null,
    addressList:[],
    basketList:[]
};

export const productDetailsSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
   setItemsDetails :(state, action) => {
    state.itemDetails = action.payload;
  },
  setItemQuantity : (state, action) => {
    state.itemQuantity = action.payload;
  },
  setAddressList:(state,action) => {
    state.addressList = action.payload;
  },
  
}
})

export const { setItemsDetails, setItemQuantity,setAddressList} = productDetailsSlice.actions;

export const getAddressList = ()=>{
  return async (dispatch)=>{
    try {
      const res = await callApi({
        endPoint: ADD_ADDRESS,
        method: METHODS.get,
        instanceType: INSTANCE.authorize,
    })
    dispatch(setAddressList(res.data.results))
    } catch (err) {
      console.log(err);
    }
  };
}




export const productReducer = productDetailsSlice.reducer;

