import React, { useEffect } from "react";
import FormWrapper from "../Wrappers/FormWrapper";
import AddEditSectionHeading from "./AddEditSectionHeading";
import CommonTextField from "../Form Fields/CommonTextField";
import CommonButton from "./Common/CommonButton";
import CommonDateField from "../Form Fields/CommonDateField";
import {
  formatDate,
  prefillFormValues,
  createRequiredValidation,
} from "../utils/helpers";
import { T } from "../utils/languageTranslator";

const AddEditTimeSlot = ({
  formConfig,
  onClose,
  onSubmit,
  editInfo,
  loader,
}) => {
  const { isEdit, item } = editInfo;
  const { setValue, watch } = formConfig;
  const holidayDate = watch("holiday_date");
  useEffect(() => {
    console.log(item, "this is item");
    const prefillKeys = ["start_time", "end_time", "order_amount"];
    if (isEdit) {
      prefillFormValues(item, prefillKeys, setValue);
    }
  }, []);
  console.log(holidayDate, "holidayDate");

  return (
    <div className="  fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="category-section overflow-auto">
        <AddEditSectionHeading
          onClose={onClose}
          text={isEdit ? T["edit_timeslot"] : T["add_timeslot"]}
        />
        <FormWrapper
          onSubmit={onSubmit}
          formConfig={formConfig}
          className="orange_btn"
          isCustomButtons={true}
        >
          <CommonDateField
            formConfig={formConfig}
            fieldName="start_time"
            rules={createRequiredValidation(T["start_delivery_date"])}
            label={`${T["select_start_delivery_time"]} *`}
            type="time"
          />

          <CommonDateField
            formConfig={formConfig}
            fieldName="end_time"
            rules={createRequiredValidation(T["end_delivery_date"])}
            label={`${T["select_end_delivery_time"]} *`}
            type="time"
          />

          <CommonTextField
            label={T["enter_order_amount_on_each_slot"]}
            formConfig={formConfig}
            fieldName="order_amount"
            isNumber={true}
            isDecimal={true}
            placeholder={T["eg_50"]}
            rules={createRequiredValidation(T["order_amount"])}
          />

          <div className="button-section">
            <CommonButton
              type="submit"
              text={isEdit ? T["update_time_slot"] : T["add_time_slot"]}
              className="orange_btn"
              name="add_time_slot"
              loader={loader}
              disabled={loader}
            />
            <CommonButton
              type="button"
              text={T["cancel"]}
              className="grey_btn"
              name="cancel"
              onClick={onClose}
            />
          </div>
        </FormWrapper>
      </div>
    </div>
  );
};

export default AddEditTimeSlot;
