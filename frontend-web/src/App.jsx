import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AgentLogin from './pages/AgentLogin';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './layout/AdminLayout';
import AgentLayout from './layout/AgentLayout';
import PublicLayout from './layout/PublicLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Fleet from './pages/admin/buses';
import Assignments from './pages/admin/Assignments';
import Network from './pages/admin/Network';
import Tarifs from './pages/admin/Tarifs';
import Audit from './pages/admin/Audit';
import SalesHistory from './pages/admin/SalesHistory';
import PasswordResets from './pages/admin/PasswordResets';
import Guichet from './pages/agent/Guichet';

function App() {
    return (
        <Router>
            <Routes>
                {/* Routes publiques avec Navbar */}
                <Route element={<PublicLayout />}>
                    <Route path="/login" element={<AgentLogin />} />
                    <Route path="/admin-secure-portal" element={<AdminLogin />} />
                </Route>

                <Route element={<ProtectedRoute allowedRole="admin" />}>
                    <Route path="/admin-dashboard" element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="users" element={<Users />} />
                        <Route path="fleet" element={<Fleet />} />
                        <Route path="assignments" element={<Assignments />} />
                        <Route path="network" element={<Network />} />
                        <Route path="tarifs" element={<Tarifs />} />
                        <Route path="audit" element={<Audit />} />
                        <Route path="sales-history" element={<SalesHistory />} />
                        <Route path="password-resets" element={<PasswordResets />} />
                    </Route>
                </Route>

                <Route path="/agent-dashboard" element={<AgentLayout />}>
                    <Route index element={<Guichet />} />
                </Route>


                {/* Redirection par défaut */}
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Fallback */}
                <Route path="*" element={<div className="glass-card"><h1>404</h1><p>Page non trouvée</p></div>} />
            </Routes>
        </Router>
    );
}

export default App;
