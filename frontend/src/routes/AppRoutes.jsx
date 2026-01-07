import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Tasks from '../pages/Tasks';
import Video from '../pages/Video';
import Companies from '../pages/Companies';
import Sites from '../pages/Sites';
import Missions from '../pages/Missions';
import Robots from '../pages/Robots';
import Users from '../pages/Users';
import History from '../pages/History';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/ProtectedRoute';

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="video" element={<Video />} />
          <Route path="companies" element={<Companies />} />
          <Route path="sites" element={<Sites />} />
          <Route path="missions" element={<Missions />} />
          <Route path="robots" element={<Robots />} />
          <Route path="users" element={<Users />} />
          <Route path="history" element={<History />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRoutes;
