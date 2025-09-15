import { LoadScript, Autocomplete } from "@react-google-maps/api";
import { useRef, useState } from "react";
import { T } from "@/_utils/LanguageTranslator";
import { getState, returnAddressInfo } from "@/_utils/helpers";

const GOOGLE_MAP_API_KEY = "AIzaSyCA-pKaniZ4oeXOpk34WX5CMZ116zBvy-g";

const libraries = ["places"];

const GoogleStateSearch = ({ handleSearchState }) => {
  const [selectedState, setSelectedState] = useState("");
  const autocompleteRef = useRef(null);

  const onPlaceChanged = () => {
    const place = autocompleteRef.current.getPlace();
    const addressComponents = place?.address_components || [];
    const { state } = returnAddressInfo(addressComponents);
    console.log(getState(state), "this is state");
    handleSearchState(getState(state));
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAP_API_KEY} libraries={libraries}>
      <Autocomplete
        onLoad={(ref) => (autocompleteRef.current = ref)}
        onPlaceChanged={onPlaceChanged}
        options={{
          types: ["address"],
          componentRestrictions: { country: ["se"] },
        }}
      >
        <input
          type="text"
          placeholder={T?.["enter_address"]}
          className="w-full md:flex-1 p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-[50px]"
        />
      </Autocomplete>
    </LoadScript>
  );
};

export default GoogleStateSearch;
