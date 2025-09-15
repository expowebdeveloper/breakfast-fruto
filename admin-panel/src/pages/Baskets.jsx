import React, { useEffect, useState } from "react";
import {
  bulkActionBasket,
  INSTANCE,
  makeApiRequest,
  METHODS,
} from "../api/apiFunctions";
import { BASKET_ENDPOINT, EXPORT_ENDPOINT } from "../api/endpoints";
import PageLoader from "../loaders/PageLoader";
import usePagination from "../hooks/usePagination";
import TableWrapper from "../Wrappers/TableWrapper";
import Pagination from "../Components/Common/Pagination";
import NoDataFound from "../Components/Common/NoDataFound";
import {
  ACTIONS,
  BULK_BASKET_DELETE_DESCRIPTION,
  BULK_DELETE_TITLE,
  BULK_PRODUCT_DELETE_DESCRIPTION,
  DEFAULT_ERROR_MESSAGE,
  ITEMS_PER_PAGE,
  TYPE_OPTIONS,
  BASKETS_SORT_BY,
  SORT_VALUES,
} from "../constant";
import SingleBasketTableRow from "../Components/SingleBasketTableRow";
import { T } from "../utils/languageTranslator";
import useSelectedItems from "../hooks/useSelectedItems";
import FilterSection from "../Components/Common/FilterSection";
import CommonButton from "../Components/Common/CommonButton";
import { useNavigate } from "react-router-dom";
import { successType, toastMessage } from "../utils/toastMessage";
import DeleteConfirmationModal from "../Modals/DeleteConfirmationModal";
import {
  createDeleteConfirmationDescription,
  createDeleteConfirmationTitle,
  createPayloadForProduct,
  getSortValue,
  removeLeadingDash,
} from "../utils/helpers";
import ChangeStatusModal from "../Components/Common/ChangeStatusModal";
import { useHeader } from "../contexts/HeaderProvider";
const BASKET_PAGE_COLUMNS = [
  "checkbox",
  T["s_no"],
  T["basket_name"],
  T["space"],
  T["products"],
  T["price"],
  T["offer"],
  T["date"],
  T["action"],
];
const filterFields = [
  {
    type: "select",
    defaultOption: T["select_type"],
    options: TYPE_OPTIONS,
    filterName: "status",
  },
  // {
  //   type: "select",
  //   defaultOption: T["select_category"],
  //   options: [], // update required : need to ask for categories options
  //   filterName: "category", // update required :  need to confirm about this filter name categories options
  // },
  {
    type: "select",
    defaultOption: T["sort_by"],
    options: BASKETS_SORT_BY,
    filterName: "sort_by",
  },
  {
    type: "select",
    defaultOption: T["select_action"],
    options: ACTIONS,
    filterName: "action",
  },
  {
    type: "search",
    filterName: "search",
    placeholder: T["search_basket"],
  },
];
const Baskets = () => {
  const navigate = useNavigate();
  const { updateHeader } = useHeader();
  const { page, onPageChange, setPage } = usePagination();
  const [bulkDeleteLoader, setBulkDeleteLoader] = useState(false);
  const [deleteLoader, setDeleteLoader] = useState(false);
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState({
    show: false,
    payload: {},
    value: "",
  });

  const [deleteInfo, setDeleteInfo] = useState({
    show: false,
    itemToDelete: null,
    status: "",
  });

  const {
    selectedItems: selectedBaskets,
    setSelectedItems: setSelectedBaskets,
    handleSelectItems: handleSelectBasket,
    selectAllItems,
  } = useSelectedItems();
  const [searchInput, setSearchInput] = useState("");
  const [pageLoader, setPageLoader] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [baskets, setBaskets] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [filters, setFilters] = useState({
    status: "all",
    category: "",
    action: "",
    search: "",
    sort_by: "",
    sort: "",
  });
  const [statusChangeInfo, setStatusChangeInfo] = useState({
    show: false,
    id: null,
    status: "",
  });

  useEffect(() => {
    fetchBaskets();
  }, [page, filters]);

  const fetchBaskets = () => {
    const apiFilters = {
      ...filters,
      page: page,
    };
    setPageLoader((prev) => true);
    makeApiRequest({
      endPoint: BASKET_ENDPOINT,
      params: apiFilters,
      method: METHODS.get,
    })
      .then((res) => {
        setBaskets(res?.data?.results || []);
        setTotalData(res?.data?.count || 0);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };

  const handleActions = ({ action, id, deleteItem = null, item }) => {
    if (action === "view") {
      console.log(item, "this is item");
      navigate("/view-basket", { state: { id: item?.id } });
      updateHeader({
        title: item?.basket_name,
        image: item?.featured_image,
        basketId: item?.id,
      });
    } else if (action === "edit") {
      // update required: make the route name better
      navigate("/add-edit-basket", { state: { id: id } });
    } else if (action === "delete") {
      const { id, is_deleted } = deleteItem;
      setDeleteInfo({
        show: true,
        itemToDelete: deleteItem,
        status: is_deleted ? "delete" : "trash",
      });
    }
  };

  const handleFilterChange = (filterName, value) => {
    if (filterName === "action") {
      const payload = {
        baskets: selectedBaskets,
        status: value,
      };
      if (selectedBaskets?.length) {
        if (value == "delete") {
          setBulkDeleteConfirmation({
            show: true,
            payload: { ...payload },
            value: value,
          });
          return;
        }
        bulkActionBasket(payload)
          .then((res) => {
            // fetchProducts({ ...apiFilters });
            toastMessage(
              res?.data?.message ||
                `${T["baskets"]} ${
                  value === "Deleted" ? "deleted" : "Drafted"
                } successfully`,
              successType
            );
          })
          .catch((err) => {
            console.log(err, "this is err");
            toastMessage(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
          })
          .finally(() => {
            setPage(1);
            setSelectedBaskets([]);
            setFilters({ ...filters, ["action"]: "" });
          });
      } else {
        toastMessage(T["basket_bulk_action_message"]);
      }
    } else {
      let temp = { ...filters };
      if (filterName === "sort_by") {
        if (SORT_VALUES.includes(value)) {
          console.log(value);
          temp["sort"] = value;
          temp["sort_by"] = "";
        } else {
          temp["sort_by"] = removeLeadingDash(value);
          temp["sort"] = getSortValue(value);
        }
      } else {
        temp[filterName] = value;
      }
      if (!searchInput) {
        temp["search"] = "";
      }
      setFilters(temp);
    }
  };
  const bulkDeleteBasket = () => {
    setBulkDeleteLoader((prev) => true);
    const payload = bulkDeleteConfirmation?.payload;
    const value = bulkDeleteConfirmation?.value;
    bulkActionBasket(payload)
      .then((res) => {
        toastMessage(
          res?.data?.message || T["baskets_deleted_successfully"],
          successType
        );
      })
      .catch((err) => {
        console.log(err, "this is err");
        toastMessage(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setBulkDeleteConfirmation({ show: false, payload: {}, value: "" });
        setBulkDeleteLoader((prev) => false);
        setPage(1);
        setSelectedBaskets([]);
        setFilters({ ...filters, ["action"]: "" });
      });
  };
  const handleDeleteBasket = () => {
    const { status, itemToDelete } = deleteInfo;
    const isTrash = !itemToDelete?.is_deleted;
    setDeleteLoader((prev) => true);
    // deleteProduct(itemToDelete)
    makeApiRequest({
      endPoint: BASKET_ENDPOINT,
      method: isTrash ? METHODS.patch : METHODS.delete,
      instanceType: isTrash ? INSTANCE?.formInstance : INSTANCE.authorized,
      delete_id: isTrash ? null : itemToDelete?.id,
      update_id: isTrash ? itemToDelete?.id : null,
      payload: isTrash ? createPayloadForProduct(itemToDelete) : null,
    })
      .then((res) => {
        toastMessage(
          `${T["basket"]} ${isTrash ? T["moved_to_trash"] : T["deleted"]} ${
            T["successfully"]
          }`,
          successType
        );
        fetchBaskets();
        setPage(1);
        // setProducts(deleteItemBasedOnId(products, itemToDelete));
      })
      .catch((err) => {
        toastMessage(err?.response?.data?.error || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setDeleteInfo({
          show: false,
          itemToDelete: null,
          status: "",
        });
        // toggleModal();
        // setItemToDelete(null);
        setDeleteLoader((prev) => false);
      });
  };

  const handleStatusCancel = () => {
    setStatusChangeInfo({
      status: "",
      show: false,
      id: null,
    });
    setButtonLoader((prev) => false);
  };

  const changeStatus = () => {
    const { status, id } = statusChangeInfo;
    setButtonLoader((prev) => true);
    const payload = {
      baskets: [id],
      status: status,
    };
    bulkActionBasket(payload)
      .then((res) => {
        toastMessage(T["status_updated_successfully"], successType);
        fetchBaskets();
      })
      .catch((err) => {
        console.log(err?.response?.data);
        toastMessage(err?.response?.data || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setPageLoader((prev) => false);
        handleStatusCancel();
      });
  };
  const handleExport = () => {
    setButtonLoader(true);

    makeApiRequest({
      endPoint: EXPORT_ENDPOINT,
      method: METHODS.get,
      responseType: "blob", // Ensure response is treated as binary data
    })
      .then((res) => {
        if (!res?.data) {
          throw new Error("No data received");
        }

        const blob = new Blob([res.data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        // **Dynamically determine the filename**
        let fileName = "exported-data.pdf"; // Default name
        const contentDisposition = res.headers["content-disposition"];

        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+?)"/);
          if (match?.[1]) {
            fileName = match[1]; // Use filename from response headers
          }
        } else {
          fileName = `export_${new Date()
            .toISOString()
            .slice(0, 19)
            .replace(/:/g, "-")}.pdf`;
        }

        a.href = url;
        a.download = fileName; // Set dynamic file name
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url); // Cleanup
      })
      .catch((err) => {
        console.error("Error downloading PDF:", err);
      })
      .finally(() => {
        setButtonLoader(false);
      });
  };

  return (
    <div>
      {pageLoader && <PageLoader />}
      <FilterSection
        filterFields={filterFields}
        handleFilterChange={handleFilterChange}
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        isProduct={true}
      >
        {/* update required : need to ask for export button functionality and add onClick accordingly */}
        <CommonButton
          text={T["export"]}
          onClick={handleExport}
          type="button"
          className="grey_btn"
          loader={buttonLoader}
          disabled={buttonLoader}
        />
        <CommonButton
          text={T["add_new_basket"]}
          onClick={() => navigate("/add-edit-basket")}
          type="button"
          className="orange_btn"
        />
      </FilterSection>
      <TableWrapper
        columns={BASKET_PAGE_COLUMNS}
        onCheckboxChange={(e) => {
          selectAllItems(e, baskets);
        }}
        checked={baskets?.length && baskets?.length === selectedBaskets?.length}
      >
        {baskets?.length ? (
          baskets?.map((dt, idx) => (
            <SingleBasketTableRow
              key={idx}
              data={dt}
              currentPage={page}
              index={idx}
              handleActions={handleActions}
              selectedBaskets={selectedBaskets}
              handleSelectBasket={handleSelectBasket}
              handleBasketStatusChange={(item, status) => {
                setStatusChangeInfo({
                  show: true,
                  id: item?.id,
                  status: status,
                });
              }}
            />
          ))
        ) : (
          // updates required:Create a better no data found component
          <NoDataFound />
        )}
      </TableWrapper>

      <Pagination
        onPageChange={onPageChange}
        itemsPerPage={ITEMS_PER_PAGE}
        totalData={totalData}
        currentPage={page}
      />

      {bulkDeleteConfirmation?.show && (
        <DeleteConfirmationModal
          title={BULK_DELETE_TITLE}
          description={BULK_BASKET_DELETE_DESCRIPTION}
          onCancel={() => {
            setBulkDeleteConfirmation({ show: false, payload: {}, value: "" });
          }}
          loader={bulkDeleteLoader}
          onDelete={bulkDeleteBasket}
        />
      )}

      {deleteInfo?.show && (
        <DeleteConfirmationModal
          title={createDeleteConfirmationTitle("basket", deleteInfo?.status)}
          deleteText={
            deleteInfo?.status === "delete" ? "delete" : "move_to_trash"
          }
          description={createDeleteConfirmationDescription(
            "basket",
            deleteInfo?.status
          )}
          onCancel={() => {
            setDeleteInfo({
              show: false,
              itemToDelete: null,
              status: "",
            });
          }}
          loader={deleteLoader}
          onDelete={handleDeleteBasket}
        />
      )}

      {statusChangeInfo?.show && (
        <ChangeStatusModal
          description={
            T[
              "this_action_will_update_the_status_of_the_basket_and_cannot_be_undone"
            ]
          }
          onStatusChange={changeStatus}
          loader={buttonLoader}
          onCancel={handleStatusCancel}
        >
          <p>
            {T["are_you_sure_you_want_to_update_status_to"]}{" "}
            <span className="capitalize">{statusChangeInfo?.status}</span>
          </p>
        </ChangeStatusModal>
      )}
    </div>
  );
};

export default Baskets;
