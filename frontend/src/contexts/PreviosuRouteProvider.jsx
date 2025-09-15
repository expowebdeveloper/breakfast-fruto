"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const PreviousRouteContext = createContext();

export const PreviousRouteProvider = ({ children }) => {
  const pathname = usePathname();
  const previousPathRef = useRef(null);
  const [previousPath, setPreviousPath] = useState("");

  useEffect(() => {
    // On pathname change, set the previousPath to what was in the ref (before update)
    setPreviousPath(previousPathRef.current);
    // Then update the ref to the current pathname
    previousPathRef.current = pathname;
  }, [pathname]);

  return (
    <PreviousRouteContext.Provider value={previousPath}>
      {children}
    </PreviousRouteContext.Provider>
  );
};

export const usePreviousRoute = () => useContext(PreviousRouteContext);
