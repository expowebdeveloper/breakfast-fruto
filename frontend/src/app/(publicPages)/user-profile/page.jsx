"use client";
import React, { Fragment, useEffect, useState } from "react";
import { T } from "@/_utils/LanguageTranslator";
import Orders from "@/app/(publicPages)/user-profile/orders/page";
import Favourites from "@/app/(publicPages)/favourites/page";
import Payments from "@/app/(publicPages)/user-profile/payments/page";
import Address from "@/app/(publicPages)/user-profile/address/page";
import Settings from "@/app/(publicPages)/user-profile/settings/page";
import {
  HEART_ICON,
  ORDER_ICON,
  PAYMENT_ICON,
  SETTINGS_ICON,
} from "@/Assets/SVGIcons";
import { ADDRESS_ICON } from "../../../../public/images/SvgIcons";
import EditProfile from "@/_components/_common/EditProfile";
import OrderDetails from "@/_components/_common/OrderDetails";
import {
  ADDRESS,
  ORDERS,
  PROFILE_UPDATE,
  UPDATE_PROFILE,
} from "@/_Api-Handlers/APIUrls";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import ProfileSidebar from "@/_components/ProfileSidebar";
import { addressSvg } from "@/Assets/Icons/Svg";

function Page() {
  const [currentCategory, setCurrentCategory] = useState("orders");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [user, setUser] = useState();
  const [ordersData, setOrdersData] = useState([]);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [pageLoader, setPageLoader] = useState(false);
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [sideBarItems, setSideBarItems] = useState("orders");
  const [sidebarItemId, setSidebarItemId] = useState();
  const [profileData, setProfileData] = useState();
  const [addresses, setAddresses] = useState([]);

  // useEffect(() => {
  //   callApi({
  //     endPoint: UPDATE_PROFILE,
  //     method: METHODS.get,
  //     instanceType: INSTANCE.authorize,
  //   })
  //     .then((res) => {
  //       setUser(res.data);
  //       toastMessages(res.data.message, successType);
  //     })  
  //     .catch((err) => {
  //       toastMessages(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
  //     });
  //   handleProfileData();
  //   getAddress();
  // }, []);
  const getAddress = () => {
    callApi({
      endPoint: ADDRESS,
      method: "GET",
      instanceType: INSTANCE?.authorize,
    })
      .then((res) => {
        setAddresses(res?.data?.results);
      })
      .catch((error) => {
        console.error("Error getting address:", error);
      });
  };

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleDeleteAddress = (id) => {
    setAddresses((prev) => prev?.filter((address) => address.id !== id));
  };


  const sideBarOptions = [
    {
      name: "orders",
      displayName: T["orders"],
      icon: ORDER_ICON,
    },
    {
      name: "favorites",
      displayName: T["favorites"],
      icon: HEART_ICON,
    },
    // {
    //   name: "payments",
    //   icon: PAYMENT_ICON,
    // },
    {
      name: "addresses",
      displayName: T["addresses"],
      icon: addressSvg
      ,
    },
    {
      name: "settings",
      displayName: T["settings"],
      icon: SETTINGS_ICON,
    },
  ];

  const renderContent = () => {
    switch (currentCategory) {
      case "orders":
        return (
          <Orders
            toggleSidebar={toggleSidebar}
            handleSideBarItem={handleSideBarItem}
          />
        );
      case "favorites":
        return <Favourites />;
      // case "payments":
      //   return <Payments />;
      case "addresses":
        return (
          <Address
            addresses={addresses}
            handleDeleteAddress={handleDeleteAddress}
            getAddress={getAddress}
          />
        );
      case "settings":
        return <Settings />;
      default:
        return (
          <Orders
            toggleSidebar={toggleSidebar}
            handleSideBarItem={handleSideBarItem}
          />
        );
    }
  };

  const handleSideBarItem = (item, id, orders) => {
    setSideBarItems(item);
    setSidebarItemId(id);
    setOrdersData(orders);
  };

  const handleEditProfile = () => {
    handleSideBarItem("editProfile");
    toggleSidebar();
    document.body.style.overflow = "hidden";
  };

  const handleChangePassword = () => {
    handleSideBarItem("changePassword");
    // toggleSidebar();
  };

  const handleProfileData = () => {
    callApi({
      endPoint: PROFILE_UPDATE,
      method: "GET",
      instanceType: INSTANCE?.authorize,
    })
      .then((res) => {
        console.log(res, "res inside profile");
        setProfileData(res?.data);
      })
      .catch((error) => {
        console.error("Error getting address:", error);
      });
  };


  return (
    <>
      <div className="bg-white scroller-hide px-4 lg:px-12 py-10 lg:py-20">
        {/* navbar */}
        <div className="flex justify-between">
          <div>
            <h2 className="text-black text-xl font-semibold mb-2">
              {user?.first_name} {user?.last_name}
            </h2>
            <div className="flex gap-4">
              <p className="text-black"> {user?.phone_number} </p>
              <p className="text-black">{user?.email}</p>
            </div>
          </div>
          <div>
            <button
              className="bg-green-500 text-white py-2 px-4 rounded-md"
              onClick={handleEditProfile}
            >
              {T["edit_profile"]}
            </button>
          </div>
        </div>
        {/* main section */}
        <div className="flex flex-col lg:flex-row p-4 lg:p-6 gap-4 lg:gap-6">
          <div className="w-full lg:w-[250px] bg-[#f8f9fa] p-4 lg:pt-5 lg:pb-5 lg:pl-5 lg:pr-0 border border-[#ddd] rounded-lg">
            <ul className="flex lg:block space-x-4 lg:space-x-0 lg:space-y-6 overflow-x-auto lg:overflow-visible">
              {sideBarOptions?.map((option, idx) => (
                <Fragment key={idx}>
                  <li
                    className={
                      currentCategory === option?.name
                        ? "bg-green-500 rounded-md md:rounded-none px-3 md:px-[10px] py-2 md:py-[6px] flex gap-2 items-center cursor-pointer flex-shrink-0 md:flex-shrink"
                        : "flex gap-2 items-center cursor-pointer px-3 md:px-[10px] py-2 md:py-[6px] flex-shrink-0 md:flex-shrink"
                    }
                    onClick={() => handleCategoryChange(option.name)}
                  >
                    <div className="p-2 rounded-full bg-[#ffffff]">
                      {option?.icon}
                    </div>
                    <div className={`${currentCategory === option?.name ? "text-[#ffffff] no-underline":"text-[#808080] no-underline"} whitespace-nowrap md:whitespace-normal`}>
                      {option?.displayName}
                    </div>
                  </li>
                </Fragment>
              ))}
            </ul>
          </div>
          {/* right side section */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
      <OrderDetails
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <ProfileSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        sideBarItems={sideBarItems}
        sidebarItemId={sidebarItemId}
        ordersData={ordersData}
        handleChangePassword={handleChangePassword}
        profileData={profileData}
        handleProfileData={handleProfileData}
      />
      {/* <EditProfile
        isSidebarOpen={isEditProfileOpen}
        toggleSidebar={handleEditProfile}
        user={user}
      /> */}
    </>
  );
}

export default Page;
