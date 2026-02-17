import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./Login";
import { AdminDashboard, ManagerDashboard, DeveloperDashboard, TesterDashboard, DashboardLayout } from "./Dashboard";
import Settings from "./Settings";
import Users from "./Users";
import Projects from "./pages/Projects";
import Bugs from "./pages/Bugs";
import Kanban from "./pages/Kanban";
import "./index.css";
import { useContext } from "react";
import AuthContext from "./context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user, logout } = useContext(AuthContext);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If token exists but user is not yet loaded, show loading with escape hatch
  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <p>Loading user data...</p>
        <button
          onClick={logout}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Cancel / Logout
        </button>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />; // Or unauthorized page
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["DEVELOPER"]}>
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tester/dashboard"
        element={
          <ProtectedRoute allowedRoles={["TESTER"]}>
            <TesterDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DashboardLayout title="User Management">
              <Users />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "DEVELOPER"]}>
            <DashboardLayout title="Projects">
              <Projects />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/bugs"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "DEVELOPER", "TESTER"]}>
            <DashboardLayout title="Project Bugs">
              <Bugs />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bugs"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "DEVELOPER", "TESTER"]}>
            <DashboardLayout title="Bugs">
              <Bugs />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId/kanban"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "DEVELOPER", "TESTER"]}>
            <DashboardLayout title="Project Board">
              <Kanban />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kanban"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "MANAGER", "DEVELOPER", "TESTER"]}>
            <DashboardLayout title="Kanban Board">
              <Kanban />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
