"use client";
import { baseURL } from "@/_Api-Handlers/apiConfig";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { BASKETS } from "@/_Api-Handlers/APIUrls";
import { DEFAULT_ERROR_MESSAGE } from "@/_constants/constant";
import { toastMessages } from "@/_utils/toastMessage";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import { setSelectedBasket } from "@/Redux/addToBasketSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

function SelectBasketModal({ closeModal, selectedPremiumProduct,basketForPremiumProducts }) {
  const dispatch = useDispatch()
  const [choosenBasket, setChoosenBasket] = useState();
  const {selectedBasket} = useSelector( state => state.addToBasket)
  console.log(selectedPremiumProduct,"selectedPremiumProduct")

  // useEffect(() => {
  //   callApi({
  //     endPoint: BASKETS,
  //     method: METHODS.get,
  //     params: {
  //       page: 1,
  //     },
  //     instanceType: INSTANCE.authorize,
  //   })
  //     .then((res) => {
  //       setBasketList(res.data);
  //     })
  //     .catch((err) => {
  //       toastMessages(err?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
  //     });
  // }, []);

  const chooseBasket = () => {
    dispatch(setSelectedBasket(choosenBasket));
    closeModal()
  };

  return (
    <div className="fixed inset-0 p-4 flex flex-wrap justify-center items-center w-full h-full z-[1000] before:fixed before:inset-0 before:w-full before:h-full before:bg-[rgba(0,0,0,0.5)] overflow-auto font-[sans-serif]">
      <div className="w-full max-w-lg bg-white shadow-lg rounded-lg p-6 relative">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3 ml-2 cursor-pointer shrink-0 fill-gray-400 hover:fill-red-500"
          viewBox="0 0 320.591 320.591"
          onClick={closeModal}
        >
          <path
            d="M30.391 318.583a30.37 30.37 0 0 1-21.56-7.288c-11.774-11.844-11.774-30.973 0-42.817L266.643 10.665c12.246-11.459 31.462-10.822 42.921 1.424 10.362 11.074 10.966 28.095 1.414 39.875L51.647 311.295a30.366 30.366 0 0 1-21.256 7.288z"
            data-original="#000000"
          ></path>
          <path
            d="M287.9 318.583a30.37 30.37 0 0 1-21.257-8.806L8.83 51.963C-2.078 39.225-.595 20.055 12.143 9.146c11.369-9.736 28.136-9.736 39.504 0l259.331 257.813c12.243 11.462 12.876 30.679 1.414 42.922-.456.487-.927.958-1.414 1.414a30.368 30.368 0 0 1-23.078 7.288z"
            data-original="#000000"
          ></path>
        </svg>
        <div className="flex justify-center items-center">
          {basketForPremiumProducts?.length > 0 && (
            basketForPremiumProducts?.map((item) => {
              return (
                <div key={item.id}>
                  <p>{item.basket_name}</p>
                  <div
                    className="flex items-center rounded-lg h-[100px] w-[100px]"
                    onClick={() => setChoosenBasket(item)}
                  >
                    <img
                      src={
                        item.featured_image
                          ? `${baseURL}${item.featured_image}`
                          : "/images/basket.png"
                      }
                      alt="basketImg"
                    />
                  </div>
                </div>
              );
            })
          )
          }
        </div>
        <div className="flex items-center gap-[20px] bg-white p-[6px] rounded-full mb-3 w-2/3">
          <h5
            className="text-[16px] flex font-medium"
            onClick={() => chooseBasket()}
          >
            Choose Basket
          </h5>
        </div>
      </div>
    </div>
  );
}

export default SelectBasketModal;
