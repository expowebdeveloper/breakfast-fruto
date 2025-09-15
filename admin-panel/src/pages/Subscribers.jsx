import React, { useEffect, useState } from "react";
import { makeApiRequest, METHODS } from "../api/apiFunctions";
import { EXPORT_ENDPOINT, SUBSCRIBERS_ENDPOINT } from "../api/endpoints";
import { useForm } from "react-hook-form";
import { DEFAULT_ERROR_MESSAGE, ITEMS_PER_PAGE } from "../constant";
import { T } from "../utils/languageTranslator";
import { successType, toastMessage } from "../utils/toastMessage";

import usePagination from "../hooks/usePagination";
import useModalToggle from "../hooks/useModalToggle";

import TableWrapper from "../Wrappers/TableWrapper";
import PageLoader from "../loaders/PageLoader";
import NoDataFound from "../Components/Common/NoDataFound";
import Pagination from "../Components/Common/Pagination";
import FilterSection from "../Components/Common/FilterSection";
import CommonButton from "../Components/Common/CommonButton";
import { downloadPDF, renderSerialNumber } from "../utils/helpers";
import SingleSubscriberRow from "../Components/Common/SingleSubscriberRow";
import { baseURL } from "../api/apiConfig";

const filterFields = [
  {
    type: "search",
    filterName: "email",
    placeholder: T["search_subscriber"],
  },
];

function Subscribers() {
  const formConfig = useForm();
  const { reset } = formConfig;

  const { page, onPageChange, setPage } = usePagination();

  const [subscribers, setSubscribers] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [pageLoader, setPageLoader] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);

  const [editInfo, setEditInfo] = useState({ isEdit: false, item: null });
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ email: "" });

  const { showModal: showSubscriberModal, toggleModal: toggleSubscriberModal } =
    useModalToggle();

  const SUBSCRIBER_TABLE_COLUMNS = [
    T["s_no"],
    T["email"],
    T["subscribed_date"],
    // T["active"],
  ];

  useEffect(() => {
    fetchSubscribers();
  }, [page, filters]);

  const fetchSubscribers = () => {
    setPageLoader(true);
    const apiParams = { page, ...filters };
    makeApiRequest({
      endPoint: SUBSCRIBERS_ENDPOINT,
      method: METHODS.get,
      params: apiParams,
    })
      .then((res) => {
        setSubscribers(res?.data?.results?.subscribers || []);
        setTotalData(res?.data?.count || 0);
      })
      .catch((err) => {
        console.log(err);
        toastMessage(err?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => setPageLoader(false));
  };

  const handleFilterChange = (filterName, value) => {
    const temp = { ...filters };
    if (!searchInput) {
      temp["email"] = "";
    }
    temp[filterName] = value;
    setPage(1);
    setFilters(temp);
  };

  const handleSubscriberCancel = () => {
    toggleSubscriberModal();
    setEditInfo({ isEdit: false, item: null });
    reset();
  };

  const handleAddEditSubscriber = (data) => {
    const payload = {
      name: data.name,
      email: data.email,
      subscribed_date: data.subscribed_date,
      active: data.active,
    };

    setButtonLoader(true);
    makeApiRequest({
      endPoint: SUBSCRIBERS_ENDPOINT,
      method: METHODS.post,
      payload,
    })
      .then((res) => {
        toastMessage(T["subscriber_added_successfully"], successType);
        setPage(1);
        fetchSubscribers();
        toggleSubscriberModal();
      })
      .catch((err) => {
        console.log(err);
        toastMessage(err?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => setButtonLoader(false));
  };

  const handleExport = () => {
    setButtonLoader((prev) => true);

    makeApiRequest({
      endPoint: "/delivery/subscribe-csv/",
      method: METHODS.get,
      responseType: "blob",
    })
      .then((res) => {
        if (!res?.data) {
          throw new Error("No data received");
        }

        const updatedUrl = baseURL.endsWith("/")
          ? baseURL.slice(0, -1)
          : baseURL;

        const pdfUrl = `${updatedUrl}${res.data.pdf_path}`;

        // Open the PDF in a new tab
        if (pdfUrl) {
          window.open(pdfUrl, "_blank");
        } else {
          throw new Error("No PDF URL found");
        }
      })
      .catch((err) => {
        console.error("Error downloading PDF:", err);
      })
      .finally(() => {
        setButtonLoader((prev) => false);
      });
  };

  return (
    <>
      {pageLoader && <PageLoader />}
      <FilterSection
        filterFields={filterFields}
        handleFilterChange={handleFilterChange}
        filters={filters}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
      >
        <CommonButton
          text={T["export"]}
          className="orange_btn"
          onClick={handleExport}
          loader={buttonLoader}
          disabled={buttonLoader}
        />
      </FilterSection>
      <div>
        <TableWrapper columns={SUBSCRIBER_TABLE_COLUMNS}>
          {subscribers?.length ? (
            subscribers.map((dt, idx) => (
              <SingleSubscriberRow key={idx} dt={dt} idx={idx} page={page} />
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
      </div>
      {/* {showSubscriberModal && (
        <AddEditSubscriber
          formConfig={formConfig}
          onClose={handleSubscriberCancel}
          onSubmit={handleAddEditSubscriber}
          editInfo={editInfo}
          loader={buttonLoader}
        />
      )} */}
    </>
  );
}

export default Subscribers;
