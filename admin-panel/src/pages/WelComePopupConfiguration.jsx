import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import CommonButton from "../Components/Common/CommonButton";
import { successType, toastMessage } from "../utils/toastMessage";
import {
  createPreview,
  createRequiredValidation,
  prefillFormValues,
} from "../utils/helpers";
import CommonTextEditor from "../Form Fields/CommonTextEditor";
import CommonTextField from "../Form Fields/CommonTextField";
import { publishIcon } from "../assets/Icons/Svg";
import { T } from "../utils/languageTranslator";
import ImageUploadSection from "../Form Fields/ImageUploadSection";
import { DEFAULT_ERROR_MESSAGE, PNG_AND_JPG } from "../constant";
import WelcomeModal from "../Components/WelcomeModal";
import { INSTANCE, makeApiRequest, METHODS } from "../api/apiFunctions";
import PageLoader from "../loaders/PageLoader";

const WelComePopupConfiguration = () => {
  const formConfig = useForm();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [btnLoader, setBtnLoader] = useState(false);
  const { register, handleSubmit, watch, setValue } = formConfig;
  const [modalImage, setModalImage] = useState(null);
  const [pageLoader, setPageLoader] = useState(false);
  const [id, setId] = useState(null);

  const watchAll = watch();

  useEffect(() => {
    setPageLoader((prev) => true);
    makeApiRequest({
      endPoint: "/welcome_popup/",
      method: METHODS.get,
      instanceType: INSTANCE?.authorized,
    })
      .then((res) => {
        const data = res?.data?.data;
        console.log(data, "get response");
        if (data?.title) {
          setId(data?.id);
          setIsEdit(true);
          const keysToPrefill = [
            "title",
            "button_text",
            "navigation_path",
            "description",
          ];
          prefillFormValues(data, keysToPrefill, setValue);
          if (data?.image) {
            let preview = createPreview(data?.image);
            const result = { file: null, preview: preview, error: null };
            setModalImage(result);
          }
        }
      })
      .catch((err) => {
        console.log(err, "get modal info error");
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  }, []);

  const onSubmit = (data, event) => {
    const buttonType = event.nativeEvent.submitter.name;
    console.log("Submitted data:", data);
    if (buttonType === "preview") {
      setShowPreviewModal(true);
      return;
    }
    setBtnLoader((prev) => true);
    const payload = {
      title: data?.title,
      description: data?.description,
      button_text: data?.button_text,
      navigation_path: data?.navigation_path?.startsWith("/")
        ? data.navigation_path
        : `/${data.navigation_path}`,
    };
    const formData = new FormData();
    for (let key in payload) {
      if (payload?.[key]) {
        formData.append(key, payload[key]);
      }
    }
    if (modalImage?.file) {
      formData?.append("image", modalImage?.file);
    }
    makeApiRequest({
      endPoint: isEdit ? `/welcome_popup/` : "/welcome_popup/",
      instanceType: INSTANCE.formInstance,
      payload: formData,
      method: isEdit ? METHODS?.put : METHODS?.post,
    })
      .then((res) => {
        toastMessage(
          isEdit
            ? "Configuration updated successfully"
            : "Configuration added successfully",
          successType
        );
      })
      .catch((err) => {
        const error = err?.response?.data;
        toastMessage(error || DEFAULT_ERROR_MESSAGE);
      })
      .finally(() => {
        setBtnLoader((prev) => false);
      });
  };
  console.log(modalImage, "modalImage");

  return (
    <>
      {pageLoader && <PageLoader />}
      <div className="flex mt-4 w-full relative">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex xl:flex-row flex-col"
        >
          <div className="flex gap-4 w-[calc(100%-420px)] main_side">
            <div className="flex-1">
              {/* Title */}
              <div className="product-info-section mb-4">
                <CommonTextField
                  fieldName="title"
                  label="Popup Title *"
                  rules={{
                    ...createRequiredValidation("Title"),
                  }}
                  placeholder="Enter the popup headline (e.g., Welcome to our website!)"
                  formConfig={formConfig}
                  className="px-4 py-2 bg-white w-full text-sm outline-[#333] rounded-lg transition-all"
                />
              </div>

              {/* Description */}
              <div className="description mt-4 p-4 rounded-lg bg-white my-4">
                <CommonTextEditor
                  formConfig={formConfig}
                  label="Popup Description *"
                  fieldName="description"
                  placeholder="Type your message to users..."
                  requiredMessage="Description is required"
                />
              </div>

              {/* Button Text */}
              <div className="product-info-section mb-4">
                <CommonTextField
                  fieldName="button_text"
                  label="Button Text *"
                  rules={{
                    ...createRequiredValidation("Button Text"),
                  }}
                  placeholder="Enter button label (e.g., View Baskets)"
                  formConfig={formConfig}
                  className="px-4 py-2 bg-white w-full text-sm outline-[#333] rounded-lg transition-all"
                />
              </div>

              {/* Navigation Path */}
              <div className="product-info-section mb-4">
                <CommonTextField
                  fieldName="navigation_path"
                  label="Navigation Path *"
                  rules={{
                    ...createRequiredValidation("Navigation Path"),
                  }}
                  placeholder="Enter the URL to navigate on button click (e.g., /home)"
                  formConfig={formConfig}
                  className="px-4 py-2 bg-white w-full text-sm outline-[#333] rounded-lg transition-all"
                />
              </div>

              {/* Image Upload */}
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-3 w-[400px] ms-[20px] right_sidebar">
            <div className="flex flex-col gap-3">
              {/* side section */}
              <div className="flex flex-col w-full">
                <div className="button-section flex justify-center w-full">
                  <CommonButton
                    text={T["preview_modal"]}
                    name="preview"
                    type="submit"
                    className="orange_btn w-full justify-center"
                  />
                  <CommonButton
                    text={T["publish"]}
                    name="publish"
                    type="submit"
                    className="orange_btn w-full justify-center"
                    loader={btnLoader}
                    disabled={btnLoader}
                    icon={publishIcon}
                  />
                </div>
              </div>
              {/* commented for image upload section */}
              <div className="flex gap-4 flex-col">
                <div className="add-feature-image !mt-0">
                  <ImageUploadSection
                    file={modalImage}
                    setFile={setModalImage}
                    label={T["image"]}
                    uniqueId={`featured-image`}
                    accept={PNG_AND_JPG}
                    sizeLimit={5}
                    uploadButton={{
                      text: T["upload_image"],
                      class: "image-upload-icon cursor-pointer",
                    }}
                  />
                </div>{" "}
              </div>
            </div>
          </div>
        </form>
      </div>
      {showPreviewModal && (
        <WelcomeModal
          onClose={() => {
            setShowPreviewModal(false);
          }}
          watch={formConfig?.watch}
          modalImage={modalImage}
        />
      )}
    </>
  );
};

export default WelComePopupConfiguration;
