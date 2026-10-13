import React from "react";

const RequestCardView = ({
  filteredRequests,
  loading,
  materialTypeFilter,
  onViewRequest,
  onAccept,
  onReject,
}) => {
  return (
    <div className="lg:hidden divide-y divide-gray-100">
      {loading ? (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          Loading...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          No material requests found
        </div>
      ) : (
        filteredRequests.map((request) => (
          <div key={request.id} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm sm:text-base">
                  {request.employee?.name || request.assignedTo || "--"}
                </div>
                <div className="text-gray-500 text-sm mt-0.5">
                  Vendor: {request.vendor || request.vendorName || "--"}
                </div>
                {materialTypeFilter === "project" && (
                  <div className="text-gray-500 text-sm">
                    Project:{" "}
                    {request.project?.name || request.projectName || "--"}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Request:</span>
                <span className="text-gray-900 font-medium">
                  {request.name || "--"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity:</span>
                <span className="text-gray-900 font-medium">
                  {request.quantity || "--"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Unit:</span>
                <span className="text-gray-900 font-medium">
                  {request.unit || "--"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date:</span>
                <span className="text-gray-900 font-medium">
                  {request.dueDate
                    ? new Date(request.dueDate).toLocaleDateString("en-IN")
                    : "--"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              {request.status === "PENDING" && (
                <>
                  <button
                    onClick={() => onAccept(request.id)}
                    className="flex-1 px-3 py-2 bg-yellow-400 text-black text-sm font-semibold rounded-xl shadow-sm hover:bg-yellow-500 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => onReject(request.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => onViewRequest(request)}
                className={`${
                  request.status === "PENDING" ? "px-4" : "flex-1"
                } py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors`}
              >
                View
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default RequestCardView;
