import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Banners from './pages/Banners';

export default function App() {
  const isAdmin = !!localStorage.getItem('adminKey');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAdmin ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/banners" element={isAdmin ? <Banners /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
