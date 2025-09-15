"use client";
import { usePathname } from "next/navigation";

const Banner = ({ isAbout = false, isContact = false }) => {
  const pathname = usePathname();
  return (
    <div>
      <div className="min-h-[200px] sm:min-h-[300px] md:min-h-[350px] lg:h-[400px] flex flex-col justify-center items-center text-center bg-gradient-to-r from-[#D8FFB0] to-yellow-100 px-4 py-8">
        <h1 className="uppercase font-bebas-neue text-2xl sm:text-3xl md:text-4xl lg:text-[50px] font-bold leading-tight sm:leading-snug md:leading-normal lg:leading-[78px] text-customOrange max-w-[90%] sm:max-w-[80%] md:max-w-[70%]">
          {pathname === "/baskets" && "Smaken av omtanke - i varje fruktkorg"}
          {pathname === "/products" && "Upptäck våra färska och ekologiska frukter"}
          {pathname === "/contact" && "Kontakta oss"}
          {pathname === "/about" && "Om oss"}
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl max-w-[90%] sm:max-w-[80%] md:max-w-[70%]">
          {pathname === "/baskets" && (
            <span className="mt-2 block">
              Färska, ekologiska, Smakfulla fruktkorgar och frukostår som gör varje morgon bättre.
            </span>
          )}

          {pathname === "/products" && (
            <span className="mt-2 block">
              Smakfulla fruktkorgar och frukostar som gör varje morgon bättre.
            </span>
          )}

          {pathname === "/about" && (
            <span className="mt-2 block">
              Så började Frukto – och varför vi älskar det vi gör
            </span>
          )}
        </p>
        {/* add header section data here */}
      </div>
    </div>
  );
};

export default Banner;
