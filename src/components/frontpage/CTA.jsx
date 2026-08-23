import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Laptop,
  Award,
  Users,
} from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 text-white relative overflow-hidden">
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.2; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.15); }
          }
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(12px); }
          }
          .animate-glow { animation: pulse-glow 7s ease-in-out infinite; }
          .animate-float { animation: float-slow 5s ease-in-out infinite; }
          .animate-float-delayed { animation: float-delayed 6s ease-in-out infinite 1s; }
        `}
      </style>

      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-glow"></div>
      <div
        className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-glow"
        style={{ animationDelay: "3.5s" }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-blue-200 font-bold text-sm mb-6 shadow-lg">
              <Sparkles className="w-4 h-4 text-amber-400" />
              انضم لفريق أساتذة كيان
            </div>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6 leading-[1.2]">
              هل أنت معلم وتسعى{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                لتطوير رسالتك؟
              </span>
            </h2>

            <p className="text-blue-100/80 text-base sm:text-lg font-medium mb-8 leading-relaxed max-w-2xl">
              يمكنك الآن الانضمام لفريق المعلمين على المنصة، والمشاركة في تدريس
              المناهج التعليمية للصفوف الثانوية والمساهمة في تطوير المنصة وتعليم
              الطلاب بأفضل طريقة ممكنة!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span className="text-sm font-bold text-blue-100">
                  تعليمك الآن أونلاين بكل احترافية
                </span>
              </div>
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 p-3.5 rounded-2xl">
                <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <span className="text-sm font-bold text-blue-100">
                  أدوات متطورة لتقديم الشرح
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/register-teacher"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-4 rounded-2xl font-black text-lg transition-all shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.5)] hover:-translate-y-1 flex items-center gap-3 group"
              >
                <span>انضم معنا كمعلم</span>
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-md relative">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl animate-float relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-white">
                      منصة التعليم الرقمي
                    </h4>
                    <p className="text-xs text-blue-200">
                      أدوات متكاملة لتقديم حصصك
                    </p>
                  </div>
                </div>

                <div className="bg-black/20 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-100">
                    ابدأ حصصك الأونلاين الآن
                  </span>
                  <Link
                    to="/register-teacher"
                    className="bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full"
                  >
                    سجل كمعلم
                  </Link>
                </div>
              </div>

              <div className="absolute -top-8 -left-6 bg-white text-slate-900 p-4 rounded-2xl shadow-2xl animate-float-delayed z-20 hidden sm:flex items-center gap-3 border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">
                    شارك بخبرتك
                  </p>
                  <p className="text-sm font-black text-slate-900">
                    طريقة شرح مميزة
                  </p>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-2xl shadow-2xl animate-float z-20 hidden sm:flex items-center gap-3 border border-white/20">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-100">
                    تواصل فعال
                  </p>
                  <p className="text-sm font-black">مع طلابك بكل سهولة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
