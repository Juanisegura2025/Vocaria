import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BackendConnectionTest } from './components/BackendConnectionTest';

// Create a query client
const queryClient = new QueryClient();

// Simple Home component
function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎤 Vocaria Frontend
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Voice-first virtual showing assistant
          </p>
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ✅ Frontend is working!
            </h2>
            <div className="space-y-3 text-left">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>React 18 loaded</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Vite dev server running</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>Tailwind CSS working</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>React Query configured</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✓</span>
                <span>TypeScript compilation successful</span>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Next Steps:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Create authentication components</li>
                <li>• Build admin dashboard</li>
                <li>• Implement widget components</li>
                <li>• Connect to backend API</li>
              </ul>
            </div>
            
            {/* Backend Connection Test Component */}
            <BackendConnectionTest />
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Dashboard component
function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Tours</h2>
            <p className="text-gray-600">Manage your property tours</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Leads</h2>
            <p className="text-gray-600">Track captured leads</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Analytics</h2>
            <p className="text-gray-600">View usage statistics</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;