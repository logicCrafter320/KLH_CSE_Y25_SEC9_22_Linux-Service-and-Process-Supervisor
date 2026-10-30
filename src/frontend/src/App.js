import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import DashboardPage from './pages/DashboardPage';
import ServicesPage from './pages/ServicesPage';
import ProcessesPage from './pages/ProcessesPage';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#f85149', backgroundColor: '#0d1117', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>Rendering Error:</h2>
          <pre style={{ color: '#c9d1d9', backgroundColor: '#161b22', padding: '20px', borderRadius: '8px' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#58a6ff', color: '#0d1117', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-linux-dark">
            <Navbar />
            <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/processes" element={<ProcessesPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#161b22',
                color: '#c9d1d9',
                border: '1px solid #30363d',
              },
              success: {
                iconTheme: { primary: '#3fb950', secondary: '#161b22' }
              },
              error: {
                iconTheme: { primary: '#f85149', secondary: '#161b22' }
              }
            }}
          />
        </Router>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;