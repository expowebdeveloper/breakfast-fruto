"use client";
import React, { useState } from "react";
import Autocomplete from "react-google-autocomplete";
import ErrorMessage from "./_common/ErrorMessage";

const GOOGLE_MAP_API_KEY = "AIzaSyCA-pKaniZ4oeXOpk34WX5CMZ116zBvy-g";

const LocationField = ({
  fieldName,
  options,
  formConfig,
  label,
  className = "commonInput",
  placeholder,
  rules,
}) => {
  const { setValue, clearErrors, formState: { errors } } = formConfig;
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="w-full">
      <div className="label">{label}</div>
      <Autocomplete
        apiKey={GOOGLE_MAP_API_KEY}
        options={options}
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          clearErrors(fieldName);
        }}
        onPlaceSelected={(place) => {
          setValue(fieldName, place);
          setInputValue(place.formatted_address || "");
        }}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        className={className}
      />
      <ErrorMessage errors={errors?.[fieldName]?.message} />
      </div>
  );
};

export default LocationField;
