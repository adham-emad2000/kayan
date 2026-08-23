import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";

// صفحات المصادقة (Auth)
import RegisterStudent from "./pages/auth/RegisterStudent";
import RegisterTeacher from "./pages/auth/RegisterTeacher";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";

// صفحات الطلاب
import Dashboard from "./pages/student/Dashboard";
import CourseDetails from "./pages/student/CourseDetails";
import CourseCheckout from "./pages/student/CourseCheckout";
import CoursePlayer from "./pages/student/CoursePlayer";
import Profile from "./pages/student/Profile";

// صفحات المعلمين
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherPending from "./pages/teacher/TeacherPending"; // 👈 استيراد صفحة الانتظار ودفع الاشتراك
import AddCourse from "./pages/teacher/AddCourse";
import EditCourse from "./pages/teacher/EditCourse";
import TeacherCourses from "./pages/teacher/TeacherCourses";
import TeacherStudents from "./pages/teacher/TeacherStudents";
import TeacherEarnings from "./pages/teacher/TeacherEarnings";
import TeacherCourseStudents from "./pages/teacher/Teachercoursestudents";

// صفحات الأدمن
import AdminRequests from "./pages/admin/AdminRequests";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";

// الصفحات العامة والـ Layout
import Layout from "./components/layout/Layout";
import Courses from "./pages/general/Courses";
import Teachers from "./pages/general/Teachers";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { useAuth } from "./context/AuthContext";

// أقسام الصفحة الرئيسية
import Hero from "./components/frontpage/Hero";
import Features from "./components/frontpage/Features";
import Instructors from "./components/frontpage/Instructors";
import CTA from "./components/frontpage/CTA";

// حارس المسارات المحمية الموحد
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-blue-600 bg-slate-50">
        جاري التحقق من الصلاحيات...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // 👈 إذا كان المدرس غير معتمد ومسجل دخول، يتم توجيهه لصفحة الدفع والانتظار حصرياً
  if (userData?.role === "teacher" && userData?.isApproved === false) {
    if (window.location.pathname !== "/teacher/pending") {
      return <Navigate to="/teacher/pending" replace />;
    }
  }

  if (allowedRoles && !allowedRoles.includes(userData?.role)) {
    if (userData?.role === "teacher")
      return <Navigate to="/teacher/dashboard" replace />;
    if (userData?.role === "admin")
      return <Navigate to="/admin/requests" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// حارس الصفحات العامة للزوار فقط
const PublicRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-blue-600 bg-slate-50">
        جاري التحقق...
      </div>
    );
  }

  if (currentUser) {
    if (userData?.role === "teacher") {
      return userData?.isApproved === false ? (
        <Navigate to="/teacher/pending" replace />
      ) : (
        <Navigate to="/teacher/dashboard" replace />
      );
    }
    if (userData?.role === "admin")
      return <Navigate to="/admin/requests" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const Home = () => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-blue-600 bg-slate-50">
        جاري التحميل...
      </div>
    );
  }

  if (currentUser) {
    if (userData?.role === "teacher") {
      return userData?.isApproved === false ? (
        <Navigate to="/teacher/pending" replace />
      ) : (
        <Navigate to="/teacher/dashboard" replace />
      );
    }
    if (userData?.role === "admin")
      return <Navigate to="/admin/requests" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden" dir="rtl">
      <Hero />
      <Features />
      <Instructors />
      <CTA />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/course/:id" element={<CourseDetails />} />

          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* مسارات الطلاب المحمية */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/:id"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <CourseCheckout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player/:id"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <CoursePlayer />
              </ProtectedRoute>
            }
          />

          {/* مسارات المعلمين */}
          <Route
            path="/teacher/pending"
            element={
              <ProtectedRoute allowedRoles={["teacher"]}>
                <TeacherPending />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/add-course"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <AddCourse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/edit-course/:id"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <EditCourse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/courses"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <TeacherCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <TeacherStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/earnings"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <TeacherEarnings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/course/:id/students"
            element={
              <ProtectedRoute allowedRoles={["teacher", "admin"]}>
                <TeacherCourseStudents />
              </ProtectedRoute>
            }
          />

          {/* مسارات الأدمن الحصرية */}
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminWithdrawals />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterStudent />
            </PublicRoute>
          }
        />
        <Route
          path="/register-teacher"
          element={
            <PublicRoute>
              <RegisterTeacher />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
