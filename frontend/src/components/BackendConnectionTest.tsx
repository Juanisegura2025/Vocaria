import { useState } from 'react';

interface BackendTestResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
}

export const BackendConnectionTest = () => {
  const [testResult, setTestResult] = useState<BackendTestResult>({ status: 'idle' });

  const testBackendConnection = async () => {
    setTestResult({ status: 'loading' });
    
    try {
      // Test 1: Basic health check
      const healthResponse = await fetch('http://localhost:8002/health');
      
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }
      
      const healthData = await healthResponse.json();
      
      // Test 2: Root endpoint
      const rootResponse = await fetch('http://localhost:8002/');
      const rootData = await rootResponse.json();
      
      setTestResult({
        status: 'success',
        data: {
          health: healthData,
          root: rootData,
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      setTestResult({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  return (
    <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🔗 Backend Connection Test</h3>
      
      <button
        onClick={testBackendConnection}
        disabled={testResult.status === 'loading'}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {testResult.status === 'loading' ? (
          <>
            <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            Testing...
          </>
        ) : (
          '🧪 Test Backend Connection'
        )}
      </button>

      {/* Results Display */}
      {testResult.status === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">✅ Backend Connected Successfully!</h4>
              <div className="mt-2 text-sm text-green-700">
                <p><strong>API Status:</strong> {testResult.data?.health?.status}</p>
                <p><strong>Database:</strong> {testResult.data?.health?.database}</p>
                <p><strong>Models:</strong> {testResult.data?.health?.models}</p>
                <p><strong>API Message:</strong> {testResult.data?.root?.message}</p>
                <p><strong>Version:</strong> {testResult.data?.root?.version}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {testResult.status === 'error' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-red-800">❌ Backend Connection Failed</h4>
              <p className="mt-2 text-sm text-red-700">{testResult.error}</p>
              <div className="mt-2 text-sm text-red-600">
                <p><strong>Common solutions:</strong></p>
                <ul className="list-disc list-inside">
                  <li>Make sure backend is running on port 8002</li>
                  <li>Check if CORS is properly configured</li>
                  <li>Verify the backend URL is correct</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data (for debugging) */}
      {testResult.status === 'success' && testResult.data && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
            🔍 View Raw Response Data
          </summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
            {JSON.stringify(testResult.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};