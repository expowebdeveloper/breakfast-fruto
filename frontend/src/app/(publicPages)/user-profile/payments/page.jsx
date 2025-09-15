"use client"
import React from "react";

function Page() {
    const cards = [
        {
          id: 1,
          type: "Visa",
          number: "XXXX-XXXX-XXXX-1234",
          validity: "02/2029",
          default: true,
          image: "/images/visa.png",
        },
        {
          id: 2,
          type: "Mastercard",
          number: "XXXX-XXXX-XXXX-3214",
          validity: "02/2029",
          default: false,
          image: "/images/master.png",
        },
        {
          id: 3,
          type: "Maestro",
          number: "XXXX-XXXX-XXXX-8765",
          validity: "02/2029",
          default: false,
          image: "/images/maestro.png",
        },
        {
          id: 4,
          type: "American Express",
          number: "XXXX-XXXX-XXXX-4536",
          validity: "02/2029",
          default: false,
          image: "/images/AmericanExpress.png",
        },
      ];
    
      const handleDelete = (id) => {
        console.log(`Delete card with id: ${id}`);
      };
    
      const handleMakeDefault = (id) => {
        console.log(`Make card with id: ${id} default`);
      };
  return (
    <div>
      <div className="w-full">
        <h2 className="text-black font-extrabold mb-6">Payments</h2>
        <h5 className="text-black font-extrabold mb-2">Saved Cards</h5>
        <div className="flex flex-wrap gap-5">
          {cards.map((card) => (
            <div
              key={card.id}
              className="border border-gray-300 rounded-lg p-4 flex flex-col justify-between shadow-sm gap-4 w-[48%]"
            >
              <div className="flex justify-between items-center gap-4">
                <div>
                  <img src={card.image} alt={card.type} className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{card.number}</p>
                  <p className="text-xs text-gray-400">
                    Valid till {card.validity}
                  </p>
                </div>
                <button
                  className="bg-none border-none text-red-500 cursor-pointer"
                  onClick={() => handleDelete(card.id)}
                >
                  DELETE
                </button>
              </div>
              <div>
                {card.default ? (
                  <button className="bg-gray-100 text-black px-5 py-1 rounded-full">
                    Default
                  </button>
                ) : (
                  <button
                    className="text-green-500 underline"
                    onClick={() => !card.default && handleMakeDefault(card.id)}
                  >
                    Make Default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button className="mt-5 px-6 py-2 text-sm text-white bg-orange-500 border-none rounded-md cursor-pointer">
          Add Card
        </button>
      </div>
    </div>
  );
}

export default Page;
