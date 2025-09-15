import React, { useEffect, useState } from "react";
import PageLoader from "../loaders/PageLoader";
import CommonTextField from "../Form Fields/CommonTextField";
import CommonSelect from "../Form Fields/CommonSelect";
import { T } from "../utils/languageTranslator";
import BackButton from "../Components/Common/BackButton";
import {
  createPreview,
  createRequiredValidation,
  extractIdsFromProducts,
  formatDate,
  prefillFormValues,
} from "../utils/helpers";
import { SPECIAL_CHARACTERS_REGEX } from "../regex/regex";
import { useForm } from "react-hook-form";
import CommonTextEditor from "../Form Fields/CommonTextEditor";
import Checkbox from "../Form Fields/Checkbox";
import CheckboxGroup from "../Form Fields/CheckboxGroup";
import CommonDateField from "../Form Fields/CommonDateField";
import {
  allowedImageTypes,
  DEFAULT_ERROR_MESSAGE,
  PNG_AND_JPG,
  today,
  YYYY_MM_DD,
} from "../constant";
import MultipleImageUploadField from "../Form Fields/MultipleImageUploadField";
import ImageUploadSection from "../Form Fields/ImageUploadSection";
import CommonButton from "../Components/Common/CommonButton";
import { draftIcon, publishIcon } from "../assets/Icons/Svg";
import { INSTANCE, makeApiRequest, METHODS } from "../api/apiFunctions";
import { BASKET_ENDPOINT } from "../api/endpoints";
import { useLocation, useNavigate } from "react-router-dom";
import { successType, toastMessage } from "../utils/toastMessage";
import AddEligibleProduct from "../Components/AddEligibleProduct";
import SelectedProducts from "../Components/SelectedProducts";

const AddEditBasket = () => {
  const formConfig = useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const editId = location?.state?.id;
  const { watch, handleSubmit } = formConfig;
  const [pageLoader, setPageLoader] = useState();
  const [showProductSection, setShowProductSection] = useState(false);
  const [btnLoaders, setBtnLoaders] = useState({
    publish: false,
    draft: false,
  });
  const [featuredImage, setFeaturedImage] = useState();
  const [basketImages, setBasketImages] = useState([]);
  const [basketImageError, setBasketImageError] = useState();
  const [selectedProducts, setSelectedProducts] = useState([]);
  useEffect(() => {
    if (editId) {
      setPageLoader(true);
      makeApiRequest({
        endPoint: `${BASKET_ENDPOINT}${editId}`,
        method: METHODS.get,
      })
        .then((res) => {
          const data = res?.data;
          console.log(data, "this is data useffect data");
          const prefillKeys = [
            "content",
            "basket_name",
            "basket_price",
            "is_active_sale",
            "space_left",
            "offer_price",
            "is_customizable",
          ];
          prefillFormValues(res?.data, prefillKeys, formConfig.setValue);
          if (data?.start_sale) {
            formConfig.setValue(
              "start_sale",
              formatDate(data?.start_sale, YYYY_MM_DD)
            );
          }
          if (data?.end_sale) {
            formConfig.setValue(
              "end_sale",
              formatDate(data?.end_sale, YYYY_MM_DD)
            );
          }
          // commented for removing image uploa section
          if (data?.featured_image) {
            let preview = createPreview(data?.featured_image);
            const result = { file: null, preview: preview, error: null };
            setFeaturedImage(result);
          }
          if (data?.basket_images?.length) {
            let result = [];
            const basket_images = data?.basket_images;
            basket_images?.forEach((img) => {
              const preview = createPreview(img);
              const item = { preview: preview, error: null, file: null };
              result.push(item);
            });
            setBasketImages(result);
          }
          console.log(data?.products_detail, "useEffect");
          if (data?.products_detail?.length) {
            formConfig.setValue("eligible_products", data?.products_detail);
            setSelectedProducts(data?.products_detail);
          } else {
            formConfig.setValue("eligible_products", []);
            setSelectedProducts([]);
          }
        })
        .catch((err) => {})
        .finally(() => {
          setPageLoader(false);
        });
    }
  }, [editId]);
  console.log(selectedProducts, "selected products");
  useEffect(() => {
    if (!watch("is_active_sale")) {
      formConfig.setValue("offer_price", "");
      formConfig.setValue("start_sale", "");
      formConfig.setValue("end_sale", "");
    }
  }, [watch("is_active_sale")]);
  console.log(watch("is_customizable"), "start sale");
  const beforeSubmit = (e) => {
    e.preventDefault();
    handleSubmit((values, event) => {
      onSubmit(values, event);
    })(e);
  };

  const onSubmit = (values, event) => {
    const buttonType = event.nativeEvent.submitter.name;
    setBtnLoaders({ ...btnLoaders, [buttonType]: true });
    const payload = {
      is_active: buttonType === "publish",
      basket_name: values?.basket_name || "",
      basket_price: +values?.basket_price || null,
      start_sale: values?.start_sale || null,
      end_sale: values?.end_sale || null,
      offer_price: +values?.offer_price || null,
      is_active_sale: values?.is_active_sale || null,
      content: values?.content || "",
      space_left: +values?.space_left || null,
      is_customizable: values?.is_customizable,
      products: values?.eligible_products?.length
        ? extractIdsFromProducts(values?.eligible_products)
        : [],
    };
    console.log(payload, "this is payload");

    const formData = new FormData();
    for (let key in payload) {
      if (key === "products" || key === "offer") {
        formData.append(key, JSON.stringify(payload[key])); // Always convert products to JSON
      } else if (key === "is_active" || key === "is_customizable") {
        formData.append(key, payload[key]);
      } else if (payload[key]) {
        formData.append(key, payload[key]);
      }
    }

    // commented for removing image uploa section

    if (featuredImage?.file) {
      formData.append("featured_image", featuredImage.file);
    } else if (!featuredImage?.preview && !featuredImage?.file) {
      formData.append("featured_image", "");
    }

    basketImages?.forEach((productImage) => {
      if (productImage?.file) {
        formData.append("basket_images", productImage.file);
      }
    });

    console.log(payload, "this is payload");
    const data = Object.fromEntries(formData.entries()); // Convert to object
    console.log(data, "this is data");

    makeApiRequest({
      endPoint: BASKET_ENDPOINT,
      method: editId ? METHODS.patch : METHODS.post,
      payload: formData,
      instanceType: INSTANCE.formInstance,
      update_id: editId,
    })
      .then((res) => {
        toastMessage(
          `${T["basket"]} ${editId ? "Updated" : "Created"} ${
            T["successfully"]
          }`,
          successType
        );
        setBtnLoaders({ publish: false, draft: false });
        navigate("/baskets");
      })
      .catch((err) => {
        console.log(err, "product err");
        const error =
          err?.response?.data?.name ||
          err?.response?.data?.sku ||
          err?.response?.data?.[0] ||
          err?.response?.data?.basket_name?.[0];
        toastMessage(error || DEFAULT_ERROR_MESSAGE);
        setBtnLoaders({ publish: false, draft: false });
      })
      .finally(() => {
        setBtnLoaders({ ...btnLoaders, [buttonType]: false });
      });
  };

  const handleProductSubmit = () => {
    formConfig.setValue("eligible_products", selectedProducts);
  };
  console.log(selectedProducts, "selected prodcuts");
  const handleShowProductSection = () => {
    setSelectedProducts(
      watch("eligible_products")?.length ? watch("eligible_products") : []
    );
    setShowProductSection(true);
  };
  return (
    <>
      {pageLoader ? (
        <PageLoader />
      ) : (
        <>
          <BackButton prevRoute={"/baskets"} />
          <div className="flex mt-4 w-full relative">
            <form
              onSubmit={beforeSubmit}
              className="w-full flex xl:flex-row flex-col"
            >
              <div className="flex gap-4 w-[calc(100%-420px)] main_side">
                <div className="flex-1">
                  <div className="product-info-section mb-4">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <CommonTextField
                          fieldName="basket_name"
                          label={`${T["basket_name"]} *`}
                          rules={{
                            ...createRequiredValidation(T["basket_name"]),
                            pattern: {
                              value: SPECIAL_CHARACTERS_REGEX,
                              message: T["special_characters_are_not_allowed"],
                            },
                          }}
                          placeholder={T["enter_basket_name"]}
                          formConfig={formConfig}
                          className="px-4 py-2 bg-white w-full text-sm outline-[#333] rounded-lg transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <CommonTextField
                          fieldName="basket_price"
                          label={`${T["basket_price"]} *`}
                          rules={{
                            ...createRequiredValidation(T["basket_price"]),
                          }}
                          isDecimal={true}
                          placeholder={T["enter_basket_price"]}
                          formConfig={formConfig}
                          className="px-4 py-2 bg-white w-full text-sm outline-[#333] rounded-lg transition-all"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      checked={watch("is_active_sale")}
                      id="offer_price"
                      {...formConfig?.register("is_active_sale")}
                      className={`w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300 mr-2`}
                    />
                    <label className={` text-gray-700 text-sm mr-2`}>
                      {T["add_offer_price"]}
                    </label>
                  </div>
                  {watch("is_active_sale") ? (
                    <div className="flex items-center mt-4 gap-2">
                      <CommonTextField
                        label={`${T["offer_price"]} *`}
                        fieldName="offer_price"
                        formConfig={formConfig}
                        rules={{
                          ...createRequiredValidation(T["offer_price"]),
                        }}
                        isDecimal={true}
                        placeholder={T["enter_offer_price"]}
                        className="px-4 py-2 bg-white w-full text-sm outline-[#333] rounded-lg transition-all"
                      />
                      <CommonDateField
                        label={`${T["start_offer"]} *`}
                        className="px-4 py-2 bg-white w-full text-sm outline-[#333] rounded-lg transition-all"
                        labelClassName="label_custom"
                        minDate={today}
                        fieldName="start_sale"
                        rules={createRequiredValidation(T["start_offer"])}
                        formConfig={formConfig}
                      />
                      <CommonDateField
                        label={` ${T["end_offer"]} *`}
                        formConfig={formConfig}
                        fieldName="end_sale"
                        className="px-4 py-2 bg-white w-full text-sm outline-[#333] rounded-lg transition-all"
                        minDate={watch("start_sale")}
                        labelClassName="label_custom"
                        rules={{
                          ...createRequiredValidation(T["end_offer"]),
                          validate: (value) =>
                            value >= watch("start_sale") ||
                            T[
                              "end_sale_must_be_greater_than_or_equal_to_start_date"
                            ],
                        }}
                      />
                    </div>
                  ) : (
                    ""
                  )}
                  <div className="description mt-4 p-4 rounded-lg bg-white my-4">
                    <CommonTextEditor
                      formConfig={formConfig}
                      label={`${T["description"]} `}
                      fieldName="content"
                      placeholder={`${T["type"]}...`}
                      // rules={} // for this required validation cannot be passed through rules because it has some different way to handle required validation
                      requiredMessage={T["description_is_required"]} // if this prop is not passed required validation is not applied
                    />
                  </div>
                  <div className=" mt-4 p-4 rounded-lg bg-white my-4">
                    <h5 className="text-black font-medium">
                      {T["basket_configuration"]}
                    </h5>
                    <CommonTextField
                      fieldName="space_left"
                      label={`${T["enter_available_space_in_basket"]} *`}
                      placeholder={T["enter_available_space_in_basket"]}
                      formConfig={formConfig}
                      isNumberOnly={true}
                      rules={{
                        ...createRequiredValidation(
                          T["available_space_in_basket"]
                        ),
                      }}
                    />
                    {watch("space_left") ? (
                      watch("eligible_products")?.length ? (
                        <div
                          className="mt-4"
                          onClick={handleShowProductSection}
                        >
                          <SelectedProducts
                            selectedProducts={watch("eligible_products")}
                            onRemove={() => {}}
                            formConfig={formConfig}
                          />
                        </div>
                      ) : (
                        <input
                          className="cursor-pointer px-4 py-3 bg-gray-100 w-full text-sm rounded-sm transition-all duration-200 text-opacity-40 mt-4"
                          onClick={handleShowProductSection}
                          placeholder={T["select_eligible_products"]}
                        />
                      )
                    ) : (
                      ""
                    )}

                    {/* {T["select_eligible_products"]} */}
                    {/* </input> */}
                  </div>
                  <div className="flex items-center mt-4">
                    <input
                      type="checkbox"
                      id="is_customizable"
                      checked={watch("is_customizable")}
                      {...formConfig?.register("is_customizable")}
                      className=" justify-center w-4 h-4 text-blue-600 focus:ring-blue-500 rounded border-gray-300 mr-2"
                    />
                    <label
                      htmlFor="is_customizable"
                      className="text-gray-700 text-sm cursor-pointer"
                    >
                      {T["make_this_basket_customizable"]}
                    </label>
                  </div>
                  {/* is customizable section */}
                </div>
                {/* is customizable section */}
              </div>

              <div className="flex flex-col gap-4 mt-3 w-[400px] ms-[20px] right_sidebar">
                <div className="flex flex-col gap-3">
                  {/* side section */}
                  <div className="flex flex-col w-full">
                    <div className="button-section flex justify-center w-full">
                      <CommonButton
                        text={T["draft"]}
                        name="draft"
                        type="submit"
                        className="orange_btn w-full justify-center"
                        icon={draftIcon}
                        loader={btnLoaders?.draft}
                        disabled={btnLoaders?.publish || btnLoaders?.draft}
                      />
                      <CommonButton
                        text={T["publish"]}
                        name="publish"
                        type="submit"
                        className="orange_btn w-full justify-center"
                        loader={btnLoaders?.publish}
                        disabled={btnLoaders?.publish || btnLoaders?.draft}
                        icon={publishIcon}
                      />
                    </div>
                  </div>
                  {/* commented for image upload section */}
                  <div className="flex gap-4 flex-col">
                    <div className="add-feature-image !mt-0">
                      <ImageUploadSection
                        file={featuredImage}
                        setFile={setFeaturedImage}
                        label={T["featured_image"]}
                        uniqueId={`featured-image`}
                        accept={PNG_AND_JPG}
                        sizeLimit={5}
                        uploadButton={{
                          text: T["upload_featured_image"],
                          class: "image-upload-icon cursor-pointer",
                        }}
                      />
                    </div>{" "}
                    <MultipleImageUploadField
                      files={basketImages}
                      setFiles={setBasketImages}
                      label={T["add_images"]}
                      allowedTypes={allowedImageTypes}
                      imageError={basketImageError}
                      setImageError={setBasketImageError}
                      uniqueId={`basket-image`}
                      accept={PNG_AND_JPG}
                      uploadButton={{
                        text: T["upload_image"],
                        class: "image-upload-icon cursor-pointer",
                      }}
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
      {showProductSection && (
        <AddEligibleProduct
          onClose={() => setShowProductSection(false)}
          onSelect={() => setShowProductSection(false)}
          formConfig={formConfig}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          currentAvailableSpace={watch("space_left")}
          handleProductSubmit={handleProductSubmit}
        />
      )}
    </>
  );
};

export default AddEditBasket;
