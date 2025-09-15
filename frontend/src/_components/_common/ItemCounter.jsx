"use client";
import React, { use, useEffect, useState } from "react";
import Button from "./Button";
import { useDispatch, useSelector } from "react-redux";
import {
  addItemToBasket,
  getSelectedBasketById,
  updateItemCount,
} from "@/Redux/addToBasketSlice";
import { setItemCounter } from "@/Redux/productCountSlice";
// import { useItemCount } from "@/_utils/helpers";

const ItemCounter = ({ item, itemCount, setItemCount, page }) => {
  const dispatch = useDispatch();
  const [productId, setProductId] = useState();

  const handleIncrease = (e, item) => {
    e.stopPropagation();

    setItemCount((prev) => prev + 1);
  };
  const handleDecrease = (e, item) => {
    e.stopPropagation();
    if (itemCount === 1) {
      return;
    }
    setItemCount((prev) => prev - 1);
  };

  return (
    <div className="flex items-center bg-[#F2F2F2] border rounded-[50px] border-gray-100 w-32 justify-center gap-1 p-[5px] plus-minus-card">
      <span
        className={
          itemCount > 0
            ? "enabled-decreament"
            : "enabled-decreament opacity-50 cursor-not-allowed"
        }
        onClick={handleDecrease}
      >
        -
      </span>
      <span className="text-xl w-10 h-10 flex items-center justify-center mob-quantity">
        {itemCount}
      </span>
      <span className="enabled-decreament" onClick={handleIncrease}>
        +
      </span>
    </div>
  );
};

export default ItemCounter;
