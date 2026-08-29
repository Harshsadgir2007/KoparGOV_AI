import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CivicProvider } from './context/CivicContext';

// Layouts
import { OfficerLayout } from './components/common/OfficerLayout';
import { CitizenLayout } from './components/citizen/CitizenLayout';

// Officer Pages
import { DashboardPage } from './pages/officer/DashboardPage';
import { IssuesPage } from './pages/officer/IssuesPage';
import { IssueDetailPage } from './pages/officer/IssueDetailPage';
import { RecommendationPage } from './pages/officer/RecommendationPage';
import { AssignmentsPage } from './pages/officer/AssignmentsPage';
import { AssignmentDetailPage } from './pages/officer/AssignmentDetailPage';
import { MapPage } from './pages/officer/MapPage';
import { AnalyticsPage } from './pages/officer/AnalyticsPage';
import { ScenarioSimulationPage } from './pages/officer/ScenarioSimulationPage';

// Citizen Pages
import { CitizenLandingPage } from './pages/citizen/CitizenLandingPage';
import { CitizenReportPage } from './pages/citizen/CitizenReportPage';
import { CitizenIssuesPage } from './pages/citizen/CitizenIssuesPage';
import { CitizenTrackingPage } from './pages/citizen/CitizenTrackingPage';
import { CitizenLeaderboardPage } from './pages/citizen/CitizenLeaderboardPage';
import { CitizenProfilePage } from './pages/citizen/CitizenProfilePage';

// Auth Page
import { LoginPage } from './pages/auth/LoginPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CivicProvider>
            <Routes>
              {/* Root redirect to Officer Dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Officer Portal Routes */}
              <Route element={<OfficerLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/issues" element={<IssuesPage />} />
                <Route path="/issues/:id" element={<IssueDetailPage />} />
                <Route path="/recommendations" element={<RecommendationPage />} />
                <Route path="/recommendations/:id" element={<RecommendationPage />} />
                <Route path="/scenario" element={<ScenarioSimulationPage />} />
                <Route path="/assignments" element={<AssignmentsPage />} />
                <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>

              {/* Citizen Portal Routes */}
              <Route path="/citizen" element={<CitizenLayout />}>
                <Route index element={<CitizenLandingPage />} />
                <Route path="report" element={<CitizenReportPage />} />
                <Route path="issues" element={<CitizenIssuesPage />} />
                <Route path="issues/:id" element={<CitizenTrackingPage />} />
                <Route path="tracking" element={<CitizenTrackingPage />} />
                <Route path="tracking/:id" element={<CitizenTrackingPage />} />
                <Route path="leaderboard" element={<CitizenLeaderboardPage />} />
                <Route path="profile" element={<CitizenProfilePage />} />
              </Route>

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </CivicProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
