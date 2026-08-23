import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Phone,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Award,
} from "lucide-react";

import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const RegisterTeacher = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    subject: "الرياضيات",
    phone: "",
    experience: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateEgyptianPhone = (phone) => {
    return /^01[0125][0-9]{8}$/.test(phone);
  };

  const validatePassword = (pass) => {
    return {
      minLength: pass.length >= 8,
      hasUpperCase: /[A-Z]/.test(pass),
      hasLowerCase: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
    };
  };

  const passCheck = validatePassword(formData.password);

  const handleNextStep = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = "الاسم الكامل مطلوب";
    if (!formData.email.trim() || !formData.email.includes("@"))
      newErrors.email = "بريد إلكتروني غير صالح";

    if (
      !passCheck.minLength ||
      !passCheck.hasUpperCase ||
      !passCheck.hasLowerCase ||
      !passCheck.hasNumber
    ) {
      newErrors.password = "كلمة المرور غير مطابقة للشروط";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمة المرور غير متطابقة";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!validateEgyptianPhone(formData.phone)) {
      newErrors.phone = "رقم الهاتف غير صحيح (010/11/12/15)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const user = userCredential.user;

      // حفظ بيانات المدرس في collection "teachers" مع شروط الاعتماد
      await setDoc(doc(db, "teachers", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        subject: formData.subject,
        phone: formData.phone,
        experience: formData.experience,
        role: "teacher",
        isApproved: false, // 👈 بانتظار موافقة الأدمن ودفع الاشتراك
        subscriptionStatus: "pending_payment",
        receiptUrl: "",
        totalEarnings: 0,
        lockedBalance: 0,
        createdAt: new Date().toISOString(),
      });

      alert("تم تسجيل حساب المدرس بنجاح! يرجى سداد رسوم تفعيل الحساب.");
      navigate("/teacher/pending"); // 👈 التوجه لصفحة دفع الاشتراك ورفع الإيصال
    } catch (error) {
      console.error("Firebase Error:", error.code);

      if (error.code === "auth/email-already-in-use") {
        setStep(1);
        setErrors({
          email: "هذا البريد الإلكتروني مستخدم بالفعل، يرجى إدخال بريد آخر",
        });
      } else if (error.code === "auth/invalid-email") {
        setStep(1);
        setErrors({ email: "صيغة البريد الإلكتروني غير صالحة" });
      } else {
        alert("حدث خطأ أثناء التسجيل، برجاء المحاولة مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F4F7FB] text-slate-900 flex items-center justify-center p-4 sm:p-6 font-sans"
      dir="rtl"
    >
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-xl shadow-blue-600/5 border-2 border-blue-100 p-8 sm:p-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-sm border border-blue-100">
            <Award className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>انضم إلى هيئة تدريس منصة كيان</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            تسجيل حساب مدرس
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-bold">
            ابدأ رحلتك التدريسية الاحترافية معنا
          </p>
        </div>

        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            الخطوة {step} من 2
          </span>
          <div className="flex gap-1.5">
            <div
              className={`w-8 h-1.5 rounded-full transition-colors ${
                step === 1 ? "bg-blue-600" : "bg-blue-200"
              }`}
            ></div>
            <div
              className={`w-8 h-1.5 rounded-full transition-colors ${
                step === 2 ? "bg-blue-600" : "bg-slate-200"
              }`}
            ></div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                الاسم الأكاديمي أو الثلاثي *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="مثال: أ. محمد محمود"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 pr-10 pl-4 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                البريد الإلكتروني *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="teacher@example.com"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 pr-10 pl-4 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                المادة الدراسية *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <BookOpen className="w-4 h-4" />
                </span>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 pr-10 pl-4 text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="الفيزياء">الفيزياء</option>
                  <option value="الكيمياء">الكيمياء</option>
                  <option value="الأحياء">الأحياء</option>
                  <option value="الرياضيات">الرياضيات</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                  <option value="اللغة الفرنسية">اللغة الفرنسية</option>
                  <option value="اللغة الألمانية">اللغة الألمانية</option>
                  <option value="التاريخ والجغرافيا">التاريخ والجغرافيا</option>
                  <option value="الفلسفة وعلم النفس">الفلسفة وعلم النفس</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  كلمة المرور *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 pr-10 pl-4 text-sm font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-1">
                  تأكيد كلمة المرور *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 pr-10 pl-4 text-sm font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {errors.password && (
              <p className="text-red-500 text-[10px] font-bold">
                {errors.password}
              </p>
            )}
            {errors.confirmPassword && (
              <p className="text-red-500 text-[10px] font-bold">
                {errors.confirmPassword}
              </p>
            )}

            <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100 space-y-1 text-[11px] font-bold">
              <p className="text-slate-700 mb-1">شروط كلمة المرور:</p>
              <div
                className={`flex items-center gap-1.5 ${
                  passCheck.minLength ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>8 أحرف على الأقل</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  passCheck.hasUpperCase ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>حرف إنجليزي كبير (A-Z)</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  passCheck.hasLowerCase ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>حرف إنجليزي صغير (a-z)</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  passCheck.hasNumber ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>رقم واحد على الأقل (0-9)</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer mt-2"
            >
              <span>التالي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                رقم الهاتف الشخصي (واتساب) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 pr-10 pl-4 text-sm font-bold text-slate-800 focus:outline-none font-mono"
                  dir="ltr"
                />
              </div>
              {errors.phone && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1">
                نبذة مختصرة أو الخبرة (اختياري)
              </label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                placeholder="مثال: معلم أول للثانوية العامة بخبرة 10 سنوات في تدريس المادة..."
                rows="3"
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none resize-none"
              ></textarea>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/30 flex items-center justify-center text-sm transition-all cursor-pointer"
              >
                {loading ? "جاري إنشاء الحساب..." : "تأكيد وإنشاء الحساب"}
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-6 pt-5 border-t border-slate-100 text-xs sm:text-sm text-slate-500 font-bold">
          لديك حساب بالفعل؟{" "}
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

export default RegisterTeacher;
