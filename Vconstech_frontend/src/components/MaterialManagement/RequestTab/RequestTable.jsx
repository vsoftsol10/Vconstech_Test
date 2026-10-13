import React from "react";
import ViewButton from "./ViewButton";

const RequestTable = ({
  headers,
  filteredRequests,
  loading,
  materialTypeFilter,
  onViewRequest,
}) => {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-4 lg:px-6 py-3 text-left text-xs font-bold text-black uppercase tracking-wide bg-yellow-400 whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-6 py-8 text-center text-gray-500 text-sm"
              >
                Loading...
              </td>
            </tr>
          ) : filteredRequests.length === 0 ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-6 py-8 text-center text-gray-500 text-sm"
              >
                No material requests found
              </td>
            </tr>
          ) : (
            filteredRequests.map((request) => (
              <tr
                key={request.id}
                className="hover:bg-gray-50 transition-colors duration-200"
              >
                <td className="px-4 lg:px-6 py-3 text-gray-700 text-sm font-medium">
                  {request.vendor || request.vendorName || "--"}
                </td>
                <td className="px-4 lg:px-6 py-3 text-gray-700 text-sm font-medium">
                  {request.employee?.name || request.assignedTo || "--"}
                </td>
                {materialTypeFilter === "project" && (
                  <td className="px-4 lg:px-6 py-3 text-gray-700 text-sm font-medium">
                    {request.project?.name || request.projectName || "--"}
                  </td>
                )}
                <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm whitespace-nowrap">
                  {request.dueDate
                    ? new Date(request.dueDate).toLocaleDateString("en-IN")
                    : "--"}
                </td>
                <td className="px-4 lg:px-6 py-3 text-gray-700 text-sm font-medium">
                  {request.name || "--"}
                </td>
                <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm whitespace-nowrap">
                  {request.quantity || "--"}
                </td>
                <td className="px-4 lg:px-6 py-3 text-gray-600 text-sm whitespace-nowrap">
                  {request.unit || "--"}
                </td>
                <td className="px-4 lg:px-6 py-3 text-center w-24">
                  <ViewButton request={request} onView={onViewRequest} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestTable;
