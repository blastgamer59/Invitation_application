import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import InvitationPage from './components/pages/InvitationPage';
import ConfirmationPage from './components/pages/ConfirmationPage';
import { RSVPProvider } from './context/RSVPContext';

function App() {
  return (
    <RSVPProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-blue-50">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<InvitationPage />} />
              <Route path="/confirmation" element={<ConfirmationPage />} />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </RSVPProvider>
  );
}

export default App;
