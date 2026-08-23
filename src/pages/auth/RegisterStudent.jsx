import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const RegisterStudent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false); // 👈 حالة الموافقة على الشروط

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    gender: "male",
    phone: "",
    grade: "third_secondary",
    parentPhone: "",
    motherPhone: "",
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

    if (!validateEgyptianPhone(formData.phone))
      newErrors.phone = "رقم الهاتف غير صحيح (010/11/12/15)";
    if (!validateEgyptianPhone(formData.parentPhone))
      newErrors.parentPhone = "رقم هاتف الأب غير صحيح";
    if (!validateEgyptianPhone(formData.motherPhone))
      newErrors.motherPhone = "رقم هاتف الأم غير صحيح";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 👈 التحقق من الموافقة على الشروط والأحكام
    if (!agreed) {
      alert("يجب الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة.");
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

      await setDoc(doc(db, "students", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        gender: formData.gender,
        phone: formData.phone,
        grade: formData.grade,
        parentPhone: formData.parentPhone,
        motherPhone: formData.motherPhone,
        role: "student",
        createdAt: new Date().toISOString(),
      });

      alert("تم إنشاء الحساب وتسجيل البيانات بنجاح! أهلاً بك في منصة كيان.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Firebase Error Code:", error.code);

      if (error.code === "auth/email-already-in-use") {
        alert(
          "عذراً، هذا البريد الإلكتروني مسجل مسبقاً! يرجى تسجيل الدخول أو استخدام بريد آخر.",
        );
        setStep(1);
        setErrors({ email: "هذا البريد مستخدم بالفعل" });
      } else if (error.code === "auth/invalid-email") {
        alert("صيغة البريد الإلكتروني غير صحيحة.");
        setStep(1);
      } else if (error.code === "auth/weak-password") {
        alert("كلمة المرور ضعيفة جداً.");
        setStep(1);
      } else {
        alert("حدث خطأ غير متوقع، برجاء المحاولة مرة أخرى.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f4f1fb] text-slate-900 flex items-center justify-center p-4"
      dir="rtl"
    >
      <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl shadow-purple-900/10 border border-purple-100/50 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7c3aed]/10 text-[#7c3aed] mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            إنشاء حساب طالب
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            ابدأ رحلتك التعليمية مع منصة كيان
          </p>
        </div>

        {/* مؤشر الخطوات */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <span className="text-xs font-bold text-[#7c3aed] bg-[#7c3aed]/10 px-3 py-1 rounded-full">
            الخطوة {step} من 2
          </span>
          <div className="flex gap-1.5">
            <div
              className={`w-8 h-1.5 rounded-full transition-colors ${step === 1 ? "bg-[#7c3aed]" : "bg-purple-200"}`}
            ></div>
            <div
              className={`w-8 h-1.5 rounded-full transition-colors ${step === 2 ? "bg-[#7c3aed]" : "bg-slate-200"}`}
            ></div>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الاسم الكامل (ثلاثي)
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="مثال: محمد أحمد محمود"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-[#7c3aed]"
              />
              {errors.fullName && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-[#7c3aed]"
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  النوع
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة المرور
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            {/* شروط الباسورد */}
            <div className="bg-purple-50/40 p-3 rounded-2xl border border-purple-100/60 space-y-1 text-[11px]">
              <p className="font-bold text-slate-700 mb-1">شروط كلمة المرور:</p>
              <div
                className={`flex items-center gap-1.5 ${passCheck.minLength ? "text-emerald-600" : "text-slate-400"}`}
              >
                <CheckCircle2 className="w-3 h-3" />{" "}
                <span>8 أحرف على الأقل</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${passCheck.hasUpperCase ? "text-emerald-600" : "text-slate-400"}`}
              >
                <CheckCircle2 className="w-3 h-3" />{" "}
                <span>حرف إنجليزي كبير (Uppercase)</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${passCheck.hasLowerCase ? "text-emerald-600" : "text-slate-400"}`}
              >
                <CheckCircle2 className="w-3 h-3" />{" "}
                <span>حرف إنجليزي صغير (Lowercase)</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${passCheck.hasNumber ? "text-emerald-600" : "text-slate-400"}`}
              >
                <CheckCircle2 className="w-3 h-3" />{" "}
                <span>رقم واحد على الأقل (0-9)</span>
              </div>
            </div>

            {(errors.password || errors.confirmPassword) && (
              <p className="text-red-500 text-xs font-semibold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> برجاء استيفاء شروط كلمة
                المرور وتطابقها.
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-4 rounded-2xl mt-4 shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
            >
              <span>التالي</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                الصف الدراسي
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-[#7c3aed]"
              >
                <optgroup label="المرحلة الابتدائية">
                  <option value="p1">الصف الأول الابتدائي</option>
                  <option value="p2">الصف الثاني الابتدائي</option>
                  <option value="p3">الصف الثالث الابتدائي</option>
                  <option value="p4">الصف الرابع الابتدائي</option>
                  <option value="p5">الصف الخامس الابتدائي</option>
                  <option value="p6">الصف السادس الابتدائي</option>
                </optgroup>
                <optgroup label="المرحلة الإعدادية">
                  <option value="prep1">الصف الأول الإعدادي</option>
                  <option value="prep2">الصف الثاني الإعدادي</option>
                  <option value="prep3">الصف الثالث الإعدادي</option>
                </optgroup>
                <optgroup label="المرحلة الثانوية">
                  <option value="first_secondary">الصف الأول الثانوي</option>
                  <option value="second_secondary">الصف الثاني الثانوي</option>
                  <option value="third_secondary">الصف الثالث الثانوي</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف الشخصي (واتساب)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01xxxxxxxxx"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-[#7c3aed]"
              />
              {errors.phone && (
                <p className="text-red-500 text-[10px] mt-1 font-bold">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم هاتف الأب
                </label>
                <input
                  type="tel"
                  name="parentPhone"
                  value={formData.parentPhone}
                  onChange={handleChange}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-[#7c3aed]"
                />
                {errors.parentPhone && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">
                    {errors.parentPhone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم هاتف الأم
                </label>
                <input
                  type="tel"
                  name="motherPhone"
                  value={formData.motherPhone}
                  onChange={handleChange}
                  placeholder="01xxxxxxxxx"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-[#7c3aed]"
                />
                {errors.motherPhone && (
                  <p className="text-red-500 text-[10px] mt-1 font-bold">
                    {errors.motherPhone}
                  </p>
                )}
              </div>
            </div>

            {/* 👈 خانة الموافقة على الشروط والأحكام وسياسة الخصوصية */}
            <div className="flex items-center gap-2.5 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#7c3aed] focus:ring-[#7c3aed] cursor-pointer"
              />
              <label
                htmlFor="terms"
                className="text-xs text-slate-600 cursor-pointer"
              >
                أنا أوافق على{" "}
                <Link
                  to="/terms"
                  target="_blank"
                  className="text-[#7c3aed] font-bold hover:underline"
                >
                  الشروط والأحكام
                </Link>{" "}
                و{" "}
                <Link
                  to="/privacy"
                  target="_blank"
                  className="text-[#7c3aed] font-bold hover:underline"
                >
                  سياسة الخصوصية
                </Link>
              </label>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-4 rounded-2xl shadow-lg shadow-purple-600/25 flex items-center justify-center cursor-pointer"
              >
                {loading ? "جاري الحفظ..." : "إتمام التسجيل"}
              </button>
            </div>
          </form>
        )}

        {/* رابط تسجيل الدخول */}
        <div className="text-center mt-6 pt-5 border-t border-slate-100 text-xs sm:text-sm text-slate-500">
          لديك حساب بالفعل؟{" "}
          <Link
            to="/login"
            className="text-[#7c3aed] font-bold hover:underline"
          >
            سجل دخولك الآن
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
