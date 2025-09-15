"use client";
import { T } from "@/_utils/LanguageTranslator";
import Button from "./_common/Button";

export default function Sidebar({
  sideBarOptions,
  selectedCategory,
  handleSideBar,
  handleLoadMore,
  handleAllCategories,
  buttonLoader,
  totalCategories,
}) {
  return (
    <aside className="w-[15rem] bg-[#ffffff] text-center rounded-lg mob-product-category flex-none shadow-[0_0_#0000,_0_0.1px_0.2px_#0000001a,_0_0.9px_1.9px_#0000001d,_0_5.1px_10.9px_#00000020]">
      <ul className="space-y-2 text-black">
        <li
          className={
            selectedCategory === "All"
              ? "bg-[#DFFFDC] text-left py-[10px] pl-[40px] text-[16px] font-medium"
              : "hover:text-green-600 cursor-pointer text-left py-[10px] pl-[40px] text-[16px] font-medium !mt-0"
          }
          onClick={() => handleSideBar("All")}
        >
          Alla
        </li>

        {sideBarOptions?.length > 0 ? (
          <>
            {sideBarOptions.map((category) => (
              <li
                key={category.id}
                className={
                  selectedCategory === category?.name
                    ? "bg-[#DFFFDC] text-left py-[10px] pl-[40px] text-[16px] font-medium capitalize"
                    : "hover:text-green-600 cursor-pointer text-left py-[10px] pl-[40px] text-[16px] font-medium !mt-0 capitalize"
                }
                onClick={() => handleSideBar(category)}
              >
                {category?.name || "-"}
              </li>
            ))}

            {sideBarOptions?.length < totalCategories && (
              <Button
                className="w-full text-green-600 font-medium py-2 hover:underline"
                btnClick={handleLoadMore}
                disabled={buttonLoader}
                btnLoader={buttonLoader}
                btnText={T["load_more"]}
              />
            )}
          </>
        ) : (
          <p className="text-gray-500 text-center py-4">
            {T["no_categories_available"]}
          </p>
        )}
      </ul>
    </aside>
  );
}
