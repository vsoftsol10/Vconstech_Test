import React from "react";

const ActionCell = ({ request, onAccept, onReject }) => {
  if (request.status === "PENDING") {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(request.id)}
          className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          Accept
        </button>
        <button
          onClick={() => onReject(request.id)}
          className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
        >
          Reject
        </button>
        <button
          onClick={() => onReject(request.id)}
          className="px-3 py-1.5 bg-[#ffbe2a] text-black text-sm font-medium rounded-lg hover:bg-[#e6ab25] transition-colors whitespace-nowrap"
        >
          Command
        </button>
      </div>
    );
  }
  if (request.status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full whitespace-nowrap border border-green-300">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-3.5 h-3.5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
            clipRule="evenodd"
          />
        </svg>
        Accepted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full whitespace-nowrap border border-red-300">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-3.5 h-3.5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
      Rejected
    </span>
  );
};

export default ActionCell;
