"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setShowCartSidebar } from "@/Redux/userSlice";
import { crossIcon } from "@/_Svgs/Svg";
import { T } from "@/_utils/LanguageTranslator";
import Button from "./_common/Button";
import SingleCartItem from "./SingleCartItem";
import SingleBasketItem from "./SingleBasketItem";
import { callApi, fetchCart, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import axios from "axios";
import AddLoginModal from "./_common/Modals/AddLoginModal";
import { successType, toastMessages } from "@/_utils/toastMessage";
import DeleteConfirmationModal from "./_common/DeleteConfirmationModal";
import { DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import { ADD_TO_CART } from "@/_Api-Handlers/APIUrls";
import { useRouter } from "next/navigation";

export default function CartSidebar({ handleConfirm, confirmLoader }) {
    const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

    const dispatch = useDispatch();
    const { showCartSidebar } = useSelector((state) => state?.user);
    const { cartList } = useSelector((state) => state?.addToCart);

    const token = localStorage.getItem("token");
    const [removeItemInfo, setRemoveItemInfo] = useState({
        show: false,
        id: null,
    });

    const [cart, setCart] = useState({});
    const router = useRouter();
    const [pageLoader, setPageLoader] = useState(false);
    const [buttonLoader, setButtonLoader] = useState(false);
    const [giftWrap, setGiftWrap] = useState(false);
    const [showClearCartModal, setShowClearCartModal] = useState(false);
    const [giftWrapPrice, setGiftWrapPrice] = useState(0);
    const [cartItems, setCartItems] = useState(0);
    const [showModal, setShowModal] = useState(false);
    useEffect(() => {
        getCart();
    }, [showCartSidebar, cartList]);
    console.log(cartItems, "cart items inside cart sidebar");

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
    const getCart = async () => {
        console.log("insid updated fetch cart");
        const apiUrl = `${baseURL}/cart/`;
        const token = localStorage.getItem("token");
        setPageLoader((prev) => true);

        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

            const response = await axios.get(apiUrl, {
                headers,
                withCredentials: true,
            });
            console.log(response?.data, "response?.dataresponse?.dataresponse?.data");
            setCart(response?.data);
            setCartItems(response?.data?.items?.length ? response?.data?.items : []);
            setGiftWrap(response?.data?.is_gift_wrap);
        } catch (err) {
            console.log(err, "this is cart error");
        } finally {
            setPageLoader((prev) => false);
        }
    };

    const addProductToBasket = (id, quantity, userBasketId) => {
        // if (selectedBasket?.id) {
        setPageLoader((prev) => true);
        const payload = {
            products: [
                {
                    product_variant_id: id,
                    quantity: quantity,
                },
            ],
        };

        callApi({
            endPoint: `/user-basket/${userBasketId ? userBasketId : selectedBasket?.id
                }/`,
            method: METHODS.patch,
            instanceType: INSTANCE.authorize,
            payload: payload,
        })
            .then((res) => {
                console.log(res, "basket response");
                toastMessages(
                    res?.data?.message || T["product_added_to_basket"],
                    successType
                );
                fetchUserBasket(dispatch, setPageLoader);
                getCart();
            })
            .catch((err) => {
                console.log(err, "basket errs");
                toastMessages(err?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
            })
            .finally(() => {
                setPageLoader((prev) => false);
            });
        // } else {
        //   //   setShowModal(true);
        // }
    };

    const onClearCartClick = () => {
        setShowClearCartModal(true);
    };

    // const handleGiftWrap = (e) => {
    //   const checked = e.target.checked;
    //   setGiftWrap(checked);
    //   console.log(checked, "this is gift wrap");
    // };
    console.log(
        Number(cart?.total_with_vat) + Number(cart?.gift_wrap_price || 0),
        "priceasdasd"
    );

    const handleGiftWrap = (e) => {
        const token = localStorage.getItem("token");
        const checked = e.target.checked;
        console.log(checked, "checked");
        if (!token) {
            setShowModal(true);
            return;
        }
        callApi({
            endPoint: "/cart/",
            method: METHODS.patch,
            instanceType: INSTANCE.authorize,
            payload: {
                is_gift_wrap: checked,
            },
        })
            .then((res) => {
                getCart();
                setGiftWrap(checked);
            })
            .catch((err) => {
                console.log(err, "gift wrap error");
            });
    };

    const addBasketToCart = (basketId, newQuantity, cart_item_id) => {
        const payload = {
            user_basket_id: basketId,
            quantity: newQuantity,
        };
        setPageLoader((prev) => true);
        callApi({
            endPoint: newQuantity == 0 ? `${ADD_TO_CART}${basketId}/` : ADD_TO_CART,
            method: newQuantity == 0 ? METHODS.delete : METHODS.patch,
            instanceType: INSTANCE.authorize,
            payload: newQuantity == 0 ? null : payload,
            params:
                newQuantity == 0
                    ? {}
                    : {
                        cart_item_id: newQuantity,
                    },
        })
            .then((res) => {
                toastMessages(
                    newQuantity == 0
                        ? T["basket_removed_from_cart"]
                        : res?.data?.message || T["basket_quantity_updated_to_cart"],
                    successType
                );
                fetchCart(dispatch, setPageLoader);
                getCart();
            })
            .catch((err) => {
                console.log(err, "cart error");
                toastMessages(
                    err?.response?.data?.error ||
                    err?.response?.data?.message ||
                    DEFAULT_ERROR_MESSAGE
                );
            })
            .finally(() => {
                setPageLoader((prev) => false);
            });
    };

    const handleClearCart = async () => {
        const apiUrl = `${baseURL}/cart/empty_cart/${cart?.id}/`;
        const token = localStorage.getItem("token");
        setButtonLoader(true);
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
            const response = await axios.delete(apiUrl, {
                headers,
                withCredentials: true,
            });
            toastMessages(
                response?.data?.message || T["cart_cleared_successfully"],
                successType
            );
            fetchCart(dispatch, setPageLoader);
            getCart();
        } catch (err) {
            console.error("Error clearing cart:", err);
            toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
        } finally {
            setButtonLoader(false);
            setShowClearCartModal(false);
        }
    };

    const addToCart = (variant_id, quantity, cart_item_id) => {
        console.log(variant_id, quantity, "product");
        const payload = {
            product_variant: variant_id,
            quantity: quantity,
        };
        setPageLoader((prev) => true);
        callApi({
            endPoint: quantity == 0 ? `${ADD_TO_CART}${variant_id}/` : ADD_TO_CART,
            method: quantity == 0 ? METHODS.delete : METHODS.patch,
            instanceType: INSTANCE.authorize,
            payload: quantity == 0 ? null : payload,
            params: quantity == 0 ? {} : { cart_item_id: cart_item_id },
        })
            .then((res) => {
                toastMessages(
                    quantity === 0
                        ? T["product_removed_from_cart"]
                        : T["product_added_to_cart"],
                    successType
                );
                fetchCart(dispatch, setPageLoader);
                getCart();
                // setShowSelectBasketModal(!showSelectModal);
            })
            .catch((err) => {
                toastMessages(
                  err?.response?.data?.error?.toLowerCase().includes('sorry! we are out of stock')
                    ? T["out_of_stock"]
                    : err?.response?.data?.error || DEFAULT_ERROR_MESSAGE
                );
            })
            .finally(() => {
                setPageLoader((prev) => false);
            });
    };

    const handleRemoveItem = async (type = "cart-item") => {
        const apiUrl = `${baseURL}/cart/item/${removeItemInfo?.id}/`;
        // type === "cart-item"
        // : `${baseURL}/cart/basket/${removeItemInfo?.id}`;
        const token = localStorage.getItem("token");
        setButtonLoader(true);
        try {
            const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
            // update method and pass query param/payload/path param accordingly
            const response = await axios.delete(apiUrl, {
                headers,
                withCredentials: true,
            });
            toastMessages(
                response?.data?.message || T["item_removed_from_cart_successfully"],
                successType
            );
            fetchCart(dispatch, setPageLoader);
            getCart();
        } catch (err) {
            console.error("Error clearing cart:", err);
            toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
        } finally {
            setButtonLoader(false);
            setRemoveItemInfo({
                show: false,
                id: null,
            });
        }
    };

    return (
        <>
            <div className={`${showCartSidebar ? "translate-x-[0%]" : "translate-x-[110%]"} cart-sidebar duration-300 fixed top-0 right-0 h-screen max-w-[390px] w-full bg-white p-4 rounded-lg shadow-md`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">{T["your_cart"]}</h2>
                    <div className="flex items-center gap-2">
                        {/* <button className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-1 rounded">
                Remove All
              </button> */}
                        <button
                            onClick={() => dispatch(setShowCartSidebar(false))}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            {crossIcon}
                        </button>
                    </div>
                </div>

                <div>
                    <div
                        
                    >
                        {cartItems?.length ? (
                            <div className="flex justify-start align-center mb-3">
                                <button
                                    className="text-center rjustify-center bg-green-500 text-white py-2 px-4 rounded-md"
                                    onClick={onClearCartClick}
                                >
                                    {T["clear_cart_button"]}
                                </button>
                            </div>
                        ) : null}

                        <div
                            className={`flex flex-col justify-between ${token ? "h-[93%]" : "h-[100%]"
                                }`}
                        >
                            <div className="overflow-y-auto h-[calc(100vh-400px)]">
                                <div>
                                    {cartItems?.length ? (
                                        cartItems.map((dt) =>
                                            dt?.basket_details?.id ? (
                                                <SingleBasketItem
                                                    key={dt?.id}
                                                    data={dt}
                                                    addBasketToCart={addBasketToCart}
                                                    addProductToBasket={addProductToBasket}
                                                    onRemoveItemClick={() =>
                                                        setRemoveItemInfo({
                                                            show: true,
                                                            id: dt?.id,
                                                        })
                                                    }
                                                />
                                            ) : (
                                                <SingleCartItem
                                                    key={dt?.id}
                                                    data={dt}
                                                    onRemoveItemClick={() =>
                                                        setRemoveItemInfo({
                                                            show: true,
                                                            id: dt?.id,
                                                        })
                                                    }
                                                    addToCart={addToCart}
                                                />
                                            )
                                        )
                                    ) : (
                                        <div>{T["no_items_found"]}</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between mt-2 border-t border-b border-[#E1D0C6] py-[10px]">
                                    <div>
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={giftWrap}
                                            onChange={handleGiftWrap}
                                            id="flexCheckDefault"
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

                                <div className="flex justify-between mt-4">
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

                                <div className="flex justify-between mt-2">
                                    <span className="font-semibold">{T["delivery_fee"]}</span>
                                    <span className="font-semibold">
                                        {cart?.delivery_fees || "0.00"} SEK
                                    </span>
                                </div>

                                {cart?.applied_coupon && (
                                    <div className="flex justify-between text-green-600">
                                        <p>{`Discount Applied (${cart?.applied_coupon_name})`}</p>
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
                                    btnType="button"
                                    btnClick={() => {
                                        router.push("/cart");
                                        dispatch(setShowCartSidebar(false));
                                    }}
                                    btnText={T["checkout"]}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {showModal && (
                <AddLoginModal
                    closeModal={() => setShowModal(false)}
                    setShowLoginModal={setShowModal}
                />
            )}

            {showClearCartModal && (
                <DeleteConfirmationModal
                    title={T["clear_cart_confirmation_title"]}
                    description={T["clear_cart_confirmation_description"]}
                    onCancel={() => setShowClearCartModal(false)}
                    loader={buttonLoader}
                    onDelete={handleClearCart}
                    deleteText={T["clear"]}
                />
            )}
            {removeItemInfo?.show && (
                <DeleteConfirmationModal
                    title={T["remove_item_title"]}
                    description={T["remove_item_description"]}
                    onCancel={() => setRemoveItemInfo({ show: false, id: null })}
                    loader={buttonLoader}
                    onDelete={handleRemoveItem}
                    deleteText={T["remove"]}
                />
            )}
        </>
    );
}
