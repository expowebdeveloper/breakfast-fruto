"use client";

import localFont from "next/font/local";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { persistor, store } from "@/Redux/store";
import { ReduxProvider } from "@/Redux/provider";
import { PersistGate } from "redux-persist/integration/react";
import { PreviousRouteProvider } from "@/contexts/PreviosuRouteProvider";
import CartSidebar from "@/_components/CartSidebar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <ReduxProvider store={store}>
          <PersistGate persistor={persistor}>
            <PreviousRouteProvider>{children}</PreviousRouteProvider>
            <CartSidebar />
          </PersistGate>
        </ReduxProvider>
      </body>
    </html>
  );
}
