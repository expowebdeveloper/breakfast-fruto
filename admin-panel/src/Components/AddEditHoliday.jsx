import React, { useEffect } from "react";
import FormWrapper from "../Wrappers/FormWrapper";
import AddEditSectionHeading from "./AddEditSectionHeading";
import CommonTextField from "../Form Fields/CommonTextField";
import { RawMaterialValidations } from "../Validations/validations";
import CommonSelect from "../Form Fields/CommonSelect";
import CommonButton from "./Common/CommonButton";
import { draftIcon, publishIcon } from "../assets/Icons/Svg";
import CommonDateField from "../Form Fields/CommonDateField";
import { MEASURE_OPTIONS, today, YYYY_MM_DD } from "../constant";
import {
  formatDate,
  prefillFormValues,
  createRequiredValidation,
} from "../utils/helpers";
import { T } from "../utils/languageTranslator";

const AddEditHoliday = ({
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
    const prefillKeys = [];
    if (isEdit) {
      prefillFormValues(item, prefillKeys, setValue);
    }
  }, []);
  console.log(holidayDate,"holidayDate")

  return (
    <div className="  fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
      <div className="category-section overflow-auto">
        <AddEditSectionHeading
          onClose={onClose}
          text={isEdit ? T["edit_holiday"] : T["add_holiday"]}
        />
        <FormWrapper
          onSubmit={onSubmit}
          formConfig={formConfig}
          className="orange_btn"
          isCustomButtons={true}
        >
          <CommonDateField
            formConfig={formConfig}
            fieldName="holiday_date"
            rules={createRequiredValidation(T["holiday_date"])}
            label={`${T["select_holiday_date"]} *`}
          />

          <CommonTextField
            label={`${T["holiday_name"]} *`}
            fieldName="holiday"
            rules={createRequiredValidation(T["holiday_name"])}
            formConfig={formConfig}
            placeholder={T["enter_holiday_name"]}
          />

          <div className="button-section">
            <CommonButton
              type="submit"
              text={T["add_holiday"]}
              className="orange_btn"
              name="add_holiday"
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

export default AddEditHoliday;
