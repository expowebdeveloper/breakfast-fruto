import { toast } from "react-toastify";
export const successType = "success";
const defaultDuration = 3000; // 3 seconds

export const toastMessages = (msg, type, time = defaultDuration) => {
  toast.dismiss();
  if (type === successType) {
    toast.success(msg, { autoClose: time });
  } else {
    toast.error(msg, { autoClose: time });
  }
};
