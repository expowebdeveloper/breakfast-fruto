import React, { useEffect, useState } from "react";
import { deleteIcon, trashIcon } from "../assets/Icons/Svg";
import CommonButton from "../Components/Common/CommonButton";
import { makeApiRequest, METHODS } from "../api/apiFunctions";
import {
  BASKET_ENDPOINT,
  CATEGORIES_ENDPOINT,
  PRODUCT_ENDPOINT,
  BASKET_PRODUCT_DELETE_ENDPOINT,
} from "../api/endpoints";
import { T } from "../utils/languageTranslator";
import { useLocation, useNavigate } from "react-router-dom";
import PageLoader from "../loaders/PageLoader";
import {
  createDeleteConfirmationDescription,
  createDeleteConfirmationTitle,
  formatDate,
} from "../utils/helpers";
import { DEFAULT_ERROR_MESSAGE, YYYY_MM_DD } from "../constant";
import ListHeadings from "../Components/Common/ListHeadings";
import NoDataFound from "../Components/Common/NoDataFound";
import SingleViewBasketRow from "../Components/SingleViewBasketRow";
import DeleteConfirmationModal from "../Modals/DeleteConfirmationModal";
import { successType, toastMessage } from "../utils/toastMessage";

const ViewBasket = ({
  icon = trashIcon,
  title,
  description,
  onDelete,
  onCancel,
  loader,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const basketId = location?.state?.id;
  const [basketData, setBasketData] = useState({});
  const [deleteLoader, setDeleteLoader] = useState(false);
  const [pageLoader, setPageLoader] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({
    show: false,
    itemToDelete: null,
  });
  useEffect(() => {
    if (basketId) {
      fetchData();
    }
  }, []);

  const fetchData = () => {
    setPageLoader((prev) => true);
    makeApiRequest({
      endPoint: `${BASKET_ENDPOINT}${basketId}`,
      method: METHODS.get,
    })
      .then((res) => {
        const data = res?.data;
        setBasketData(data);
      })
      .catch((err) => {
        console.log(err, "basket err");
      })
      .finally((res) => {
        setPageLoader((prev) => false);
      });
  };
  console.log(basketData, "basketData");
  const PRODUCT_TABLE_COLUMNS = [
    T["s_no"],
    T["name"],
    T["sku"],
    T["quantity"],
    T["cost"],
    T["space_occupy"],
    T["action"],
  ];
  const deleteProduct = () => {
    setDeleteLoader((prev) => true);
    const { id } = deleteInfo?.itemToDelete;
    makeApiRequest({
      endPoint: `/basket/${basketId}/remove-product/`,
      method: METHODS.post,
      payload: {
        product_id: id,
      },
    })
      .then((res) => {
        console.log(res, "res");
        // if (page === 1) {
        //   fetchRawMaterials();
        // } else {
        //   setPage(1);
        // }
        toastMessage(T["product_deleted_successfully"], successType);
        fetchData();
      })
      .catch((err) => {
        toastMessage(
          err?.response?.data?.message || DEFAULT_ERROR_MESSAGE,
          "error"
        );
        console.log(err, "err");
      })
      .finally((res) => {
        setDeleteLoader((prev) => false);
        setDeleteInfo({
          show: false,
          itemToDelete: null,
        });
      });
  };

  return (
    <>
      {pageLoader ? (
        <PageLoader />
      ) : (
        <div className="p-6 bg-white rounded-lg shadow-md">
          {/* Header Section */}
          <div className="border-b pb-4 mb-4">
            {basketData?.content ? (
              <p
                className="text-xs text-gray-500 mb-2"
                dangerouslySetInnerHTML={{ __html: basketData?.content }}
              />
            ) : (
              ""
            )}
            <div className="flex justify-between items-center">
              <div className="flex gap-6">
                <div>
                  <p className="text-sm font-bold">{T["price"]}</p>
                  <p className="text-black font-semibold">
                    {basketData?.basket_price
                      ? basketData?.basket_price
                      : "0.00"}{" "}
                    SEK
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold">{T["offer_price"]}</p>
                  <p className="text-green-500 font-semibold">
                    {basketData?.offer_price ? basketData?.offer_price : "0.00"}{" "}
                    SEK
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold">{T["offer_start"]}</p>
                  <p className="text-black text-center font-semibold">
                    {basketData?.start_sale
                      ? formatDate(basketData?.start_sale, YYYY_MM_DD)
                      : "-"}{" "}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-bold">{T["offer_end"]}</p>
                  <p className="text-black text-center font-semibold">
                    {basketData?.end_sale
                      ? formatDate(basketData?.end_sale, YYYY_MM_DD)
                      : "-"}{" "}
                  </p>
                </div>{" "}
                <div>
                  <p className="text-sm font-bold">{T["basket_space"]}</p>
                  <span className="text-white p-1 rounded-full bg-green-500 font-semibold basket-space-text w-[30px] h-[30px] inline-flex items-center justify-center">
                    {basketData?.space_left ? basketData?.space_left : 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div>
            <table className="w-full text-left border-collapse basket-product-table">
              <thead>
                <tr className="font-bold text-sm ">Product</tr>
                <tr className="border-b">
                  {PRODUCT_TABLE_COLUMNS.map((column, idx) => (
                    <th className="py-2 font-semibold" key={idx}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* {[
                  {
                    id: 1,
                    name: "Pineapple",
                    sku: "KAN0123",
                    quantity: "1 Unit",
                    cost: "$ 80.00",
                    space: 1,
                  },
                  {
                    id: 2,
                    name: "Royal Apples",
                    sku: "CIN0123",
                    quantity: "1 KG",
                    cost: "$ 280.00",
                    space: 1,
                  },
                  {
                    id: 3,
                    name: "Tender Coconut",
                    sku: "BUN0123",
                    quantity: "1 Unit",
                    cost: "$ 80.00",
                    space: 1,
                  },
                ].map((product) => (
                  <tr key={product.id} className="border-b">
                    <td className="p-2 text-gray-600">{product.id}</td>
                    <td className="p-2 font-semibold flex items-center gap-2">
                      <img
                        src={"/src/assets/images/basket_img.png"}
                        alt={product.name}
                        className="w-10 h-10 rounded-full"
                      />
                      {product.name}
                    </td>
                    <td className="p-2 text-gray-600">{product.sku}</td>
                    <td className="p-2 text-gray-600">{product.quantity}</td>
                    <td className="p-2 text-gray-600">{product.cost}</td>
                    <td className="p-2 text-gray-600">{product.space}</td>
                    <td className="p-2">
                      <button className="text-red-500 hover:text-red-700 p-1 bg-[#FFECEC] rounded-md">
                        {trashIcon}
                      </button>
                    </td>
                  </tr>
                ))} */}
                {basketData?.products_detail?.length ? (
                  basketData?.products_detail?.map((product, index) => (
                    <SingleViewBasketRow
                      key={product.id}
                      product={product}
                      index={index}
                      handleDeleteClick={(product) => {
                        setDeleteInfo({
                          show: true,
                          itemToDelete: product,
                        });
                      }}
                    />
                  ))
                ) : (
                  <NoDataFound />
                )}
              </tbody>
            </table>
          </div>

          {/* Add Product Button */}
          <div className="mt-4">
            <CommonButton
              type="button"
              text={T["add_product"]}
              className="bg-[#F2FFEC] text-black px-4 py-2 rounded text-[16px] font-medium"
              onClick={() => {
                navigate("/add-edit-product", {
                  state: {
                    prevRoute: "view-basket",
                    isFromBasket: true,
                    basketId: basketId,
                    productIds: basketData?.products_detail?.map(
                      (product) => product.id
                    ),
                  },
                });
              }}
            />
          </div>
        </div>
      )}
      {deleteInfo?.show && (
        <DeleteConfirmationModal
          title={createDeleteConfirmationTitle("product", "delete")}
          description={createDeleteConfirmationDescription("product", "delete")}
          onCancel={() => {
            setDeleteInfo({
              show: false,
              itemToDelete: null,
            });
          }}
          deleteText="delete"
          loader={deleteLoader}
          onDelete={deleteProduct}
        />
      )}
    </>
  );
};

export default ViewBasket;
