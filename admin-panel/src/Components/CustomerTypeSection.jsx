import React from "react";
import { getCustomerType } from "../utils/helpers";

const CustomerTypeSection = ({ item }) => {
  return (
    <div className="">
      {getCustomerType(item?.customer_type) || "-"}
      <br />
      <span style={{ paddingLeft: "5px", whiteSpace: "nowrap" }}>
        (
        {getCustomerType(item?.customer_type) === "Company"
          ? item?.organization_name || "-"
          : item?.customer_name || "-"}
        )
      </span>
    </div>
  );
};

export default CustomerTypeSection;
