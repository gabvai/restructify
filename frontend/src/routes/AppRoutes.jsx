import { Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "../layouts/MainLayout.jsx";
import CreateBeamPage from "../pages/CreateBeamPage.jsx";
import EducationPage from "../pages/EducationPage.jsx";
import HomePage from "../pages/HomePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import MyListingsPage from "../pages/MyListingsPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";
import AiAnalyzePage from "../pages/AiAnalyzePage.jsx";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/education" element={<EducationPage />} />
        <Route path="/beams" element={<MyListingsPage />} />
        <Route path="/beams/new" element={<CreateBeamPage />} />
        <Route path="/ai/analyze" element={<AiAnalyzePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
