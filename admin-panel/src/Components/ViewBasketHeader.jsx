import { backArrow, editIcon, imagePlaceholder } from "../assets/Icons/Svg";
import { createPreview } from "../utils/helpers";
import CommonButton from "./Common/CommonButton";
import { useNavigate } from "react-router-dom";
const ViewBasketHeader = ({
  title,
  prevRoute = "baskets",
  image = "",
  basketId = "",
}) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 bg-white p-4 ">
      {/* Back Button */}
      <button className="p-2 basket-arrow">
        <CommonButton
          text=""
          className="p-2 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center transition-all duration-300"
          type="button"
          onClick={() => navigate(prevRoute)}
          icon={backArrow}
        />
      </button>

      {/* Basket Image */}
      {/* commented for removing basket image section */}
      <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-300">
        {image ? (
          <img
            src={createPreview(image)}
            alt={title || "basket image"}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="basket-imagePlaceholder">{imagePlaceholder}</div>
        )}
      </div>

      {/* Basket Name */}
      <h2 className="text-xl font-bold text-black flex-1 capitalize">
        {title || "-"}
      </h2>

      {/* Edit Icon */}
      <button
        className="p-2 rounded-full hover:bg-gray-100 basket-edit"
        onClick={() =>
          navigate("/add-edit-basket", { state: { id: basketId } })
        }
      >
        {editIcon}
      </button>
    </div>
  );
};

export default ViewBasketHeader;
