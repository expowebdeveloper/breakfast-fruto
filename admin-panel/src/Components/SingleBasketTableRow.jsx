import React from "react";
import Checkbox from "./Common/Checkbox";
import {
  createPreview,
  formatDate,
  renderSerialNumber,
} from "../utils/helpers";
import { ITEMS_PER_PAGE, YYYY_MM_DD } from "../constant";
import {
  editIcon,
  eyeIcon,
  imagePlaceholder,
  trashIcon,
} from "../assets/Icons/Svg";
import { T } from "../utils/languageTranslator";
const BASKET_STATUS = [
  { label: T["draft"], value: "draft" },
  { label: T["publish"], value: "publish" },
];

const SingleBasketTableRow = ({
  selectedBaskets,
  handleSelectBasket,
  index,
  currentPage,
  data,
  handleActions,
  handleBasketStatusChange,
}) => {
  const {
    id,
    space,
    offer_price,
    basket_name,
    space_left,
    featured_image,
    is_active,
    products_detail,
    basket_price,
    is_active_sale,
    sale_price,
    start_sale,
    end_sale,
    created_at,
  } = data;
  return (
    <tr className=" border border-gray-400 ">
      <td className="text-center bg-white rounded-tl-[10px] rounded-bl-[10px] ">
        <Checkbox
          checked={selectedBaskets?.includes(id)}
          onClick={() => {
            handleSelectBasket(id);
          }}
        />
      </td>
      <td className="py-2 bg-white px-4 text-center">
        {renderSerialNumber(currentPage, ITEMS_PER_PAGE, index)}
      </td>
      {/* <td className="py-2 px-4">{id}</td> */}

      <td className="py-2 bg-white text-nowrap capitalize text-center">
        <div className="flex items-center space-x-2">
          {/* commented for removing basket image section */}
          <div className="image">
            {featured_image ? (
              <img
                className="basket-image"
                alt={basket_name}
                src={createPreview(featured_image)}
              />
            ) : (
              <div className="basket-imagePlaceholder">{imagePlaceholder}</div>
            )}
          </div>
          <div className="name capitalize">{basket_name}</div>
        </div>
      </td>
      <td className="py-2 bg-white text-nowrap capitalize text-center">
        {space_left || "-"}{" "}
      </td>

      <td
        className={`py-2 bg-white text-nowrap capitalize text-center ${
          products_detail?.length ? "text-[#28A745]" : "text-gray-500"
        }`}
      >
        {products_detail?.length || T["not_added"]}
        {/* {created_at ? formatDate(created_at, YYYY_MM_DD) : "-"} */}
      </td>
      <td className="py-2 bg-white px-4 text-nowrap text-center">
        {basket_price || "0.00"} {T["SEK"]}
      </td>
      <td className="py-2 px-4 border-0 bg-white">
        {is_active_sale ? (
          <div>
            <div className="price flex items-center gap-2">
              {offer_price || "0.00"} {T["SEK"]}
            </div>
            <div className="offer-date ">
              {formatDate(start_sale, YYYY_MM_DD) || "-"} to{" "}
              {formatDate(end_sale, YYYY_MM_DD) || "-"}
            </div>
          </div>
        ) : (
          <div className="text-gray-500">{T["no_offer"]}</div>
        )}
        <div className="status-change flex items-center"></div>
        <span className="text-[14px] text-[#666]">
          {/* {formatDate(created_at, YYYY_MM_DD)} */}
        </span>
      </td>
      <td className="py-2 px-4 border-0 bg-white">
        <div className="status-change flex items-center">
          <select
            value={is_active ? "publish" : "draft"}
            onChange={(e) => {
              handleBasketStatusChange(data, e.target.value);
            }}
          >
            {BASKET_STATUS?.map(({ label, value }) => (
              <option value={value}>{label}</option>
            ))}
          </select>
        </div>
        <span className="text-[14px] text-[#666]">
          {formatDate(created_at, YYYY_MM_DD)}
        </span>
      </td>
      <td className="py-2 bg-white px-4">
        <div className="flex gap-2">
          <button
            className="text-blue-500 hover:text-blue-700"
            onClick={() => handleActions({ action: "view", item: data })}
          >
            {eyeIcon}
          </button>
          <button
            onClick={() => handleActions({ action: "edit", id: id })}
            className="text-blue-500 hover:text-blue-700"
          >
            {editIcon}
          </button>
          <button
            onClick={() =>
              handleActions({ action: "delete", deleteItem: data })
            }
            className="text-red-500 hover:text-red-700"
          >
            {trashIcon}
          </button>
        </div>
      </td>
    </tr>
  );
};

export default SingleBasketTableRow;
