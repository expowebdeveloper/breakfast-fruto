import { PRODUCTS_SORT_BY } from "@/_constants/constant";
import { T } from "@/_utils/LanguageTranslator";
import React from "react";

const SortByFilter = ({ handleSortBy, sortByOptions, isType = false, value="" }) => {
  return (
    <div className="select flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0 items-start sm:items-center mt-[20px] sm:mt-[40px] px-2 sm:px-0 w-full">
      <div className="title text-[14px] sm:text-[16px] font-semibold">
        {isType ? T["basket_type"] : T["sort_by"]}
      </div>
      <select
        className="w-full w-full lg:w-auto border border-[#4BAF50] rounded-[5px] p-[8px] sm:p-[10px] text-[#4BAF50] text-sm sm:text-base"
        onChange={(e) => handleSortBy(e?.target?.value)}
        value={value}
      >
        <option value="" disabled ={isType ? false :true}>
          {isType ? T["all"] : T["sort_by"]}
        </option>
        {sortByOptions?.map(({ value, label }, index) => (
          <option value={value} key={index}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SortByFilter;
