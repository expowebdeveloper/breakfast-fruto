import React, { createContext, useContext, useEffect, useState } from "react";

const HeaderContext = createContext();

export const useHeader = () => useContext(HeaderContext);

export const HeaderProvider = ({ children }) => {
  const [header, setHeader] = useState(null);
  // Load profile from localStorage on component mount
  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setHeader(JSON.parse(storedProfile));
    }
  }, []);

  // Update localStorage whenever the profile changes
  const updateHeader = (data) => {
    setHeader(data);
    localStorage.setItem("headerInfo", JSON.stringify(data));
  };

  console.log(header, "header context");
  return (
    <HeaderContext.Provider value={{ header, updateHeader }}>
      {children}
    </HeaderContext.Provider>
  );
};
