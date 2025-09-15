import React from "react";
import { ITEMS_PER_PAGE, YYYY_MM_DD } from "../../constant";
import { formatDate, renderSerialNumber } from "../../utils/helpers";

const SingleSubscriberRow = ({ dt, idx, page }) => {
  return (
    <tr className="border border-gray-400">
      <td className="py-2 px-4 bg-white text-center">
        {renderSerialNumber(page, ITEMS_PER_PAGE, idx)}
      </td>
      <td className="py-2 px-4 bg-white text-center">{dt?.email || "-"}</td>
      <td className="py-2 px-4 bg-white text-center">
        {formatDate(dt?.subscribed_at,YYYY_MM_DD) || "-"}
      </td>
      {/* <td className="py-2 px-4 bg-white text-center">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={dt?.active}
            onChange={(e) => handleActiveToggle(e, dt)}
            className="sr-only peer"
          />
          <div className="relative w-11 h-6 bg-green-200 peer-focus:outline-none rounded-full peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
        </label>
      </td> */}
    </tr>
  );
};

export default SingleSubscriberRow;
