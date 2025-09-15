import React from "react";
import ToolTips from "./_common/ToolTips";
import { trashIcon } from "@/_Svgs/Svg";
import { T } from "@/_utils/LanguageTranslator";

const CartDeleteIcon = ({ onClick, showBorder = true, showTooltip = true }) => {
  return (
    <>
      {showTooltip ? (
        <ToolTips text={T["remove_item_from_cart"]} position="left">
          <div className="flex items-center cursor-pointer" onClick={onClick}>
            <h4
              className={`mb-0 p-[5px] rounded-sm `}
            >
              {trashIcon}
            </h4>
          </div>
        </ToolTips>
      ) : (
        <div className="flex items-center cursor-pointer" onClick={onClick}>
          <h4 className={`mb-0 p-[5px] rounded-sm`}>{trashIcon}</h4>
        </div>
      )}
    </>
  );
};

export default CartDeleteIcon;
