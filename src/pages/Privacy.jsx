import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";

const Privacy = () => {
  return (
    <div
      className="min-h-screen bg-[#070B19] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 w-fit"
        >
          <ArrowRight className="w-4 h-4" /> <span>العودة للرئيسية</span>
        </Link>

        {/* الهيدر */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            سياسة الخصوصية
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            آخر تحديث: أغسطس 2026 — نحن نولي اهتماماً بالغاً بحماية بياناتك
            الشخصية.
          </p>
        </div>

        {/* محتوى السياسة */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6 text-xs sm:text-sm leading-relaxed text-slate-300">
          <section className="space-y-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 1. البيانات
              التي نقوم بجمعها
            </h2>
            <p className="text-slate-400">
              نقوم بجمع بعض البيانات الضرورية لتقديم الخدمة التعليمية بشكل سليم،
              مثل: الاسم الكامل، البريد الإلكتروني، رقم الهاتف، والمرحلة
              الدراسية، بالإضافة إلى صور إيصالات الدفع وأرقام الهواتف المحولة
              منها لغرض التحقق المالي وتفعيل الاشتراكات.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 2. كيف نستخدم
              هذه البيانات؟
            </h2>
            <p className="text-slate-400">
              تُستخدم بياناتك حصرياً للأغراض الآتية:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 pr-2">
              <li>إنشاء حسابك وإدارة صلاحيات الدخول للكورسات المشترك بها.</li>
              <li>التحقق من صحة عمليات الدفع وتفعيل الاشتراكات بدقة.</li>
              <li>
                التواصل معك في حال وجود تحديثات هامة تخص المنصة أو دراستك.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 3. حماية
              وأمان البيانات
            </h2>
            <p className="text-slate-400">
              نحن نستخدم قواعد بيانات مشفرة وعالية الأمان (عبر Google Firebase)
              مع تطبيق صلاحيات وصول صارمة تمنع أي شخص غير مطلع من الوصول
              لبياناتك أو إيصالاتك الشخصية. لا نقوم ببيع أو مشاركة بياناتك مع أي
              طرف ثالث إطلاقاً.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
