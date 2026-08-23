import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        جاري التحقق...
      </div>
    );
  }

  // إذا لم يكن مسجلاً أو لم تكن رتبته admin يتم تحويله للداشبورد
  if (!currentUser || userData?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
