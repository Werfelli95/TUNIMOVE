import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole }) => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // 1. Si aucun token n'est trouvé, on redirige vers la page de login admin
    if (!token) {
        return <Navigate to="/admin-secure-portal" replace />;
    }

    // 2. Si un rôle spécifique est requis et que l'utilisateur ne l'a pas
    if (allowedRole && role !== allowedRole) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si tout est bon, on affiche les composants enfants (le dashboard)
    return <Outlet />;
};

export default ProtectedRoute;
