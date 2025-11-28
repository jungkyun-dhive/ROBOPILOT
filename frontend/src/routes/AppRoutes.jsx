import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Companies from '../pages/Companies';
import Sites from '../pages/Sites';
import Missions from '../pages/Missions';
import Users from '../pages/Users';
import DashboardLayout from '../layouts/DashboardLayout';

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="companies" element={<Companies />} />
          <Route path="sites" element={<Sites />} />
          <Route path="missions" element={<Missions />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default AppRoutes;
