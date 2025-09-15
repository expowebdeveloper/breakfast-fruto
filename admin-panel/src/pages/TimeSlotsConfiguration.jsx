import React, { useEffect, useState } from "react";
import { T } from "../utils/languageTranslator";
import CommonButton from "../Components/Common/CommonButton";
import { TIME_SLOT_ENDPOINT } from "../api/endpoints";
import { makeApiRequest, METHODS } from "../api/apiFunctions";
import NoTimeSlotSection from "../Components/NoTimeSlotSection";
import PageLoader from "../loaders/PageLoader";
import AddEditTimeSlotSection from "../Components/AddEditTimeSlotSection";
import { useForm } from "react-hook-form";
import { DEFAULT_ERROR_MESSAGE, ITEMS_PER_PAGE } from "../constant";
import { successType, toastMessage } from "../utils/toastMessage";
import usePagination from "../hooks/usePagination";
import {
  convertTo12HourFormat,
  createDeleteConfirmationDescription,
  createDeleteConfirmationTitle,
} from "../utils/helpers";
import FilterSection from "../Components/Common/FilterSection";
import Pagination from "../Components/Common/Pagination";
import TableWrapper from "../Wrappers/TableWrapper";
import SingleTimeSlotRaw from "../Components/SingleTimeSlotRaw";
import DeleteConfirmationModal from "../Modals/DeleteConfirmationModal";
const TIME_SLOT_COLUMNS = [
  T["s_no"],
  T["start_delivery_time"],
  T["end_delivery_time"],
  T["order_amount"],
  T["actions"],
];
const filterFields = [
//   {
//     type: "search",
//     filterName: "search",
//     placeholder: T["search_time_slot"],
//   },
];

function TimeSlotsConfiguration() {
  const formConfig = useForm();
  const { watch, reset } = formConfig;
  const { page, onPageChange, setPage } = usePagination();
  const [configurations, setConfigurations] = useState([]);
  const [deleteLoader, setDeleteLoader] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [pageLoader, setPageLoader] = useState(false);
  const [showTimeSlotSection, setShowTimeSlotSection] = useState(false);
  const [editInfo, setEditInfo] = useState({ isEdit: false, item: null });
  const [btnLoader, setBtnLoader] = useState(false);
  const [totalData, setTotalData] = useState(0);
  const [filters, setFilters] = useState({
    search: "",
  });
  const [deleteInfo, setDeleteInfo] = useState({
    show: false,
    itemToDelete: null,
  });

  useEffect(() => {
    fetchConfigurations();
  }, [filters, page]);

  const fetchConfigurations = () => {
    setPageLoader((prev) => true);
    const apiParams = {
      ...filters,
      page: page,
    };

    makeApiRequest({
      endPoint: TIME_SLOT_ENDPOINT,
      method: METHODS.get,
      params: apiParams,
    })
      .then((res) => {
        setConfigurations(res.data?.results);
        setTotalData(res.data?.count);
      })
      .catch((err) => {
        console.log(err, "error");
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };

  const handleAddEditSlot = (data) => {
    const { isEdit, item } = editInfo;
    const payload = {
      start_time: convertTo12HourFormat(data?.start_time),
      end_time: convertTo12HourFormat(data?.end_time),
      order_amount: data?.order_amount,
    };
    setBtnLoader((prev) => true);
    makeApiRequest({
      endPoint: TIME_SLOT_ENDPOINT,
      method: isEdit ? METHODS.patch : METHODS.post,
      payload: payload,
      update_id: isEdit ? item?.id : null,
    })
      .then((res) => {
        console.log(res, "res");
        toastMessage(
          isEdit
            ? T["time_slot_updated_successfully"]
            : T["time_slot_added_successfully"],
          successType
        );
        if (page > 1) {
          setPage(1);
        } else {
          fetchConfigurations();
        }
        handleClose();
      })
      .catch((err) => {
        console.log(err, "error");
        toastMessage(
          err?.response?.data?.message ||
            err?.response?.data?.[0] ||
            DEFAULT_ERROR_MESSAGE
        );
      })
      .finally(() => {
        setBtnLoader((prev) => false);
      });
  };
  const handleClose = () => {
    setEditInfo({ isEdit: false, item: null });
    setShowTimeSlotSection(false);
    reset();
  };

  const handleFilterChange = (filterName, value) => {
    const temp = { ...filters };
    if (!searchInput) {
      temp["search"] = "";
    }
    temp[filterName] = value;
    setFilters(temp);
    // setPage(1);
  };
  const handleActions = ({ action, item }) => {
    if (action === "delete") {
      setDeleteInfo({
        show: true,
        itemToDelete: item,
      });
    } else {
      setShowTimeSlotSection(true);
      setEditInfo({
        isEdit: true,
        item: item,
      });
    }
  };

  const deleteTimeSlot = () => {
    setDeleteLoader((prev) => true);
    makeApiRequest({
      endPoint: TIME_SLOT_ENDPOINT,
      method: METHODS.delete,
      delete_id: deleteInfo?.itemToDelete?.id,
    })
      .then((res) => {
        toastMessage(T["time_slot_deleted_successfully"], successType);
        if (page > 1) {
          setPage(1);
        } else {
          fetchConfigurations();
        }
      })
      .catch((err) => {
        toastMessage(err?.response?.data?.message || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setDeleteLoader((prev) => false);
        setDeleteInfo({
          show: false,
          itemToDelete: null,
        });
      });
  };
  return (
    <div>
      {pageLoader && <PageLoader />}
      {configurations.length > 0 || showTimeSlotSection ? (
        <div>
          <FilterSection
            filterFields={filterFields}
            handleFilterChange={handleFilterChange}
            filters={filters}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
          >
            <CommonButton
              text={T["add_time_slot"]}
              className="orange_btn"
              onClick={() => {
                setShowTimeSlotSection(true);
              }}
            />
          </FilterSection>
          <TableWrapper columns={TIME_SLOT_COLUMNS}>
            {configurations?.map((it, idx) => (
              <SingleTimeSlotRaw
                key={idx}
                data={it}
                index={idx}
                currentPage={page}
                handleActions={handleActions}
              />
            ))}
          </TableWrapper>
          <Pagination
            onPageChange={onPageChange}
            itemsPerPage={ITEMS_PER_PAGE}
            totalData={totalData}
            currentPage={page}
          />
        </div>
      ) : (
        <NoTimeSlotSection onClick={() => setShowTimeSlotSection(true)} />
      )}
      {deleteInfo?.show && (
        <DeleteConfirmationModal
          title={createDeleteConfirmationTitle("time_slot", "delete")}
          description={createDeleteConfirmationDescription(
            "time_slot",
            "delete"
          )}
          onCancel={() => {
            setDeleteInfo({
              show: false,
              itemToDelete: null,
            });
          }}
          deleteText={"delete"}
          loader={deleteLoader}
          onDelete={deleteTimeSlot}
        />
      )}
      {showTimeSlotSection && (
        <AddEditTimeSlotSection
          formConfig={formConfig}
          editInfo={editInfo}
          onSubmit={handleAddEditSlot}
          onClose={handleClose}
          loader={btnLoader}
        />
      )}
    </div>
  );
}

export default TimeSlotsConfiguration;
