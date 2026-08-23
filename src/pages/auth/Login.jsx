import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LogIn, Mail, Lock } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
      } else {
        setError("حدث خطأ أثناء تسجيل الدخول، برجاء المحاولة مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4 font-sans"
      dir="rtl"
    >
      <div className="bg-white border-2 border-blue-100 rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">تسجيل الدخول</h1>
          <p className="text-xs font-bold text-slate-500">
            أهلاً بك مجدداً في منصة كيان التعليمية
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black p-3.5 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl py-3 pr-11 pl-4 text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700">
                كلمة المرور
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                نسيت كلمة المرور؟
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl py-3 pr-11 pl-4 text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer mt-2"
          >
            {loading ? "جاري الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs font-bold text-slate-500 space-y-2">
          <p>
            ليس لديك حساب؟{" "}
            <Link
              to="/register"
              className="text-blue-600 font-black hover:underline"
            >
              أنشئ حساب طالب جديد
            </Link>
          </p>
          <p>
            أو{" "}
            <Link
              to="/register-teacher"
              className="text-blue-700 font-black hover:underline"
            >
              تسجيل حساب مدرس
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
