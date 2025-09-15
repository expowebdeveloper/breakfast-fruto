import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { baseURL, createPreview } from "@/_utils/helpers";

export default function SimpleSlider({ imageUrls }) {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };
  console.log(imageUrls,"imageUrls")

  return (
    <div className="relative max-w-screen-xl mx-auto px-4">
      <Slider {...settings}>
        {imageUrls?.map(
          (img, index) =>
            img && (
              <div key={index} className="w-full">
                <div className=" w-full h-50 transition-transform ">
                  <img
                    src={createPreview(img)}
                    alt={"product_image"}
                    layout="fill"
                    width={500}
                    height={500}
                    className="transition-all duration-100 ease-in-out cart-slider-img"
                  />
                </div>
              </div>
            )
        )}
      </Slider>
    </div>
  );
}
