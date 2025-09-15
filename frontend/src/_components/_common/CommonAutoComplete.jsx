import React from "react";
import Autocomplete from "react-google-autocomplete";
import { Controller, Form } from "react-hook-form";

function CommonAutoComplete({
  label,
  name,
  control,
  rules,
  error,
  apiKey,
  onPlaceSelected,
  invalidFieldRequired = false,
  options,
}) {
  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Label className="common-label">{label}</Form.Label>
        <Controller
          name={name}
          control={control}
          rules={rules}
          render={({ field }) => (
            <Autocomplete
              {...field}
              apiKey={apiKey}
              onPlaceSelected={onPlaceSelected}
              options={options}
              placeholder={placeholder}
              className={`common-field font-14 w-100 ${
                invalidFieldRequired && error?.message && "invalid-field"
              }`}
            />
          )}
        />
        {error && (
          <p
            className={`${
              invalidFieldRequired ? "field-error" : "error-message"
            }`}
          >
            {error?.message}
          </p>
        )}
      </Form.Group>
    </div>
  );
}

export default CommonAutoComplete;
