import React, { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { KeyRound, Mail, ArrowRight, CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found") {
        setError("لا يوجد حساب مسجل بهذا البريد الإلكتروني.");
      } else if (err.code === "auth/invalid-email") {
        setError("صيغة البريد الإلكتروني غير صحيحة.");
      } else {
        setError("تعذر إرسال رابط التعيين، برجاء المحاولة مرة أخرى.");
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
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            استعادة كلمة المرور
          </h1>
          <p className="text-xs font-bold text-slate-500">
            أدخل بريدك الإلكتروني لإرسال رابط إعادة تعيين كلمة المرور
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black p-3.5 rounded-xl text-center">
            {error}
          </div>
        )}

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-black text-slate-800 leading-relaxed">
              تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني بنجاح! تفقد
              صندوق الوارد والـ Spam.
            </p>
            <Link
              to="/login"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
            >
              <span>العودة لتسجيل الدخول</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700">
                البريد الإلكتروني المسجل
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-xl py-3 pr-11 pl-4 text-xs font-bold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black py-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              {loading ? "جاري الإرسال..." : "إرسال رابط التعيين"}
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100 text-xs font-bold text-slate-500">
          تذكرت كلمة المرور؟{" "}
          <Link
            to="/login"
            className="text-blue-600 font-black hover:underline"
          >
            سجل دخولك الآن
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
