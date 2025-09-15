// FruitBasketCircle.tsx
"use client";

import { useEffect, useState } from "react";
import truncate from "html-truncate";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { createPreview } from "@/_utils/helpers";
import Button from "./_common/Button";
import { T } from "@/_utils/LanguageTranslator";
import { useRouter } from "next/navigation";
import { imagePlaceholder } from "@/_Svgs/Svg";

const radius = 120;

export default function FruitBasketCircle({ basketData }) {
  const router = useRouter();
  const images = basketData.map((b) => {
    return { image: b?.featured_image, id: b?.id };
  });

  const [centerImage, setCenterImage] = useState();
  const [selectedBasket, setSelectedBasket] = useState("");
  const [outerImages, setOuterImages] = useState();
  const [showOuter, setShowOuter] = useState(true);

  useEffect(() => {
    setSelectedBasket(basketData?.[0]);
    setCenterImage(images?.[0]);
    setOuterImages(images.slice(1));
    // setOuterImages([...images, ...images, ...images].slice(1));
  }, [basketData]);

  const handleOuterClick = (img, basketId) => {
    setOuterImages((prev) => [centerImage, ...prev.filter((i) => i !== img)]);
    setCenterImage(img);
    const elem = basketData.find((el) => el.id === basketId);
    if (elem) {
      setSelectedBasket(elem);
    }
  };

  const toggleOuterImages = () => setShowOuter(!showOuter);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8">
        <div className="relative w-[70%] lg:w-[400px] h-[200px] lg:h-[400px] mx-auto mt-6 md:mt-10">
          {/* Center Image */}
          <motion.div
            layout
            className="absolute center-image w-[180px] h-[180px] lg:w-[240px] lg:h-[240px] rounded-full overflow-hidden border-4 border-white shadow-xl z-20 cursor-pointer"
            style={{ transform: "translate(-50%, -50%)" }}
            onClick={toggleOuterImages}
          >
            <Image
              src={
                centerImage?.image
                  ? createPreview(centerImage?.image)
                  : "/images/updated-image-placeholder.png"
              }
              alt="Center"
              fill
              objectFit="cover"
            />
          </motion.div>

          {/* Outer Images */}
          <AnimatePresence>
            {showOuter &&
              outerImages?.length &&
              outerImages.map((img, index) => {
                const angle = (360 / outerImages.length) * index;
                const rad = angle * (Math.PI / 180);
                const x = radius * Math.cos(rad);
                const y = radius * Math.sin(rad);

                return (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, x: 0, y: 0 }}
                    animate={{ opacity: 1, x, y }}
                    exit={{ opacity: 0, x: 0, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute top-1/2 -translate-y-1/2 w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-gray-200 shadow cursor-pointer small-thumbnails"
                    onClick={() => handleOuterClick(img, img.id)}
                  >
                    <Image
                      src={
                        img?.image
                          ? createPreview(img?.image)
                          : "/images/updated-image-placeholder.png"
                      }
                      alt="Outer"
                      fill
                      objectFit="cover"
                    />
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
        <div className="px-4 md:px-10 pt-8 md:pt-0 text-center md:text-left">
          <h6 className="text-[#62A403] text-base sm:text-lg md:text-[19px] font-medium mb-3 md:mb-[15px]">
            {T.basket_price}{" "}
            <span className="text-[#828282]">
              {selectedBasket?.basket_price} SEK
            </span>
          </h6>
          <h4 className="text-[#1E1E1E] text-3xl sm:text-4xl md:text-[50px] font-light leading-tight md:leading-[50px]">
            <b className="font-semibold capitalize">
              {selectedBasket?.basket_name || ""}
            </b>
            <br /> {T.bf_items}
          </h4>
          <p
            className="text-[#828282] text-base sm:text-lg md:text-[18px] font-light mt-3 md:mt-[15px]"
            dangerouslySetInnerHTML={{
              __html: truncate(selectedBasket?.content || "", 200),
            }}
          >
          </p>
          <div className="flex items-center gap-2 md:gap-[10px] mt-6 md:mt-[30px] justify-center md:justify-start">
            <img
              className="w-[18px] md:w-[21px]"
              src="/images/yes-check.png"
              alt="checkImg"
            />
            <h6 className="text-[#525252] text-sm md:text-[15px] font-extrabold">
              {T.natural_products}
            </h6>
          </div>
          <div className="flex items-center gap-2 md:gap-[10px] mt-2 md:mt-[10px] justify-center md:justify-start">
            <img
              className="w-[18px] md:w-[21px]"
              src="/images/yes-check.png"
              alt="checkImg"
            />
            <h6 className="text-[#525252] text-sm md:text-[15px] font-extrabold">
              {T.healthy_food}
            </h6>
          </div>
          <div className="flex justify-center md:justify-start">
            <Button
              btnType="button"
              btnText={T.view_all}
              className="flex gap-2 md:gap-[10px] bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-2 md:p-[10px_30px] rounded-full text-white font-semibold items-center mt-6 md:mt-[30px] text-sm md:text-base"
              btnClick={() => router.push("/products")}
              icon={
                <img
                  className="bg-gradient-to-r from-[#92C64E] to-[#4BAF50] p-[6px] rounded-full w-[22px] h-[22px] md:w-[25px] md:h-[25px]"
                  src="/images/arrow.svg"
                  alt="arrowImg"
                />
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
