"use client";

import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { useRef } from "react";
import { Controller } from "react-hook-form";
import { getState, returnAddressInfo } from "@/_utils/helpers";

const GOOGLE_MAP_API_KEY = "AIzaSyCA-pKaniZ4oeXOpk34WX5CMZ116zBvy-g";
const libraries = ["places"];

const LocationComponent = ({
  label,
  placeholder = "",
  className = "",
  fieldName = "address",
  formConfig,
  handleSearchState,
  rules = { required: "Address is required" },
}) => {
  const {
    control,
    formState: { errors },
    setError,
    setValue,
    clearErrors,
  } = formConfig;

  const autocompleteRef = useRef(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAP_API_KEY,
    libraries,
  });

  if (loadError) {
    return <p className="text-red-500">Failed to load Google Maps script.</p>;
  }

  if (!isLoaded) {
    return <p>Loading Google Maps...</p>;
  }

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    const formattedAddress = place?.formatted_address;
    const addressComponents = place?.address_components || [];
    const { state, city } = returnAddressInfo(addressComponents);
    const formattedState = getState(state);
    setValue(fieldName, formattedAddress, { shouldValidate: true });
    setValue(
      "state",
      { label: formattedState, value: formattedState },
      { shouldValidate: true }
    );
    setValue("city", city, { shouldValidate: true });
  };

  return (
    <div>
      <label className="block mb-1 font-medium">{label}</label>
      <Controller
        name={fieldName}
        control={control}
        rules={rules}
        render={({ field: { onChange, onBlur, value, ref } }) => (
          <Autocomplete
            onLoad={(ref) => (autocompleteRef.current = ref)}
            onPlaceChanged={handlePlaceChanged}
            options={{
              types: ["address"],
              componentRestrictions: { country: ["se"] },
            }}
          >
            <input
              type="text"
              placeholder={placeholder}
              className={`${className} ${
                errors[fieldName] ? "border-red-500" : ""
              }`}
              ref={ref}
              onChange={(e) => {
                onChange(e.target.value);
                clearErrors(fieldName);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              onBlur={(e) => {
                if (
                  typeof address !== "object" ||
                  !address?.formatted_address
                ) {
                  setValue(fieldName, "");
                  // Optionally, show an error if the address is not valid
                  // clearErrors(fieldName);
                  // setError(fieldName, {
                  //   type: "manual",
                  //   message: "Please select a valid address from the dropdown.",
                  // });
                }
              }}
              value={
                typeof value === "object"
                  ? value?.formatted_address || ""
                  : value || ""
              }
            />
          </Autocomplete>
        )}
      />

      {errors?.[fieldName] && (
        <p className="text-red-500 text-sm mt-1">{errors[fieldName].message}</p>
      )}
    </div>
  );
};

export default LocationComponent;
