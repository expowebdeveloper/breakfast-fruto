"use client";

import React, { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import GooglePlacesAutocomplete from "react-google-autocomplete";

const AddressAutoComplete = ({ T }) => {
  const router = useRouter();
  const [buttonLoader, setButtonLoader] = useState(false);

  const handlePlaceSelected = (place) => {
    const stateObj = place.address_components?.find((component) =>
      component.types.includes("administrative_area_level_1")
    );

    const selectedState = stateObj?.long_name;

    if (selectedState) {
      handleSearch(selectedState);
    } else {
      console.warn("State not found in selected place.");
    }
  };

  const handleSearch = (state) => {
    setButtonLoader(true);
    callApi({
      endPoint: SEARCH_ZIPCODE,
      method: METHODS.post,
      instanceType: INSTANCE.authorize,
      payload: {
        state: state || "",
      },
    })
      .then((res) => {
        toastMessages(res?.data?.message, successType);
        router.push("/products");
      })
      .catch((err) => {
        console.log(err?.response?.data, "state search error");
        toastMessages(err.response.data.message || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setButtonLoader(false);
      });
  };

  return (
    <div className="flex flex-col md:flex-row items-center mt-6 w-full max-w-md space-y-4 md:space-y-0 md:space-x-4 relative w-[700px]">
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
      />

      <GooglePlacesAutocomplete
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}
        selectProps={{
          onChange: () => {}, // not used here
        }}
        onPlaceSelected={handlePlaceSelected}
        options={{
          types: ["(regions)"],
          componentRestrictions: { country: "in" },
        }}
        placeholder={T?.["search_zipcode"]}
        className="w-[450px] md:flex-1 p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-[50px]"
      />
    </div>
  );
};

export default AddressAutoComplete;
