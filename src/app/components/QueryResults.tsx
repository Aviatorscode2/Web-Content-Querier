import React from 'react';

interface QueryResultsProps {
  answer: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any[];
}

const QueryResults: React.FC<QueryResultsProps> = ({ answer, context }) => {
  return (
    <div className="mt-6 space-y-4">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Query Result
        </h2>
        <p className="text-gray-700">{answer}</p>
      </div>

      <details className="bg-gray-50 border border-gray-200 rounded-lg">
        <summary className="px-4 py-2 cursor-pointer text-gray-800 font-medium">
          View Context Sources
        </summary>
        <div className="p-4 space-y-2">
          {context.map((doc, index) => (
            <div
              key={index}
              className="bg-white p-3 rounded-md shadow-sm border border-gray-100"
            >
              <p className="text-sm text-gray-600 line-clamp-2">
                {doc.pageContent}
              </p>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default QueryResults;
