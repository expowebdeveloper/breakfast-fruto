import { T } from "@/_utils/LanguageTranslator";
import React from "react";
import Slider from "react-slick";
import ItemSubCategory from "./ItemSubCategory";
import { categorySettings } from "@/_constants/constant";

const SubcategorySection = ({ subcategories, handleItemCategory }) => {
  return (
    <div>
      {!subcategories?.length ? (
        // <p>{T["no_categories_available"]}</p>
        ""
      ) : subcategories?.length < 5 ? (
        subcategories?.map((cat) => (
          <ItemSubCategory
            key={cat.id}
            subCategory={cat}
            handleClick={handleItemCategory}
          />
        ))
      ) : (
        <Slider {...categorySettings}>
          {subcategories?.map((cat) => (
            <ItemSubCategory
              key={cat.id}
              subCategory={cat}
              handleClick={handleItemCategory}
            />
          ))}
        </Slider>
      )}
    </div>
  );
};

export default SubcategorySection;
