import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import HomePage from './pages/HomePage';
import CreateListingPage from './pages/CreateListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import CategoryManagementPage from './pages/CategoryManagementPage';
import FieldManagementPage from './pages/FieldManagementPage';
import AdminRoute from './components/admin/AdminRoute';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/sell" element={<CreateListingPage />} />
            <Route path="/listing/:id" element={<ProductDetailPage />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><CategoryManagementPage /></AdminRoute>} />
            <Route path="/admin/fields" element={<AdminRoute><FieldManagementPage /></AdminRoute>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
