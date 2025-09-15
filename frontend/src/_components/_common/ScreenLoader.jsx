import { SCREEN_LOADER } from "../../../public/images/SvgIcons";

const ScreenLoader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
      {SCREEN_LOADER}
    </div>
  );
};

export default ScreenLoader;
