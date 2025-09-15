import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  itemCount: [],
};

export const productCountSlice = createSlice({
  name: "AddToItemCounter",
  initialState,
  reducers: {
    setItemCounter: (state, action) => {
      const {id,count}=action.payload;
      const index = itemCount.findIndex((itm) => itm.id === id);
      if (index === -1) {
        state.itemCount = [
          ...itemCount,
          {
            id: action.payload.id,
            count: action.payload.count,
          },
        ];
      } else {
        const tempItemCount = [...itemCount];
        tempItemCount[i].count = count;
        state.itemCount = tempItemCount;
      }
    },
  },
});

export const { setItemCounter } = productCountSlice.actions;
export const productCountReducer = productCountSlice.reducer;
