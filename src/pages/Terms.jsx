import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldAlert, FileText, CheckCircle } from "lucide-react";

const Terms = () => {
  return (
    <div
      className="min-h-screen bg-[#070B19] text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 w-fit"
        >
          <ArrowRight className="w-4 h-4" /> <span>العودة للرئيسية</span>
        </Link>

        {/* الهيدر */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            شروط والأحكام الاستخدام
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            آخر تحديث: أغسطس 2026 — استخدِمك لمنصة كيان يعني موافقتك التامة على
            هذه الشروط.
          </p>
        </div>

        {/* محتوى الشروط */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl space-y-6 text-xs sm:text-sm leading-relaxed text-slate-300">
          <section className="space-y-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" /> 1. قبول الشروط
            </h2>
            <p className="text-slate-400">
              منصة "كيان" هي منصة تعليمية إلكترونية تهدف إلى تقديم المحتوى
              التعليمي والشرح والمراجعات. دخولك للمنصة أو إنشاء حساب عليها يعد
              موافقة صريحة ومسبقة على كافة البنود الواردة في هذه الصفحة.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" /> 2. حساب
              المستخدم وأمن الحساب
            </h2>
            <p className="text-slate-400">
              أنت مسؤول مسؤولية كاملة عن الحفاظ على سرية بيانات حسابك ورقمك
              السري. يحظر تماماً مشاركة الحساب أو بيانات الدخول مع أي شخص آخر.
              في حال اكتشاف مشاركة الحساب، تحق لإدارة المنصة حظر الحساب نهائياً
              دون أي إنذار مسبق ودون استرداد رسوم الاشتراك.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" /> 3. الاشتراكات
              وعمليات الدفع
            </h2>
            <p className="text-slate-400">
              تتم عمليات الاشتراك من خلال تحويل الرسوم عبر الطرق المعتمدة (مثل
              فودافون كاش أو إنستاباي) ورفع إيصال التحويل الصحيح. يتم مراجعة
              الطلبات وتفعيلها بواسطة الإدارة. الاشتراكات والمدفوعات التي يتم
              اعتمادها نهائياً لا يمكن استرداد قيمتها إلا بقرار استثنائي من
              إدارة المنصة.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-indigo-400" /> 4. حقوق
              الملكية الفكرية
            </h2>
            <p className="text-slate-400">
              جميع الفيديوهات، الشروحات، المذكرات، والأسئلة الموجودة داخل كورسات
              منصة كيان هي ملكية فكرية خالصة للمنصة وللمدرسين المتعاونين معنا.
              يُمنع منعاً باتاً تسجيل الفيديوهات، إعادة نشرها، أو تداولها على أي
              منصات أخرى، ومن يخالف ذلك يعرض نفسه للمساءلة القانونية وإغلاق
              حسابه.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;
