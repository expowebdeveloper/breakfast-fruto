import React from "react";
import { convertTo12HourFormat, renderSerialNumber } from "../utils/helpers";
import { ITEMS_PER_PAGE } from "../constant";
import { editIcon, trashIcon } from "../assets/Icons/Svg";

const SingleTimeSlotRaw = ({
  page,
  index,
  data,
  currentPage,
  handleActions,
}) => {
  return (
    <tr className=" border border-gray-400 ">
      <td className="py-2 px-4 border-0 bg-white text-center ">
        {renderSerialNumber(currentPage, ITEMS_PER_PAGE, index)}
      </td>
      <td className="py-2 px-4 border-0 bg-white text-center ">
        {data?.start_time ? convertTo12HourFormat(data?.start_time) : "-"}
      </td>
      <td className="py-2 px-4 border-0 bg-white text-center ">
        {data?.end_time ? convertTo12HourFormat(data?.end_time) : "-"}
      </td>
      <td className="py-2 px-4 border-0 bg-white text-center ">
        {data?.order_amount || "0.00"} SEK
      </td>
      <td className="py-2 px-4 border-0 bg-white text-center ">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleActions({ action: "edit", item: data })}
            className="text-blue-500 hover:text-blue-700"
          >
            {editIcon}
          </button>
          <button
            onClick={() => handleActions({ action: "delete", item: data })}
            className="text-red-500 hover:text-red-700"
          >
            {trashIcon}
          </button>
        </div>
      </td>
    </tr>
  );
};

export default SingleTimeSlotRaw;
