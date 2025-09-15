"use client";
import React from "react";
import Image from "next/image";
import CommonButton from "../CommonButton";
import { X_Mark } from "@/_Svgs/Svg";
import { createPreview, truncateString } from "@/_utils/helpers";
import { useRouter } from "next/navigation";

const InitialModal = ({ onClose, modalData }) => {
  console.log(modalData, "data inside modal");
  console.log(modalData?.navigation_path, "navigation path");

  const router = useRouter();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white p-8 rounded-xl max-w-[700px] w-full text-center border-2 border-green-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition"
          aria-label="Close"
        >
          {X_Mark}
        </button>

        {/* Headline */}
        <h2 className="text-[24px] sm:text-[28px] font-bold text-green-600 leading-tight">
          {truncateString(modalData?.title, 40)}
        </h2>

        {/* Description */}
        <p
          className="text-gray-700 mt-5 text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: modalData?.description }}
        ></p>

        {/* CTA Button */}
        <div className="mt-6">
          <CommonButton
            text={modalData?.button_text || "View Baskets"}
            onClick={() => {
              router.push(`${modalData?.navigation_path}`);
            }}
            className="bg-green-600 hover:bg-green-700 text-white text-lg font-semibold py-2 px-6 rounded-md"
          />
        </div>

        {/* Images */}
        {modalData?.image ? (
          <div className="mt-8 flex justify-center items-center gap-6 flex-wrap">
            <div className="flex flex-col items-center">
              <Image
                src={createPreview(modalData?.image)}
                alt="Operation Smile Logo"
                width={100}
                height={40}
                className="mt-2"
              />
            </div>
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default InitialModal;
