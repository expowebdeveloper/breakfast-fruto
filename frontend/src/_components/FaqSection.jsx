import { useState } from "react";

const faqsList = [
    {
        question: "Vad är Frukto?",
        answer: "Frukto är en fruktkorgstjänst som levererar färsk och ekologisk frukt till både privatpersoner och företag – med flexibla leverans- och prenumerationsalternativ."
    },
    {
        question: "Vem kan använda Frukto?", 
        answer: "Vi levererar till både individer och företagskunder. Frukto passar perfekt till kontoret eller hemmet."
    },
    {
        question: "Har ni något välkomsterbjudande?",
        answer: "Ja! Alla nya kunder får 2 fruktkorgar gratis under sin första vecka."
    },
    {
        question: "Kan jag lägga en återkommande beställning?",
        answer: "Ja! Företag kan teckna en prenumeration med leveranser varje vecka eller månad. Du kan även välja vilka veckodagar du vill ha leverans."
    },
    {
        question: "Hur fungerar prenumerationen?",
        answer: "Du väljer storlek på din fruktkorg, vilka dagar du vill ha leverans, och hur ofta (varje vecka, varannan vecka, eller varje månad). Du kan ändra eller pausa när som helst."
    },
    {
        question: "Är frukten verkligen färsk och ekologisk?",
        answer: "Ja, vi levererar endast färsk, högkvalitativ och ekologisk frukt – utan kompromisser."
    },
    {
        question: "Kan jag anpassa innehållet i fruktkorgen?",
        answer: "Ja, du kan välja att exkludera vissa frukter eller få en säsongsbaserad överraskning."
    },
    {
        question: "Levererar ni till hela Sverige?",
        answer: "Vi levererar för närvarande till utvalda städer. Kontrollera om vi levererar till ditt område på vår hemsida med ditt postnummer."
    },
    {
        question: "Kan jag testa innan jag prenumererar?",
        answer: "Absolut! Du kan beställa en engångsprovkorg eller ta del av vårt erbjudande om 2 gratis korgar första veckan."
    },
    {
        question: "Hur beställer jag?",
        answer: "Gå till www.frukto.se, välj din korg, fyll i leveransinfo – klart!"
    },
    {
        question: "Vad händer om jag vill ändra eller avboka en leverans?",
        answer: "Du kan enkelt hantera dina leveranser via ditt Frukto-konto. Alla ändringar måste göras senast 24 timmar före leverans."
    }
];

const FAQSection = () => {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <section className="bg-[#FDF7F0] py-8 sm:py-12 md:py-16 px-4" id="faq">
            <div className="max-w-[1250px] mx-auto">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-6 sm:mb-8 md:mb-10">Vanliga frågor</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    {faqsList.map((faq, index) => (
                        <div key={index} className="bg-white rounded-[15px] sm:rounded-[20px] md:rounded-[23px] shadow px-4 sm:px-6 md:px-7 py-3 sm:py-4 md:py-5 border border-[#B8B8B8]">
                            <button
                                className="flex justify-between w-full text-left items-center !p-0"
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                            >
                                <span className='font-bold text-base sm:text-lg md:text-[20px] pr-2'>{faq.question}</span>
                                <span className="text-lg sm:text-xl inline-flex justify-center text-center leading-normal flex-none items-center font-bold w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-[8px] sm:rounded-[10px] bg-[#FDC82F]">{openIndex === index ? '−' : '+'}</span>
                            </button>
                            {openIndex === index && (
                                <p className="mt-2 sm:mt-3 md:mt-4 text-xs sm:text-sm text-gray-700">{faq.answer}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default FAQSection