import React from "react";

const TabSection = ({ activeTab, handleTabChange, tabs }) => {
  return (
    <div className="font-sans p-4">
      <ul className="flex w-max border divide-x rounded-lg overflow-hidden bg-white border-0">
        {tabs.map((tab, i) => (
          <li
            onClick={() => handleTabChange(tab)}
            className={`tab-block ${activeTab === tab ? "active-tab" : ""}`}
            key={i}
          >
            {tab}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TabSection;
