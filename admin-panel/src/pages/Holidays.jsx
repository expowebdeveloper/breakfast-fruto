import React, { useEffect, useState } from "react";
import { makeApiRequest, METHODS } from "../api/apiFunctions";
import { HOLIDAYS_ENDPOINT } from "../api/endpoints";
import CommonTextField from "../Form Fields/CommonTextField";
import AddEditHoliday from "../Components/AddEditHoliday";
import TableWrapper from "../Wrappers/TableWrapper";
import { renderSerialNumber } from "../utils/helpers";
import NoDataFound from "../Components/Common/NoDataFound";
import Pagination from "../Components/Common/Pagination";
import usePagination from "../hooks/usePagination";
import { useForm } from "react-hook-form";
import { DEFAULT_ERROR_MESSAGE, ITEMS_PER_PAGE } from "../constant";
import { T } from "../utils/languageTranslator";
import PageLoader from "../loaders/PageLoader";
import FilterSection from "../Components/Common/FilterSection";
import useModalToggle from "../hooks/useModalToggle";
import CommonButton from "../Components/Common/CommonButton";
import { successType, toastMessage } from "../utils/toastMessage";
const filterFields = [
  {
    type: "search",
    filterName: "search",
    placeholder: T["search_holiday"],
  },
];
function Holidays() {
  const formConfig = useForm();
  const { reset } = formConfig;
  const { page, onPageChange, setPage } = usePagination();
  const [editInfo, setEditInfo] = useState({
    isEdit: false,
    item: null,
  });
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({
    search: "",
  });
  const { showModal: showHolidaySection, toggleModal: toggleHolidaySection } =
    useModalToggle();

  const [holidays, setHolidays] = useState();
  const [totalData, setTotalData] = useState();
  const [showAddEditHoliday, setShowAddEditHoliday] = useState(false);
  const [pageLoader, setPageLoader] = useState(false);
  const [buttonLoader, setButtonLoader] = useState(false);
  console.log(holidays, "holidays");

  const HOLIDAY_TABLE_COLUMNS = [
    T["s_no"],
    T["date"],
    T["day"],
    T["holiday"],
    T["restrict_holiday"],
  ];
  useEffect(() => {
    fetchHolidays();
  }, [page, filters]);

  const fetchHolidays = () => {
    setPageLoader((prev) => true);
    const apiParams = {
      page: page,
      ...filters,
    };
    makeApiRequest({
      endPoint: HOLIDAYS_ENDPOINT,
      method: METHODS.get,
      params: apiParams,
    })
      .then((res) => {
        setHolidays(res?.data?.results || []);
        setTotalData(res?.data?.count || 0);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };
  const handleFilterChange = (filterName, value) => {
    const temp = { ...filters };
    if (!searchInput) {
      temp["search"] = "";
    }
    temp[filterName] = value;
    setPage(1);
    setFilters(temp);
  };
  const handleHolidayCancel = () => {
    toggleHolidaySection();
    setEditInfo({ isEdit: false, item: null });
    reset();
  };
  const handleAddEditHoliday = (data) => {
    const dateObj = new Date(data?.holiday_date);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "long" });

    const payload = {
      holiday: data?.holiday,
      day: dayName,
      date: data?.holiday_date,
    };
    console.log(payload, "this is data");
    setButtonLoader((prev) => true);
    makeApiRequest({
      endPoint: HOLIDAYS_ENDPOINT,
      method: METHODS.post,
      payload: payload,
    })
      .then((res) => {
        console.log(res, "holiday response");
        toastMessage(T["holiday_added_successfully"], successType);
        setPage(1);
        fetchHolidays();
        toggleHolidaySection();
      })
      .catch((err) => {
        console.log(err, "holiday_err");
        toastMessage(err?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setButtonLoader((prev) => false);
      });
  };

  const handleRestrictHoliday = (e, item) => {
    const { checked } = e.target;
    const payload = { ...item, restricted: checked };
    setPageLoader((prev) => true);
    makeApiRequest({
      endPoint: HOLIDAYS_ENDPOINT,
      method: METHODS.patch,
      payload: payload,
      update_id: item?.id,
    })
      .then((res) => {
        console.log(res, "this is res");
        toastMessage(T["holiday_updated_successfully"], successType);
        fetchHolidays();
      })
      .catch((err) => {
        console.log(err, "err");
        toastMessage(err?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setPageLoader((prev) => false);
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
          text={T["add_holiday"]}
          className="orange_btn"
          onClick={toggleHolidaySection}
        />
      </FilterSection>
      <div>
        <TableWrapper columns={HOLIDAY_TABLE_COLUMNS}>
          {holidays?.length ? (
            holidays?.map((dt, idx) => (
              <tr className=" border border-gray-400 ">
                <td className="py-2 px-4 border-0 bg-white text-center ">
                  {renderSerialNumber(page, ITEMS_PER_PAGE, idx)}
                </td>
                <td className="py-2 px-4 border-0 bg-white text-center ">
                  {dt?.date || "-"}
                </td>
                <td className="py-2 px-4 border-0 bg-white text-center">
                  {dt?.day || "-"}
                </td>
                <td className="py-2 px-4 border-0 bg-white text-center">
                  {dt?.holiday || "-"}
                </td>
                <td className="py-2 px-4 border-0 bg-white text-center">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      value=""
                      checked={dt?.restricted}
                      class="sr-only peer"
                      onChange={(e) => handleRestrictHoliday(e, dt)}
                    />
                    <div className="relative w-11 h-6 bg-green-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-green-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                  </label>
                </td>
              </tr>
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
      {showHolidaySection && (
        <AddEditHoliday
          formConfig={formConfig}
          onClose={handleHolidayCancel}
          onSubmit={handleAddEditHoliday}
          editInfo={editInfo}
          loader={buttonLoader}
        />
      )}
    </>
  );
}

export default Holidays;
