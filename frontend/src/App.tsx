import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AzureCallback from './pages/AzureCallback';
import WelcomePage from './pages/WelcomePage';
import CompleteProfilePage from './pages/CompleteProfilePage';
import UserLayout from './components/layout/UserLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AzureCallback />} />
        {/* Authenticated routes */}
        <Route element={<UserLayout />}>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/complete-profile" element={<CompleteProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
