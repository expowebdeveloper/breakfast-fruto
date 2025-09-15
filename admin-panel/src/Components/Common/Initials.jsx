import React from "react";
import { useProfile } from "../../contexts/ProfileProvider";
import { getInitials } from "../../utils/helpers";

const Initials = () => {
  const { profile } = useProfile();
  const initials = getInitials(profile?.first_name, profile?.last_name);

  console.log(profile, "this is profile");

  return (
    <div className="bg-gray-300 text-black font-bold rounded-full w-10 h-10 flex items-center justify-center">
      {initials}
    </div>
  );
};

export default Initials;
