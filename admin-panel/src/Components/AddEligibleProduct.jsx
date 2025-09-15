import React, { useEffect, useRef, useState } from "react";
import { INSTANCE, makeApiRequest, METHODS } from "../api/apiFunctions";
import {
  CATEGORIES_ENDPOINT,
  PRODUCT_ENDPOINT,
  SEARCH_PRODUCT,
} from "../api/endpoints";
import basketImg from "../assets/images/cookie_img.png";
import CommonButton from "../Components/Common/CommonButton";
import { T } from "../utils/languageTranslator";
import { DEBOUNCE_TIME, ITEMS_PER_PAGE } from "../constant";
import {
  BUTTON_LOADER,
  imagePlaceholder,
  PRODUCT_SECTION_LOADER,
} from "../assets/Icons/Svg";
import { createPreview } from "../utils/helpers";
import usePagination from "../hooks/usePagination";
import Pagination from "./Common/Pagination";
import SingleProductCard from "./SingleProductCard";

function AddEligibleProduct({
  onClose,
  onSelect,
  formConfig,
  currentAvailableSpace,
  selectedProducts,
  setSelectedProducts,
  handleProductSubmit,
}) {
  const timerIdRef = useRef(null); // persists across renders
  const { page, onPageChange, setPage } = usePagination();
  const [loader, setLoader] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [spaceLeft, setSpaceLeft] = useState(currentAvailableSpace);
  const [sideBar, setSideBar] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [totalData, setTotalData] = useState(0);
  const { watch } = formConfig;

  useEffect(() => {
    setSpaceLeft(currentAvailableSpace - selectedProducts?.length || 0);
  }, []);
  // for calling product API for search and category selection
  useEffect(() => {
    console.log(watch("eligible_products"), "eligible products");
    setLoader((prev) => true);
    const params = {
      search: searchText || "",
      category: selectedCategories?.length ? selectedCategories : "",
      page: page,
    };
    makeApiRequest({
      endPoint: PRODUCT_ENDPOINT,
      method: METHODS.get,
      params: params,
    })
      .then((res) => {
        setProducts(res?.data?.results || []);
        setTotalData(res?.data?.count || 0);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoader((prev) => false);
      });
  }, [selectedCategories, searchText, page]);
  console.log(searchText, "searchText");

  const handleAllCategories = () => {
    setSideBar((prev) => !prev); // Toggle sidebar state
  };

  const handleCategorySelection = (category) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((cat) => cat !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Filter products based on selected categories

  console.log(selectedCategories, "sdkfjskdjfkdsljfkldsf");

  // fetching products
  useEffect(() => {
    setLoader((prev) => true);
    Promise.all([
      makeApiRequest({ endPoint: PRODUCT_ENDPOINT, method: METHODS.get }),
      makeApiRequest({ endPoint: CATEGORIES_ENDPOINT, method: METHODS.get }),
    ])
      .then(([productRes, categoryRes]) => {
        console.log(productRes, "Product Response");
        console.log(categoryRes, "Category Response");

        setProducts(productRes.data?.results || []);
        let categories = categoryRes.data?.results?.length
          ? categoryRes.data?.results
          : [];
        setCategories(categoryRes.data?.results || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoader((prev) => false);
      });
  }, []);

  console.log(categories, "these are categories");
  const handleClose = () => {
    onClose();
    setSpaceLeft(currentAvailableSpace);
  };
  const handleSearch = (e) => {
    const value = e.target.value;

    if (timerIdRef.current) {
      clearTimeout(timerIdRef.current);
    }

    timerIdRef.current = setTimeout(() => {
      setSearchText(value);

      // Uncomment and use your API call logic here
      // makeApiRequest({
      //   endPoint: PRODUCT_ENDPOINT,
      //   method: METHODS.get,
      //   params: { search: value },
      // })
      //   .then((res) => {
      //     setProducts(res?.data?.results || []);
      //   })
      //   .catch((err) => {
      //     console.log(err, "search error");
      //   })
      //   .finally(() => {
      //     setLoader(false);
      //   });
    }, DEBOUNCE_TIME);
  };

  // const handleSelectProduct = (e, product) => {
  //   const { checked } = e.target;
  //   setSelectedProducts((prev) => {
  //     if (checked) {
  //       // Prevent adding if spaceLeft is 0
  //       if (spaceLeft === 0) return prev;
  //       return [...prev, product];
  //     } else {
  //       // Allow removing the product
  //       return prev.filter((item) => item.id !== product.id);
  //     }
  //   });

  //   setSpaceLeft((prev) => {
  //     if (checked) {
  //       return prev > 0 ? prev - 1 : prev; // Decrease space only if it's greater than 0
  //     } else {
  //       return prev + 1; // Restore space when unchecked
  //     }
  //   });
  // };

  const handleSelectProduct = (e, product, selectedVariant) => {
    const { checked } = e.target;
    const productWithVariant = {
      ...product,
      selected_inventory: selectedVariant?.inventory,
    };

    setSelectedProducts((prev) => {
      if (checked) {
        if (spaceLeft === 0) return prev;
        return [...prev, productWithVariant];
      } else {
        return prev.filter((item) => item.id !== product.id);
      }
    });

    setSpaceLeft((prev) => (checked ? Math.max(0, prev - 1) : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-[20px] p-6 w-[800px] max-h-[80vh] overflow-y-auto relative">
        {/* Modal Header */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex justify-evenly gap-10 items-center">
          <CommonButton
            // text={sideBar ? "Close Sidebar" : "All Categories"}
            text="All Categories"
            onClick={handleAllCategories}
            type="button"
            className="px-4 py-2 bg-gradient-to-r from-[#4BAF50] to-[#92C64E] text-white rounded-[50px]"
          />

          <div className="flex-1">
            <input
              type="text"
              onChange={handleSearch}
              // value={searchText}
              placeholder={T["search_product"]}
              className="w-full px-4 py-2 bg-[#EEEEEE] border-none rounded-[8px] focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <div className="bg-[#FFF6EE] w-64 flex justify-between py-1 px-3 rounded-full items-center">
            <div className="text-nowrap">{T["available_space"]}</div>
            <div className="bg-[#F97316] rounded-full py-1 px-2 text-white w-[32px] h-[32px] flex items-center justify-center">
              {spaceLeft}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {/* {sideBar && ( */}
        <div
          className={`absolute top-0 left-0 h-full w-60 bg-white rounded-[20px] shadow-[2px_0_4px_#00000040] transform ${
            sideBar ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 z-40`}
        >
          <div
            className="font-medium cursor-pointer w-[25px] h-[25px] bg-[#01a933] rounded-[50px] text-white flex items-center justify-center mt-[10px] mr-[10px] float-right"
            onClick={handleAllCategories}
          >
            x
          </div>
          <div className="py-[20px] flex justify-center text-[18px] font-medium">
            Categories
          </div>
          <ul className="space-y-2 text-black">
            <li
              className={`cursor-pointer text-left border-b py-4 pl-4 font-medium !mt-0 ${"hover:text-green-600"}`}
              onClick={() => handleCategorySelection("all")}
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes("all")}
                readOnly
                className="mr-2"
              />
              {T["all"]}
            </li>
            {categories?.map((category) => (
              <li
                key={category.id}
                className={`cursor-pointer text-left border-b py-4 pl-4 font-medium !mt-0 bg-[#DFFFDC] text-[16px] font-semibold capitalize ${
                  selectedCategories.includes(category.name)
                    ? "bg-[#DFFFDC]"
                    : "hover:text-green-600"
                }`}
                onClick={() => handleCategorySelection(category.name)}
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.name)}
                  readOnly
                  className="mr-2 "
                />
                {category?.name || ""}
              </li>
            ))}
          </ul>
        </div>
        {/* )} */}

        {/* Products Grid */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          {loader ? (
            <div className="product-section-loader">
              {PRODUCT_SECTION_LOADER}
            </div>
          ) : products?.length ? (
            products?.map((product) => (
              <SingleProductCard
                product={product}
                selectedProducts={selectedProducts}
                setSelectedProducts={setSelectedProducts}
                handleSelectProduct={handleSelectProduct}
              />
            ))
          ) : (
            <p>{T["no_product_found"]}</p>
          )}
          <Pagination
            onPageChange={onPageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalData={totalData}
            currentPage={page}
          />
        </div>
        <div className="mt-4 flex justify-center">
          <CommonButton
            className="orange_btn"
            type="button"
            onClick={() => {
              handleProductSubmit();
              onClose();
            }}
            text={T["submit"]}
          />
        </div>
      </div>
    </div>
  );
}

export default AddEligibleProduct;
