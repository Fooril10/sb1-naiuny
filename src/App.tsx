import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/layout/Navigation';
import { CalendarView } from './pages/CalendarView';
import { ProjectsView } from './pages/ProjectsView';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/projects" element={<ProjectsView />} />
            <Route path="/" element={<Navigate to="/calendar" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;