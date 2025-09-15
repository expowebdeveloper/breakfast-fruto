import { deleteIcon, trashIcon } from "@/_Svgs/Svg";
import { T } from "@/_utils/LanguageTranslator";
import React from "react";
import CommonButton from "./CommonButton";

const DeleteConfirmationModal = ({
  icon = trashIcon,
  title,
  description,
  onDelete,
  onCancel,
  loader,
  deleteText = "",
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-10 w-full shadow-lg w-full max-w-[800px] delete_modal">
        <div className="flex justify-center">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <h2 className="text-[27px] mb-[0px] font-semibold text-center text-gray-900 mt-4">
          {title}
        </h2>
        <p className="text-base text-center text-gray-600 mt-0">
          {description}
        </p>
        <div className="flex justify-center mt-6 space-x-3">
          <CommonButton
            text={deleteText ? deleteText:T["delete"]}
            onClick={onDelete}
            type="button"
            className="bg-green-500 text-white py-2 px-4 rounded-md flex items-center gap-2 flex-row-reverse"
            disabled={loader}
            loader={loader}
            icon={true ? "" : deleteIcon}
          />

          {/* <button className="orange_btn" onClick={onDelete}>
            Delete
          </button> */}
          <CommonButton
            text={T["cancel"]}
            onClick={onCancel}
            type="button"
            className="bg-green-500 text-white py-2 px-4 rounded-md "
          />
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
