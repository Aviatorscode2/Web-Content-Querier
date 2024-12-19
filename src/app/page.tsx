// app/page.tsx
'use client';

import { useState } from 'react';
import WebContentQuerierForm from './components/WebContentQuerierForm';
import QueryResults from './components/QueryResults';

export default function Home() {
  const [queryResult, setQueryResult] = useState<{
    answer: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async (url: string, query: string) => {
    setIsLoading(true);
    setError(null);
    setQueryResult(null);

    try {
      const response = await fetch('/api/query-web-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch query results');
      }

      const data = await response.json();
      setQueryResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-light-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-6">
                  Web Content Querier
                </h1>

                <WebContentQuerierForm
                  onSubmit={handleQuery}
                  isLoading={isLoading}
                />

                {error && (
                  <div
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                )}

                {queryResult && (
                  <QueryResults
                    answer={queryResult.answer}
                    context={queryResult.context}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
