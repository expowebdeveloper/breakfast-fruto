"use client";
import { T } from "@/_utils/LanguageTranslator";
import { usePreviousRoute } from "@/contexts/PreviosuRouteProvider";
import React from "react";

const BreadcrumbSection = ({ product_name }) => {
  const previousPath = usePreviousRoute();
  console.log(previousPath, "this is previous path");
  const prevTitle = previousPath ? previousPath.slice(1) : "";

  const items = [
    { label: T["home"], href: "/" },
    ...(prevTitle ? [{ label: prevTitle, href: previousPath }] : []),
    { label: product_name, href: null },
  ];

  return (
    <nav className="ml-2 text-sm flex items-center space-x-1 font-sans px-4">
      {items.map((item, index) => (
        <span key={index} className="flex items-center space-x-1">
          {index !== 0 && <span className="text-gray-400">/</span>}
          {item.href ? (
            <a
              href={item.href}
              className="capitalize text-green-600 hover:underline"
            >
              {item.label}
            </a>
          ) : (
            <span className="capitalize text-gray-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
};

export default BreadcrumbSection;
