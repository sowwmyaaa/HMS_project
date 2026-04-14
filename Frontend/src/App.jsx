import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import AdminLayout from './layouts/AdminLayout';
import StudentLayout from './layouts/StudentLayout';

// Admin pages
import AdminApplicationDetails from './pages/admin/ApplicationDetails';
import AdminRegistration from './pages/admin/Registration';
import AdminRoomDetails from './pages/admin/RoomDetails';
import AdminRoomAllotment from './pages/admin/RoomAllotment';
import AdminOutingRequests from './pages/admin/OutingRequests';
import AdminOutingReports from './pages/admin/OutingReports';
import AdminMessBill from './pages/admin/MessBill';
import AdminMessMenu from './pages/admin/MessMenu';
import AdminDoctor from './pages/admin/Doctor';
import AdminWorkers from './pages/admin/Workers';
import AdminComplaints from './pages/admin/Complaints';

// Student pages
import StudentApplication from './pages/student/Application';
import StudentRoomDetails from './pages/student/RoomDetails';
import StudentRoomAllotment from './pages/student/RoomAllotment';
import StudentOutingRequest from './pages/student/OutingRequest';
import StudentOutingReports from './pages/student/OutingReports';
import StudentMessBill from './pages/student/MessBill';
import StudentMessMenu from './pages/student/MessMenu';
import StudentDoctor from './pages/student/Doctor';
import StudentComplaints from './pages/student/Complaints';
import StudentChangePassword from './pages/student/ChangePassword';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/application" replace />} />
        <Route path="application" element={<AdminApplicationDetails />} />
        <Route path="registration" element={<AdminRegistration />} />
        <Route path="rooms" element={<AdminRoomDetails />} />
        <Route path="room-allotment" element={<AdminRoomAllotment />} />
        <Route path="outing-requests" element={<AdminOutingRequests />} />
        <Route path="outing-reports" element={<AdminOutingReports />} />
        <Route path="mess-bill" element={<AdminMessBill />} />
        <Route path="mess-menu" element={<AdminMessMenu />} />
        <Route path="doctor" element={<AdminDoctor />} />
        <Route path="workers" element={<AdminWorkers />} />
        <Route path="complaints" element={<AdminComplaints />} />
      </Route>

      <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/student/application" replace />} />
        <Route path="application" element={<StudentApplication />} />
        <Route path="rooms" element={<StudentRoomDetails />} />
        <Route path="room-allotment" element={<StudentRoomAllotment />} />
        <Route path="outing-request" element={<StudentOutingRequest />} />
        <Route path="outing-reports" element={<StudentOutingReports />} />
        <Route path="mess-bill" element={<StudentMessBill />} />
        <Route path="mess-menu" element={<StudentMessMenu />} />
        <Route path="doctor" element={<StudentDoctor />} />
        <Route path="complaints" element={<StudentComplaints />} />
        <Route path="change-password" element={<StudentChangePassword />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
