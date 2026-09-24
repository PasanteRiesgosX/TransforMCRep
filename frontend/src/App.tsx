import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth } from './components/auth/RequireAuth';
import { RequireAdmin } from './components/auth/RequireAdmin';
import LoginPage from './pages/LoginPage';
import AzureCallback from './pages/AzureCallback';
import CompleteProfilePage from './pages/CompleteProfilePage';
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';
import AdminQuestionsPage from './pages/admin/AdminQuestionsPage';
import SurveyPage from './pages/survey/SurveyPage';
import SurveyFormPage from './pages/survey/SurveyFormPage';
import ResultsPage from './pages/survey/ResultsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AzureCallback />} />
          
          {/* Authenticated routes */}
          <Route element={<RequireAuth />}>
            <Route element={<UserLayout />}>
              <Route path="/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/survey" element={<SurveyPage />} />
              <Route path="/survey/form" element={<SurveyFormPage />} />
              <Route path="/results" element={<ResultsPage />} />
            </Route>

            {/* Admin routes */}
            <Route element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/questions" element={<AdminQuestionsPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
