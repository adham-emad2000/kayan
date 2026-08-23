import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import logo from "../../utils/kayan.png";

import {
  Menu,
  X,
  BookOpen,
  Home,
  Users,
  ChevronDown,
  LogOut,
  User,
  ShieldCheck,
  GraduationCap,
  LayoutDashboard,
  Wallet,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const getHomeRoute = () => {
    if (!currentUser) return "/";
    if (userData?.role === "teacher") return "/teacher/dashboard";
    if (userData?.role === "admin") return "/admin/requests";
    return "/dashboard";
  };

  const homeRoute = getHomeRoute();

  const navLinks = [
    { to: homeRoute, label: "الرئيسية", icon: Home },
    { to: "/courses", label: "الكورسات", icon: BookOpen },
    { to: "/teachers", label: "المدرسين", icon: Users },
  ];

  const teacherEarnings = userData?.totalEarnings || 0;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuOpen(false);
      setIsOpen(false);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const userAvatar = userData?.photoURL || currentUser?.photoURL;
  const userInitial = userData?.fullName ? userData.fullName.trim()[0] : "ك";

  return (
    <nav className="bg-[#000817]/90 backdrop-blur-xl sticky top-0 z-50 border-b border-blue-900/50 shadow-lg font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* 1. اللوجو (كبير وبدون خلفية رمادية) */}
          <Link to={homeRoute} className="flex items-center gap-3.5 group">
            <div className="transition-transform group-hover:scale-105 shrink-0 flex items-center justify-center">
              <img
                src={logo}
                alt="منصة كيان"
                className="w-14 h-14 object-contain drop-shadow-md"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-white tracking-tight">
                كيان
              </span>
              <span className="text-[10px] font-bold text-blue-400 -mt-1 tracking-wider">
                المنصة التعليمية
              </span>
            </div>
          </Link>

          {/* 2. روابط التنقل في المنتصف */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#13233F]/80 p-1.5 rounded-2xl border border-blue-900/40">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive =
                location.pathname === to ||
                (to !== "/" && location.pathname.startsWith(to));

              return (
                <Link
                  key={label}
                  to={to}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* 3. الجزء الأيسر: محفظة المدرس والبروفايل */}
          <div className="hidden md:flex items-center gap-3.5">
            {currentUser && userData?.role === "teacher" && (
              <Link
                to="/teacher/earnings"
                className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 hover:border-emerald-500/50 px-4 py-2 rounded-2xl transition-all shadow-sm group"
                title="عرض تفاصيل الأرباح"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Wallet className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block leading-none">
                    أرباحي
                  </span>
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    {teacherEarnings.toLocaleString()} ج.م
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400/70 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            )}

            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-3 pr-2 pl-3.5 py-1.5 rounded-2xl border border-blue-900/60 hover:border-blue-700 bg-[#13233F]/80 hover:bg-[#13233F] transition-all cursor-pointer shadow-xs group"
                >
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm overflow-hidden shrink-0 border border-white/10 shadow-xs">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userData?.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userInitial}</span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-white block line-clamp-1 max-w-[120px]">
                      {userData?.fullName || "مستخدم كيان"}
                    </span>
                    <span className="text-[10px] font-bold text-blue-400 block">
                      {userData?.role === "teacher"
                        ? `معلم ${userData?.subject ? "• " + userData.subject : ""}`
                        : userData?.role === "admin"
                          ? "مسؤول المنصة"
                          : userData?.grade || "طالب"}
                    </span>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-transform duration-200 ${
                      menuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {menuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-[#0E1A30] rounded-2xl border border-blue-900/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 z-50">
                    <div className="p-4 bg-[#13233F] border-b border-blue-900/50 space-y-1.5">
                      <p className="text-xs font-black text-white line-clamp-1">
                        {userData?.fullName || "مستخدم كيان"}
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-800/60">
                        {userData?.role === "teacher" ? (
                          <>
                            <BookOpen className="w-3 h-3 text-blue-400" />
                            <span>مدرس: {userData?.subject || "عام"}</span>
                          </>
                        ) : userData?.role === "admin" ? (
                          <>
                            <ShieldCheck className="w-3 h-3 text-blue-400" />
                            <span>مسؤول النظام</span>
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-3 h-3 text-blue-400" />
                            <span>{userData?.grade || "طالب بالمنصة"}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-1.5 space-y-0.5">
                      <Link
                        to={homeRoute}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-600/20 rounded-xl transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-400" />
                        <span>لوحة التحكم</span>
                      </Link>

                      {userData?.role !== "teacher" &&
                        userData?.role !== "admin" && (
                          <Link
                            to="/profile"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-600/20 rounded-xl transition-colors"
                          >
                            <User className="w-4 h-4 text-blue-400" />
                            <span>الملف الشخصي</span>
                          </Link>
                        )}

                      {userData?.role === "teacher" && (
                        <Link
                          to="/teacher/earnings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors"
                        >
                          <Wallet className="w-4 h-4" />
                          <span>سجل الأرباح والاشتراكات</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer text-right"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </Link>
            )}
          </div>

          {/* 4. زر الموبايل */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-2xl bg-[#13233F] text-blue-400 border border-blue-900/60 focus:outline-none"
            >
              {isOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الموبايل */}
      {isOpen && (
        <div className="md:hidden bg-[#0B1528] border-t border-blue-900/50 shadow-2xl absolute w-full pb-6 pt-3 px-4 space-y-3 animate-in slide-in-from-top-2">
          {currentUser && (
            <div className="p-3 bg-[#13233F] rounded-2xl border border-blue-900/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm overflow-hidden shrink-0">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userData?.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-white">
                    {userData?.fullName || "مستخدم كيان"}
                  </p>
                  <p className="text-[10px] font-bold text-blue-400">
                    {userData?.role === "teacher"
                      ? `مدرس ${userData?.subject || ""}`
                      : userData?.role === "admin"
                        ? "مسؤول المنصة"
                        : userData?.grade || "طالب"}
                  </p>
                </div>
              </div>

              {userData?.role === "teacher" && (
                <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <span>إجمالي الأرباح:</span>
                  </span>
                  <span className="text-xs font-black text-emerald-400 font-mono">
                    {teacherEarnings.toLocaleString()} ج.م
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-[#13233F] font-bold text-xs p-3.5 rounded-xl transition-colors"
              >
                <Icon className="w-4 h-4 text-blue-400" />
                <span>{label}</span>
              </Link>
            ))}

            {currentUser ? (
              <>
                <Link
                  to={homeRoute}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 text-slate-300 hover:text-white hover:bg-[#13233F] font-bold text-xs p-3.5 rounded-xl transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400" />
                  <span>لوحة التحكم</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 font-bold text-xs p-3.5 rounded-xl transition-colors text-right mt-2 border-t border-blue-900/40"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="bg-blue-600 text-white p-4 rounded-xl font-black text-xs text-center mt-2 shadow-md shadow-blue-600/30"
              >
                تسجيل الدخول
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
