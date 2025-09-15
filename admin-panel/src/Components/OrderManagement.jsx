import React, { useEffect, useState } from "react";
import FilterSection from "../Components/Common/FilterSection";
import CommonButton from "../Components/Common/CommonButton";
import {
  CUSTOMER_TYPE_OPTIONS,
  DEFAULT_ERROR_MESSAGE,
  ITEMS_PER_PAGE,
  ORDER_TYPE_OPTIONS,
  ORDERS_SORT_BY,
  ORDERS_TYPE_OPTIONS,
  SORT_VALUES,
} from "../constant";
import { useLocation, useNavigate } from "react-router-dom";
import useLoader from "../hooks/useLoader";
import TableWrapper from "../Wrappers/TableWrapper";
import NoDataFound from "./Common/NoDataFound";
import usePagination from "../hooks/usePagination";
import SingleOrderManagementRow from "./SingleOrderManagementRow";
import { T } from "../utils/languageTranslator";
import { makeApiRequest, METHODS } from "../api/apiFunctions";
import { ORDERS_ENDPOINT } from "../api/endpoints";
import { successType, toastMessage } from "../utils/toastMessage";
import PageLoader from "../loaders/PageLoader";
import ChangeStatusModal from "./Common/ChangeStatusModal";
import { useForm } from "react-hook-form";
import {
  getSortValue,
  handlePrintPdf,
  handleViewPdf,
  removeLeadingDash,
} from "../utils/helpers";
import Pagination from "./Common/Pagination";
const filterFields = [
  {
    type: "select",
    filterName: "status",
    defaultOption: T["order_status"],
    options: ORDERS_TYPE_OPTIONS,
  },

  {
    type: "select",
    filterName: "sort_by",
    defaultOption: T["sort_by"],
    options: ORDERS_SORT_BY,
  },
  {
    type: "select",
    filterName: "customer_type",
    defaultOption: T["all_customers"],
    options: CUSTOMER_TYPE_OPTIONS,
  },
  {
    type: "select",
    filterName: "order_type",
    defaultOption: T["all"],
    options: ORDER_TYPE_OPTIONS,
  },
  {
    type: "search",
    filterName: "search",
    placeholder: T["search_order_history"],
  },
];
const STATUS_TO_TEXT = {
  payment_pending: "Payment pending",
  delivered: "Delivered",
  in_progress: "In-Progress",
  rejected: "Rejected",
  canceled: "Canceled",
  in_transit: "In-Transit",
  dispatched: "Dispatched",
};

const DUMMY_ORDERS = [
  {
    id: "45678",
    name: "John Doe",
    quantity: 10,
    payment: "123 SEK",
    paymentStatus: "Paid Online",
    dateTime: "10 Oct, 01:00 PM",
    status: "Pending",
  },
  {
    id: "45679",
    name: "Jane Smith",
    quantity: 5,
    payment: "250 SEK",
    paymentStatus: "Paid Online",
    dateTime: "11 Oct, 03:00 PM",
    status: "Pending",
  },
  {
    id: "45680",
    name: "Mike Johnson",
    quantity: 8,
    payment: "400 SEK",
    paymentStatus: "Paid Online",
    dateTime: "12 Oct, 10:00 AM",
    status: "Pending",
  },
];

const ORDER_MANAGEMENT_COLUMNS = [
  T["order_no"],
  T["customer_name"],
  T["order_date"],
  T["items"],
  T["order_status"],
  T["invoice_number"],
  // uncomment this
  T["customer_type"],
  T["order_type"],
  T["action"],
  "",
];
function OrderManagement() {
  const formConfig = useForm();
  const location = useLocation();
  const [receitLoader, setReceitLoader] = useState(false);
  // update this into something that is uniqu for a parituclar customer and it's orders
  const user_id = location?.state?.user_id;
  const [orders, setOrders] = useState(DUMMY_ORDERS);
  const [printLoader, setPrintLoader] = useState(false);
  const [viewLoader, setViewLoader] = useState(false);
  const [statusChangeInfo, setStatusChangeInfo] = useState({
    show: false,
    id: null,
    status: "",
  });
  const [totalData, setTotalData] = useState();
  const [buttonLoader, setButtonLoader] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const { page, onPageChange, setPage } = usePagination();
  const navigate = useNavigate();
  const { toggleLoader, pageLoader, setPageLoader } = useLoader();
  const [filters, setFilters] = useState({
    status: "",
    orders_type: "",
    sort_by: "",
    search: "",
    customer_type: "",
    order_type: "",
  });
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  // uncomment this

  useEffect(() => {
    fetchOrders();
  }, [page, filters]);
  const fetchOrders = () => {
    setPageLoader((prev) => true);
    let apiParams = {};
    if (user_id) {
      apiParams = {
        ...filters,
        page: page,
        search: user_id,
      };
    } else {
      apiParams = {
        ...filters,
        page: page,
      };
    }
    makeApiRequest({
      endPoint: ORDERS_ENDPOINT,
      params: apiParams,
      method: METHODS.get,
    })
      .then((res) => {
        setOrders(res?.data?.results);
        setTotalData(res?.data?.count);
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };
  const handleFilterChange = (filterName, value) => {
    let temp = { ...filters };
    if (filterName === "sort_by") {
      if (SORT_VALUES.includes(value)) {
        temp["sort"] = value;
        temp["sort_by"] = "";
      } else {
        temp["sort_by"] = removeLeadingDash(value);
        temp["sort"] = getSortValue(value);
      }
    } else {
      temp[filterName] = value;
    }
    setFilters(temp);
    setPage(1);
  };
  const handleActions = () => {};
  const handleStatusChange = (status, id) => {
    setPageLoader((prev) => true);
    const payload = {
      status: status,
    };
    makeApiRequest({
      endPoint: ORDERS_ENDPOINT,
      update_id: id,
      payload,
      method: METHODS?.patch,
    })
      .then((res) => {
        toastMessage("Status Updated Successfully", successType);
        fetchOrders();
      })
      .catch((err) => {
        console.log(err?.response?.data);
        toastMessage(err?.response?.data);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };
  const handleStatusCancel = () => {
    setStatusChangeInfo({
      id: null,
      status: "",
      show: false,
    });
  };
  const changeStatus = () => {
    setButtonLoader((prev) => true);
    const payload = {
      status: statusChangeInfo?.status,
    };
    makeApiRequest({
      endPoint: ORDERS_ENDPOINT,
      update_id: statusChangeInfo?.id,
      payload,
      method: METHODS?.patch,
    })
      .then((res) => {
        toastMessage("Status Updated Successfully", successType);
        fetchOrders();
      })
      .catch((err) => {
        toastMessage(err?.response?.data || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setButtonLoader((prev) => false);
        handleStatusCancel();
      });
  };

  const handleDeliveredReceipt = (type, index, orderId, tag = false) => {
    if (tag === "tag") {
      setPrintLoader(index);
    } else {
      setReceitLoader(index); 
    }

    makeApiRequest({
      endPoint: `orders/${
        tag === "tag" ? "orders" : "orders-details"
      }/${orderId}/pdf/`,
      method: METHODS?.get,
    })
      .then((res) => {
        if (tag === "tag") {
          console.log(res, "print response");
          handleViewPdf(res?.data?.file_path);
        } else {
          handleViewPdf(res?.data?.file_path);
        }
      })
      .catch((err) => {
        console.log(err?.response);
      })
      .finally(() => {
        if (tag === "tag") {
          setPrintLoader(null);
        } else {
          setReceitLoader(null);
        }
      });
  };
  return (
    <div>
      {pageLoader && <PageLoader />}
      <>
        <FilterSection
          filterFields={filterFields}
          handleFilterChange={handleFilterChange}
          filters={filters}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
        >
          <CommonButton
            text="Order History"
            className="orange_btn"
            onClick={() => navigate("/orders-history")}
          />
        </FilterSection>
        <TableWrapper columns={ORDER_MANAGEMENT_COLUMNS}>
          {orders?.length ? (
            orders?.map((it, idx) => (
              <SingleOrderManagementRow
                key={idx}
                item={it}
                index={idx}
                currentPage={page}
                handleActions={handleActions}
                receitLoader={receitLoader}
                openIndex={openIndex}
                handleDeliveredReceipt={handleDeliveredReceipt}
                printLoader={printLoader}
                viewLoader={viewLoader}
                handleToggle={handleToggle}
                handleStatusChange={(status, id) => {
                  setStatusChangeInfo({
                    show: true,
                    id: id,
                    status: status,
                  });
                }}
              />
            ))
          ) : (
            <NoDataFound />
          )}
        </TableWrapper>
        <Pagination
          onPageChange={onPageChange}
          itemsPerPage={ITEMS_PER_PAGE}
          totalData={totalData}
          currentPage={page}
        />
        {statusChangeInfo?.show && (
          <ChangeStatusModal
            description={`This action will update the status of the order and cannot be undone`}
            onStatusChange={changeStatus}
            loader={buttonLoader}
            onCancel={handleStatusCancel}
            formConfig={formConfig}
          >
            <p>
              Are you sure you want to update order status to{" "}
              <span className="capitalize">
                {STATUS_TO_TEXT[statusChangeInfo?.status]}
              </span>
            </p>
          </ChangeStatusModal>
        )}
      </>
    </div>
  );
}

export default OrderManagement;
