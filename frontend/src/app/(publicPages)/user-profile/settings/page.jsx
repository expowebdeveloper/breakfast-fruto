"use client";
import { callApi, METHODS } from "@/_Api-Handlers/apiFunctions";
import { PROFILE_UPDATE, SETTINGS_ENDPOINT } from "@/_Api-Handlers/APIUrls";
import PageLoader from "@/_components/_common/PageLoader";
import { T } from "@/_utils/LanguageTranslator";
import { successType, toastMessages } from "@/_utils/toastMessage";
import { INSTANCE } from "@/app/_constant/UrlConstant";
import React, { useEffect, useState } from "react";

function Page() {
  const [smsPreferences, setSmsPreferences] = useState({
    recommendations: false,
  });

  const [emailPreferences, setEmailPreferences] = useState({
    recommendations: false,
    newsletter: false,
  });
  const [pageLoader, setPageLoader] = useState(false);

  useEffect(() => {
    fetchUserSettings();
  }, []);

  const fetchUserSettings = () => {
    setPageLoader((prev) => true);
    callApi({
      endPoint: SETTINGS_ENDPOINT,
      method: METHODS.get,
      instanceType: INSTANCE.authorize,
    })
      .then((res) => {
        console.log(res?.data, "profile data");
        setSmsPreferences({
          recommendations: res?.data?.sms_reminders || false,
        });
        setEmailPreferences({
          recommendations: res?.data?.email_reminders || false,
          newsletter: res?.data?.newletter_reminders || false,
        });
      })
      .catch((error) => {
        console.error("Error getting address:", error);
      })
      .finally(() => {
        setPageLoader((prev) => false);
      });
  };

  console.log(smsPreferences, "smsPreferences");

  const handleToggle = (type, preference) => {
    if (type === "sms") {
      setSmsPreferences((prev) => {
        const newPreferences = {
          ...prev,
          [preference]: !prev[preference],
        };

        const payload = {
          sms_reminders: newPreferences?.recommendations,
          email_reminders: emailPreferences?.recommendations,
          newletter_reminders: emailPreferences?.newsletter,
        };

        callApi({
          endPoint: SETTINGS_ENDPOINT,
          method: METHODS.patch,
          instanceType: INSTANCE?.authorize,
          payload: payload,
        })
          .then((res) => {
            toastMessages(T["settings_updated_successfully"], successType);
          })
          .catch((error) => {
            console.error("Error updating profile:", error);
          });

        return newPreferences;
      });
    } else if (type === "email") {
      setEmailPreferences((prev) => {
        const newPreferences = {
          ...prev,
          [preference]: !prev[preference],
        };

        const payload = {
          sms_reminders: smsPreferences?.recommendations,
          email_reminders: newPreferences?.recommendations,
          newletter_reminders: newPreferences?.newsletter,
        };

        callApi({
          endPoint: SETTINGS_ENDPOINT,
          method: METHODS.patch,
          instanceType: INSTANCE?.authorize,
          payload: payload,
        })
          .then((res) => {
            toastMessages(T["settings_updated_successfully"], successType);
          })
          .catch((error) => {
            console.error("Error updating profile:", error);
          });

        return newPreferences;
      });
    }
  };

  return (
    <div className="w-full">
      {pageLoader && <PageLoader />}
      <h2 className="text-2xl font-extrabold text-black mb-6">
        {T["settings"]}
      </h2>

      {/* SMS Preferences */}
      <div className="mb-6">
        <h3 className="text-lg font-extrabold text-black mb-3">
          {T["sms_preferences"]}
        </h3>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="w-full sm:w-3/4">
            <p className="font-semibold text-black text-sm sm:text-base">
              {T["recommendations_reminders"]}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 pr-4">
              {
                T[
                  "keep_this_on_to_receive_offer_recommendations_timely_reminders_based_on_your_interests"
                ]
              }
            </p>
          </div>
          <div
            onClick={() => handleToggle("sms", "recommendations")}
            className={`relative inline-block w-10 sm:w-12 h-5 sm:h-6 rounded-full transition duration-300 ease-in-out cursor-pointer ${
              smsPreferences?.recommendations ? "bg-[#4BAF50]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute left-1 top-1 w-3 sm:w-4 h-3 sm:h-4 rounded-full transition-transform duration-300 ease-in-out ${
                smsPreferences?.recommendations ? "transform translate-x-5 sm:translate-x-6" : ""
              } bg-white`}
            ></span>
          </div>
        </div>
      </div>

      {/* Email Preferences */}
      <div className="mb-6">
        <h3 className="text-lg font-extrabold text-black mb-3">
          {T["email_preferences"]}
        </h3>

        {/* Email Recommendations */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="w-full sm:w-3/4">
            <p className="font-semibold text-black text-sm sm:text-base">
              {T["recommendations_reminders"]}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 pr-4">
              {
                T[
                  "keep_this_on_to_receive_offer_recommendations_timely_reminders_based_on_your_interests"
                ]
              }
            </p>
          </div>
          <div
            onClick={() => handleToggle("email", "recommendations")}
            className={`relative inline-block w-10 sm:w-12 h-5 sm:h-6 rounded-full transition duration-300 ease-in-out cursor-pointer ${
              emailPreferences?.recommendations ? "bg-[#4BAF50]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute left-1 top-1 w-3 sm:w-4 h-3 sm:h-4 rounded-full transition-transform duration-300 ease-in-out ${
                emailPreferences?.recommendations
                  ? "transform translate-x-5 sm:translate-x-6"
                  : ""
              } bg-white`}
            ></span>
          </div>
        </div>

        {/* Email Newsletter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 p-3 sm:p-4 mt-3 sm:mt-4 rounded-lg border border-gray-200">
          <div className="w-full sm:w-3/4">
            <p className="font-semibold text-black text-sm sm:text-base">{T["newsletter"]}</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 pr-4">
              {T["subscribe_to_the_newsletter_for_promotions_offers"]}
            </p>
          </div>
          <div
            onClick={() => handleToggle("email", "newsletter")}
            className={`relative inline-block w-10 sm:w-12 h-5 sm:h-6 rounded-full transition duration-300 ease-in-out cursor-pointer ${
              emailPreferences?.newsletter ? "bg-[#4BAF50]" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute left-1 top-1 w-3 sm:w-4 h-3 sm:h-4 rounded-full transition-transform duration-300 ease-in-out ${
                emailPreferences?.newsletter ? "transform translate-x-5 sm:translate-x-6" : ""
              } bg-white`}
            ></span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default Page;
