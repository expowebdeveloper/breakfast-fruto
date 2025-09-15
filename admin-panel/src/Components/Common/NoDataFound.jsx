import React from "react";
import { T } from "../../utils/languageTranslator";

const NoDataFound = () => {
  return (
    <td>
      <div className="no_data">{T["no_data_found"]}</div>
    </td>
  );
};

export default NoDataFound;
