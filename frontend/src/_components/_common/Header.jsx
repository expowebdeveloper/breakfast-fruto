"use client";
import {
  callApi,
  fetchCart,
  fetchUserBasket,
  fetchWishList,
  METHODS,
  updatedFetchCart,
} from "@/_Api-Handlers/apiFunctions";
import {
  CART_LIST,
  NOTIFICATION_UPDATE_ENDPOINT,
  WISHLIST,
} from "@/_Api-Handlers/APIUrls";
import {
  DEFAULT_ERROR_MESSAGE,
  HEADER_NAV_OPTIONS,
} from "@/_constants/constant";
import { BASKET_HEADER_ICON } from "@/_Svgs/Svg";
import {
  getCurrentDate,
  getCurrentUserBasket,
  getWeather,
} from "@/_utils/helpers";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import {
  activeBellIcon,
  BellIcon,
  CalenderImg,
  CallIcon,
  CART1,
  CartListIcon,
  CloudImg,
  DummyUser,
  WishListIcon,
} from "@/Assets/Icons/Svg";
import { LOGO } from "@/Assets/Images";
import { SwedenFlagIcon } from "@/Assets/SVGIcons";
import { setCartList } from "@/Redux/addToCartSlice";
import { setWishList } from "@/Redux/addToWishListSlice";
import { persistor } from "@/Redux/store";
import { setShowCategories } from "@/Redux/userSlice";
import Cookies from "js-cookie";
import moment from "moment";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

const Header = () => {
  const socket = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const [realTimeNotification, setRealTimeNotification] = useState();
  const [notification, setNotification] = useState(false);
  const notificationDropdownRef = useRef(null);
  const [notificationData, setNotificationData] = useState([]);

  const dispatch = useDispatch();
  const { wishList } = useSelector((state) => state?.addToWishList);
  const { showCategories } = useSelector((state) => state?.user);
  const { selectedBasket, basketList, basket, userBasket } = useSelector(
    (state) => state?.addToBasket
  );

  const { cartList } = useSelector((state) => state.addToCart);
  const urlName = pathname.split("/")[1];
  const [profileStatus, setProfileStatus] = useState();
  const [pageLoader, setPageLoader] = useState(false);
  const token = localStorage.getItem("token");
  const currentUserBasket = getCurrentUserBasket(userBasket, selectedBasket);

  useEffect(() => {
    if (token) {
      setProfileStatus("Min konto");
      callApi({
        endPoint: WISHLIST,
        method: METHODS.get,
        instanceType: INSTANCE.authorize,
      })
        .then((res) => {
          dispatch(setWishList(res.data.wishlist));
          toastMessages(res.data.message, successType);
        })
        .catch((err) => {
          toastMessages(err?.response?.data?.detail || DEFAULT_ERROR_MESSAGE);
        });
    } else {
      setProfileStatus("Logga in");
    }
  }, []);
  useEffect(() => {
    fetchCart(dispatch, setPageLoader);
    fetchWishList(dispatch, setPageLoader);
  }, []);

  // useEffect(() => {
  //   callApi({
  //     endPoint: CART_LIST,
  //     method: METHODS.get,
  //     instanceType: INSTANCE.authorize,
  //   })
  //     .then((res) => {
  //       dispatch(setCartList(res.data));
  //       toastMessages(res.data.message, successType);
  //     })
  //     .catch((err) => {
  //       toastMessages(err?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
  //     });
  // }, []);

  const handleAllCategories = () => {
    router.push("/products");
  };

  const handleLogin = () => {
    router.push("/login");
  };
  const handleLogout = () => {
    localStorage.clear();
    Cookies.remove("token");
    // Clear persisted Redux state
    persistor.purge();
    sessionStorage.removeItem("welcome-modal-shown");

    router.push("/login");
  };

  const handleMyAccount = () => {
    router.push("/user-profile");
  };

  const handleWishList = () => {
    router.push("/favourites");
  };

  const handleNavigation = (url) => {
    if (url === "#baskets") {
      if (pathname !== "/") {
        router.push("/#baskets"); // Redirect to home with hash
      } else {
        document
          .getElementById("baskets")
          ?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      router.push(`/${url}`);
    }
  };

  // notification code
  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (
  //       notificationDropdownRef.current &&
  //       !notificationDropdownRef.current.contains(event.target)
  //     ) {
  //       setNotification(false);
  //     }
  //   };

  //   document.addEventListener("mousedown", handleClickOutside);
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  // useEffect(() => {
  //   socket.current = new WebSocket(
  //     `wss://breakfast-api.rexett.com/ws/notifications/${localStorage.getItem(
  //       "user_id"
  //     )}/`
  //   );
  //   socket.current.onopen = () => {
  //     console.log("WebSocket connection established.");
  //   };
  //   socket.current.onmessage = (event) => {
  //     const newNotification = JSON.parse(event.data);
  //     console.log(newNotification?.notifications, "socket notification");
  //     setRealTimeNotification(
  //       removeUnreadNotification(newNotification?.notifications)
  //     );
  //   };

  //   socket.current.onclose = () => {
  //     console.log("Websocket connection is closed");
  //   };

  //   return () => {
  //     socket.current?.close();
  //   };
  // }, []);

  const removeUnreadNotification = (notifications) => {
    if (notifications?.length) {
      const result = notifications.filter((item) => item?.is_read);
      return result;
    }
    return [];
  };

  const notificationToggleDropdown = () => {
    setNotification((prev) => !prev);
  };
  const handleNotificationClick = (nt) => {
    console.log(nt, "single notification");
    const { meta_data } = nt;
    updateNotificationStatus(nt?.id);
    if (meta_data?.product_id) {
      // navigate("/view-product", {
      //   state: { id: meta_data?.product_id, isViewOnly: true },
      // });
    } else if (meta_data?.order_id) {
      // navigate("/single-order", { state: { id: meta_data?.order_id } });
    } else {
      // navigate("/notifications");
    }
    setNotification(false);
    // add logic for redirection here
  };
  const updateNotificationStatus = (notificationId) => {
    callApi({
      endPoint: NOTIFICATION_UPDATE_ENDPOINT,
      method: METHODS.patch,
      update_id: notificationId,
      payload: {
        is_read: true,
        notification_id: notificationId,
      },
    })
      .then((res) => {})
      .catch((err) => {
        console.log(err, "notification update error");
      });
  };

  return (
    <div>
      {/* <section className="p-4 w-full bg-[#F5F5F5] mob-dnone">
        <div className="max-w-screen-xl w-full px-0 mx-auto">
          <div className=" flex justify-between items-center">
            <div>
            </div>
            <div className="head-degree-sec flex gap-[10px] text-black font-normal text-[16px]">
              {CloudImg}
              <p className="degree-text">20 C</p>
            </div>
          </div>
        </div>
      </section> */}
      <section className="second-head">
        <div className="max-w-screen-xl w-full px-4 mx-auto">
          <div className="second-head-flex">
            <Image
              onClick={() => router.push("/")}
              className="w-[100px] lg:w-[130px] cursor-pointer"
              width={500}
              height={20}
              src={LOGO}
              alt="logo"
            />
            <div>
              <form>
                {/* commented for future use */}
                {/* <div className="relative w-[300px] header-search-mob">
                  <label
                    className="bg-[#F5F5F5] px-[46px] py-[11px] rounded-full absolute right-[-1px] text-[13px] font-semibold"
                    htmlFor="fname"
                  >
                    Search
                  </label>
                  <input
                    className="border border-[#F5F5F5] p-2 rounded-full w-full"
                    type="text"
                    id="fname"
                    name="fname"
                  />
                </div> */}
              </form>
            </div>
            <div className="flex items-center gap-[10px] text-[13px] font-bold text-[#3E4B5F]">
              <div className="head-calender-sec flex gap-2 text-base font-normal">
                {CalenderImg}
                <span className="text-[13px] text-black font-semibold">
                  {getCurrentDate("india")}
                </span>
              </div>
              <div>{CallIcon}</div>
              <div>
                <h6 className="text-[#3E4B5F] text-[13px] font-bold">
                  {/* CALL US FREE */}
                  Ring oss
                </h6>
                <p className="text-[#96B416] text-[13px] lg:text-[17px] font-bold">
                  070 123 45 67
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <nav className="bg-gray-900 text-white flex items-center justify-between px-6 py-4">
          <div className="max-w-screen-xl w-full px-4 mx-auto flex justify-between items-center">
            {/* {pathname === "/products" || pathname === "/baskets" ? (
              <button
                onClick={() => dispatch(setShowCategories(!showCategories))}
                className="flex items-center bg-gradient-to-r from-[#92C64E] to-[#4BAF50] text-white px-4 py-2 rounded-full font-semibold hover:bg-green-600 transition all-category-btn"
              >
                <span className="mr-2">☰</span>
                All Categories
              </button>
            ) : (
              ""
            )} */}

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex space-x-8 text-sm font-semibold">
                {HEADER_NAV_OPTIONS.map((option) => {
                  const isAnchorLink = option.url.startsWith("#");
                  const isActive = isAnchorLink
                    ? false
                    : pathname === `/${option.url}` ||
                      (option.url === "/" && pathname === "/");
                  return (
                    <button
                      key={option.name}
                      onClick={() => handleNavigation(option.url)}
                      className={
                        isActive ? "text-green-500" : "hover:text-gray-300"
                      }
                    >
                      {option.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span>{SwedenFlagIcon}</span>
                <span className="sw">SW</span>
              </div>

              <div className="flex items-center space-x-2 cursor-pointer">
                <span>{DummyUser}</span>
                <span
                  onClick={
                    profileStatus === "Min konto"
                      ? handleMyAccount
                      : handleLogin
                  }
                >
                  {profileStatus}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                {token ? (
                  <button className="relative">
                    <span onClick={handleWishList}>{WishListIcon}</span>
                    {wishList?.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {wishList?.length}
                      </span>
                    )}
                  </button>
                ) : (
                  ""
                )}
                <button
                  className="relative"
                  onClick={() => router.push("/cart")}
                >
                  <span>{CartListIcon}</span>
                  {cartList?.length > 0 ? (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {cartList?.length}
                    </span>
                  ) : (
                    ""
                  )}

                  {/* <span className="absolute -top-1 -right-1 bg-black text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {itemQuantity}
                  </span> */}
                  {/* for future use */}
                </button>
                {token ? (
                  <button className="relative">
                    <span
                      onClick={() => {
                        router.push("/baskets");
                      }}
                    >
                      {BASKET_HEADER_ICON}
                    </span>
                    {currentUserBasket?.total_items > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {currentUserBasket?.total_items}
                      </span>
                    )}
                  </button>
                ) : (
                  ""
                )}
                {/* {token ? (
                  <div className="flex max-lg:ml-auto space-x-3 relative">
                    <button className="" onClick={notificationToggleDropdown}>
                      {realTimeNotification?.length ? activeBellIcon : BellIcon}
                    </button>
                    {notification && (
                      <div
                        id="dropdownMenu"
                        ref={notificationDropdownRef}
                        className="absolute -left-5 top-10 mt-2 w-60 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
                      >
                        {realTimeNotification?.length > 0 ? (
                          <>
                            {realTimeNotification
                              .slice(0, 5)
                              .map((item, index) => (
                                <div
                                  key={index}
                                  onClick={() => handleNotificationClick(item)}
                                  className="cursor-pointer notify-wrapper block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <div className="notify-title">
                                    {item.title}
                                  </div>
                                  <div className="notify-description">
                                    {item?.message}
                                  </div>
                                </div>
                              ))}
                            {realTimeNotification.length > 5 && (
                              <div
                                onClick={() => {
                                  navigate("/notifications");
                                  setNotification(false);
                                  setNotificationData([]);
                                }}
                                className="block view-all-notify px-4 py-2 text-sm text-blue-600 hover:underline cursor-pointer"
                              >
                                {T["view_all_notification"]}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="block px-4 py-2 text-sm text-gray-700">
                            No notifications yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  ""
                )} */}

                {profileStatus === "My Account" && (
                  <div className="flex items-center space-x-2">
                    <span className="cursor-pointer" onClick={handleLogout}>
                      Logout
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      </section>
    </div>
  );
};

export default Header;
