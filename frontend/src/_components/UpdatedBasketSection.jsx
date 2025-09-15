import {
  createPreview,
  getCurrentUserBasket,
  getTotalPrice,
  getTotalQuantity,
} from "@/_utils/helpers";
import { T } from "@/_utils/LanguageTranslator";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { setSelectedBasket } from "@/Redux/addToBasketSlice";
import { fetchUserBasket } from "@/_Api-Handlers/apiFunctions";
import SingleBasketProduct from "./SingleBasketProduct";
import { imagePlaceholder } from "@/_Svgs/Svg";
import Button from "./_common/Button";
import NonCustomizableBasketProduct from "./NonCustomizableBasketProduct";
const basketSliderSettings = {
  dots: false,
  infinite: false,
  speed: 500,
  slidesToShow: 3,
  slidesToScroll: 1,
  arrows: true,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 2 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 480, settings: { slidesToShow: 1 } },
  ],
};

function UpdatedBasketSection({
  baskets = [],
  fetchMoreBaskets,
  removeBasket,
  addBasketToCart,
  addToBasket,
  onRemoveProduct,
  currentAvailableSpace,
  setCurrentAvailableSpace,
}) {
  const dispatch = useDispatch();
  const [pageLoader, setPageLoader] = useState(false);
  const { selectedBasket, basketList, basket, userBasket } = useSelector(
    (state) => state?.addToBasket
  );
  const isBasketSelected = selectedBasket?.id;
  console.log(userBasket, "this is userbasket");

  const currentUserBasket = getCurrentUserBasket(userBasket, selectedBasket);

  const basketProducts = currentUserBasket?.products?.length
    ? currentUserBasket.products
    : [];
  console.log(selectedBasket, "selectedBasket");
  useEffect(() => {
    fetchUserBasket(dispatch, setPageLoader);
  }, []);
  useEffect(() => {
    if (selectedBasket?.id) {
    }
  }, [userBasket]);
  const calculateRemainingPrice = () => {
    const basketPrice = currentUserBasket?.basket_price || 0; // Default to 0 if undefined
    const totalProductPrice = currentUserBasket?.product_total_price || 0; // Default to 0 if undefined

    const remainingPrice = basketPrice - totalProductPrice;

    // Round the remaining price to two decimal places
    const roundedRemainingPrice = remainingPrice.toFixed(2);

    // Format the remaining price with the currency (SEK)
    return `${roundedRemainingPrice} SEK`;
  };
  console.log(selectedBasket, "selectedBasket");

  return (
    <aside className="w-[25rem] p-4 bg-gradient-to-r from-[#D8FFB0] to-yellow-100 mob-product-sidebar flex-none rounded">
      {isBasketSelected ? (
        <div className="mt-4 text-center">
          <h3 className="font-semibold text-lg capitalize">
            {selectedBasket?.basket_name}
          </h3>
        </div>
      ) : (
        ""
      )}
      {isBasketSelected && !currentUserBasket?.products?.length && (
        <div className="flex items-center space-x-2 justify-center mt-2">
          {" "}
          <div className="text-green-600 font-semibold text-lg">{T["price"]}</div>{" "}
          <div className="item-total  text-lg">{`${selectedBasket?.basket_price} SEK`} </div>
        </div>
      )}
      {/* products listing for customizable basket */}
      {currentUserBasket?.products?.length > 0 &&
        isBasketSelected &&
        selectedBasket?.is_customizable && (
          <div className="mb-4">
            {currentUserBasket.products.map((product, index) => (
              <SingleBasketProduct
                key={index}
                product={product}
                addToBasket={addToBasket}
                currentUserBasket={currentUserBasket}
                onRemoveProduct={onRemoveProduct}
              />
            ))}
          </div>
        )}

      {/* products listing for non-customizable basket */}
      {selectedBasket?.id &&
        selectedBasket?.products_detail?.length &&
        !selectedBasket?.is_customizable && (
          <div className="mb-4">
            {selectedBasket.products_detail.map((product, index) => (
              <NonCustomizableBasketProduct
                key={index}
                product={product}
                addToBasket={addToBasket}
                currentUserBasket={currentUserBasket}
                onRemoveProduct={onRemoveProduct}
              />
            ))}
          </div>
        )}

      {isBasketSelected ? (
        <div className="mt-4 relative">
          <div className="flex justify-center">
            {/* <img
              src={
                selectedBasket?.featured_image
                  ? createPreview(selectedBasket?.featured_image)
                  : "/images/basket-placeholder.png"
              }
              alt={`${T["selected_basket"]}`}
              className="w-32 h-32 rounded-lg shadow-md"
            /> */}
            <img
              src={"/images/basket-placeholder.png"}
              alt={`${T["selected_basket"]}`}
              className=""
            />
          </div>

          <div className="parent-div ">
            {/* basket items */}
            {/* for customizable baskets show added products and for non customizable baskets show eligible products  */}
            {basketProducts?.length && selectedBasket?.is_customizable ? (
              <div className="flex justify-center  ">
                <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border">
                  {T["basket_items"]}
                  {basketProducts.slice(0, 2).map((product, idx) => (
                    <span
                      key={idx}
                      className="basket-imagePlaceholder basket-ordercart"
                    >
                      {product?.product_variant?.product?.featured_image ? (
                        <img
                          src={createPreview(
                            product?.product_variant?.product?.featured_image
                          )}
                          alt={product?.product_prodcut_name}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                      ) : (
                        <div className="basket-imagePlaceholder basket-ordercart">
                          {imagePlaceholder}
                        </div>
                      )}
                    </span>
                  ))}
                </button>
              </div>
            ) : (
              ""
            )}
            {!selectedBasket?.is_customizable &&
            selectedBasket?.products_detail?.length ? (
              <div className="flex justify-center  ">
                <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border">
                  {T["basket_items"]}
                  {selectedBasket?.products_detail
                    .slice(0, 2)
                    .map((product, idx) => (
                      <span
                        key={idx}
                        className="basket-imagePlaceholder basket-ordercart"
                      >
                        {product?.product?.featured_image ? (
                          <img
                            src={createPreview(
                              product?.product?.featured_image
                            )}
                            alt={product?.product_name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                        ) : (
                          <div className="basket-imagePlaceholder basket-ordercart">
                            {imagePlaceholder}
                          </div>
                        )}
                      </span>
                    ))}
                </button>
              </div>
            ) : (
              ""
            )}
            {/* available space */}
            {selectedBasket?.is_customizable ? (
              <div className="flex justify-center">
                <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border">
                  {T["available_space"]}
                  <span className="h-[1.5rem] w-[1.5rem] bg-green-500 rounded-full">
                    {currentAvailableSpace -
                      getTotalQuantity(currentUserBasket?.products)}
                  </span>
                </button>
              </div>
            ) : (
              ""
            )}
            {/* remove */}
            <div
              className="remove underline text-center mt-2 cursor-pointer"
              onClick={() => removeBasket(currentUserBasket?.user_basket_id)}
            >
              {T["remove"]}
            </div>
          </div>
        </div>
      ) : baskets.length > 0 ? (
        <>
          <div className="mt-4 relative">
            <Slider
              {...basketSliderSettings}
              className="basket-slider"
              afterChange={(index) => {
                if (index === baskets.length - 3) fetchMoreBaskets();
              }}
            >
              {baskets.map((basket) => (
                <div key={basket.id} className="px-1">
                  <div className="">
                    <img
                      // src={
                      //   basket?.featured_image
                      //     ? createPreview(basket?.featured_image)
                      //     : "/images/empty-basket.png"
                      // }
                      src={"/images/empty-basket.png"}
                      alt={`${T["basket"]}`}
                      className={`w-16 h-16 cursor-pointer opacity-80 hover:opacity-100 ${
                        selectedBasket?.id === basket.id
                          ? "border-2 border-blue-500"
                          : ""
                      }`}
                      onClick={(e) => {
                        dispatch(setSelectedBasket(basket));
                        setCurrentAvailableSpace(basket?.space_left);
                      }}
                    />
                    {/* {basket?.} */}
                    <p className="capitalize">{basket?.basket_name}</p>
                  </div>
                </div>
              ))}
            </Slider>
          </div>
          <div className="flex justify-center">
            <button className=" flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md border">
              {T["choose_basket"]}
              <span className="w-4 h-4 bg-green-500 rounded-full"></span>
            </button>
          </div>
        </>
      ) : (
        <div className="mt-4 text-gray-500">{T["no_basket_found"]}</div>
      )}
      {(!selectedBasket?.is_customizable ||
        currentUserBasket?.products?.length > 0) && (
        <div className="add-to-cart-section flex items-center whitespace-nowrap justify-between p-[10px] bg-white rounded-[10px] mt-[30px]">
          <div className="text-green-600 font-semibold">
            {!selectedBasket?.is_customizable
              ? T["basket_price"]
              : T["remaining"]}{" "}
          </div>
          <div className="item-total">
            {" "}
            {!selectedBasket?.is_customizable
              ? selectedBasket?.basket_price
              : `${calculateRemainingPrice()}`}
          </div>

          <Button
            btnType="button"
            className="flex gap-[10px] bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[10px_30px] rounded-full text-white font-semibold items-center"
            btnText={T["add_to_cart"]}
            icon={
              <img
                className="bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[6px] rounded-full w-[25px] h-[25px]"
                src={"/images/arrow.svg"}
                alt="arrowImg"
              />
            }
            btnClick={() =>
              addBasketToCart(
                userBasket?.[userBasket?.length - 1]?.user_basket_id
              )
            }
          />
        </div>
      )}
    </aside>
  );
}

export default UpdatedBasketSection;
