import React from "react";

const ViewButton = ({ request, onView }) => (
  <button
    onClick={() => onView(request)}
    className="px-4 py-1.5 bg-[#ffbe2a] text-black text-sm font-semibold rounded-lg hover:bg-[#e6ab25] transition-colors whitespace-nowrap"
  >
    View
  </button>
);

export default ViewButton;
