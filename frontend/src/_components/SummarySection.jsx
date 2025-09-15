import { T } from "@/_utils/LanguageTranslator";
import React, { useEffect, useState } from "react";
import SingleCartItem from "./SingleCartItem";
import Button from "./_common/Button";
import SingleBasketItem from "./SingleBasketItem";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";

const SummarySection = ({
  cart,
  addToCart,
  handleConfirm,
  confirmLoader,
  addBasketToCart,
  addProductToBasket,
  handleGiftWrap,
  giftWrap,
  onClearCartClick,
  onRemoveItemClick,
}) => {
  const [giftWrapPrice, setGiftWrapPrice] = useState(0);
  useEffect(() => {
    callApi({
      endPoint: "/cart/cart-config/",
      instanceType: INSTANCE.authorize,
      method: METHODS.get,
    })
      .then((res) => {
        console.log(res, "thsi is response");
        setGiftWrapPrice(res?.data?.gift_wrap_price);
      })
      .catch((err) => { })
      .finally(() => { });
  }, []);
  const token = localStorage.getItem("token");
  const cartItems = cart?.items?.length ? cart?.items : [];
  console.log(cartItems, "these are cart items");
  // const handleGiftWrap = (e) => {
  //   const checked = e.target.checked;
  //   setGiftWrap(checked);
  //   console.log(checked, "this is gift wrap");
  // };
  return (
    <div>
      {" "}
      <h2 className="text-xl text-black font-bold mb-0">{T["summary"]}</h2>
      <div
        className={
          token
            ? "bg-white p-4 rounded-lg shadow-md"
            : "bg-white p-4 rounded-lg shadow-md"
        }
      >
        {cartItems?.length ? (
          <div className="flex justify-end align-center mb-3">
            <button
              className="bg-green-500 text-white py-2 px-4 rounded-md"
              onClick={() => {
                onClearCartClick();
              }}
            >
              {T["clear_cart"]}
            </button>
          </div>
        ) : (
          ""
        )}
        <div
          className={`flex flex-col justify-between ${token ? "h-[93%]" : "h-[100%]"
            }`}
        >
          <div>
            <div>
              {cartItems?.length
                ? cartItems?.map((dt) =>
                  dt?.basket_details?.id ? (
                    <SingleBasketItem
                      key={dt?.id}
                      data={dt}
                      addBasketToCart={addBasketToCart}
                      addProductToBasket={addProductToBasket}
                      onRemoveItemClick={onRemoveItemClick}
                    />
                  ) : (
                    <SingleCartItem
                      key={dt?.id}
                      data={dt}
                      addToCart={addToCart}
                      onRemoveItemClick={onRemoveItemClick}
                    />
                  )
                )
                : T["no_items_found"]}
            </div>
          </div>

          <div>
            <div className="flex  justify-between mt-2 border-t border-b border-[#E1D0C6] py-[10px]">
              <div>
                <input
                  className="form-check-input"
                  type="checkbox"
                  value=""
                  checked={giftWrap}
                  //   onChange={(e) => handleRememberMe(e)}
                  onChange={(e) => handleGiftWrap(e)}
                  id="flexCheckDefault"
                //   checked={rememberMe}
                />
                <label
                  className="text-[16px] font-normal ml-1"
                  htmlFor="flexCheckDefault"
                >
                  {T["gift_wrap"]}
                </label>
              </div>
              <span className="font-semibold">
                {giftWrapPrice || "0.00"} SEK
              </span>
            </div>
            <div className="flex justify-between mt-4 ">
              <span className="font-semibold">{T["subtotal"]}</span>
              <span className="font-semibold">
                {cart?.total_price || "0.00"} SEK
              </span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-semibold">{T["vat"]}</span>
              <span className="font-semibold">
                {cart?.vat_amount || "0.00"} SEK
              </span>
            </div>
            {/* <div className="flex justify-between mt-2">
              <span className="font-semibold">{T["platform_fee"]}</span>
              <span className="font-semibold">
                {cart?.platform_fee || "0.00"} SEK
              </span>
            </div> */}
            <div className="flex justify-between mt-2">
              <span className="font-semibold">{T["delivery_fee"]}</span>
              <span className="font-semibold">
                {cart?.delivery_fees || "0.00"} SEK
              </span>
            </div>
            {/* <div className="flex justify-between mt-2">
              <span className="font-semibold">{T["packing_fee"]}</span>
              <span className="font-semibold">
                {cart?.packing_fee || "0.00"} SEK
              </span>
            </div> */}
            {/* <div className="flex justify-between mt-2">
              <span className="font-semibold">{T["shipping_charges"]}</span>
              <span className="font-semibold">
                {cart?.shipping_cost || "0.00"} SEK
              </span>
            </div> */}
            {cart?.applied_coupon && (
              <div className="flex justify-between text-green-600">
                <p>{`${T["discount_applied"]} (${cart?.applied_coupon_name}) `}</p>
                <p>{`- ${cart?.discounted_price || "0.00"} SEK`}</p>
              </div>
            )}
            <div className="flex justify-between mt-2 border-t pt-2">
              <span className="font-bold">{T["total"]}</span>
              <span className="font-bold text-lg text-[#22c55e]">
                {cart?.total_with_vat} SEK
              </span>
            </div>

            <Button
              className="mt-5 bg-[#22c55e] text-white font-bold py-2 rounded-lg transition duration-200 w-full"
              btnType={"button"}
              btnClick={handleConfirm}
              btnLoader={confirmLoader}
              btnText={T["confirm_order"]}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummarySection;
