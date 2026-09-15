import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AzureCallback from './pages/AzureCallback';
import VerifyCodePage from './pages/VerifyCodePage';
import WelcomePage from './pages/WelcomePage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AzureCallback />} />
        <Route path="/verify-code" element={<VerifyCodePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/dashboard" element={<WelcomePage />} />
        <Route path="/profile" element={<DashboardPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
