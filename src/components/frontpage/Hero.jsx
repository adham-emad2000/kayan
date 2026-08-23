import React from "react";
import { Link } from "react-router-dom";
import {
  PlayCircle,
  ArrowLeft,
  Star,
  Users,
  BookOpen,
  Sparkles,
} from "lucide-react";

const Hero = () => {
  return (
    // ضفنا هنا خلفية الـ Grid (الشبكة) الشفافة جداً عشان تكسر الملل
    <div className="relative overflow-hidden bg-[#00000024] min-h-[calc(100vh-80px)] flex items-center bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]">
      {/* ستايل الأنيميشن الجديد بتاع الخلفية والكروت */}
      <style>
        {`
          /* حركة الكروت الطايرة */
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          @keyframes float-delayed {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
            100% { transform: translateY(0px); }
          }
          
          /* حركة الألوان في الخلفية (الـ Blobs) */
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }

          .animate-float { animation: float 4s ease-in-out infinite; }
          .animate-float-delayed { animation: float-delayed 5s ease-in-out infinite 1s; }
          .animate-blob { animation: blob 7s infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}
      </style>

      {/* بقع الألوان المتحركة في الخلفية (Animated Blobs) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] -right-[10%] w-96 h-96 rounded-full bg-blue-200/40 blur-3xl animate-blob"></div>
        <div className="absolute top-[20%] -left-[10%] w-96 h-96 rounded-full bg-indigo-200/30 blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-96 h-96 rounded-full bg-blue-100/40 blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-12 lg:py-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* الجزء اليمين: النصوص */}
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-100 text-blue-700 font-semibold text-sm mb-6 shadow-sm">
              <Sparkles className="w-4 h-4" />
              منصة الجيل الجديد للثانوية العامة
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 leading-[1.3] mb-6">
              متشتتش نفسك.. <br />
              طريقك للـ{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-500">
                الدرجة النهائية
              </span>{" "}
              يبدأ من هنا.
            </h1>

            <p className="text-lg text-slate-500 mb-8 max-w-xl leading-relaxed font-medium">
              منصة "كيان" بتوفرلك تجربة تعليمية متكاملة. اختار أفضل المدرسين،
              ذاكر بذكاء من خلال كورسات تفاعلية، ووصل لهدفك بكل سهولة وراحة.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all shadow-[0_4px_15px_rgba(29,78,216,0.25)] hover:shadow-[0_6px_20px_rgba(29,78,216,0.3)] hover:-translate-y-1 flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  ابدأ رحلتك دلوقتي
                  <ArrowLeft className="w-5 h-5" />
                </span>
              </Link>

              <Link
                to="/how-it-works"
                className="w-full sm:w-auto bg-white/80 backdrop-blur-sm hover:bg-slate-50 text-slate-700 border border-slate-200 px-8 py-3.5 rounded-xl font-bold text-lg transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 group"
              >
                <PlayCircle className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                ازاي المنصة بتشتغل؟
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-8 text-slate-500 font-semibold text-sm">
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                <span>+10,000 طالب</span>
              </div>
              <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <Star className="w-5 h-5 text-yellow-400" />
                <span>تقييم 4.9/5</span>
              </div>
            </div>
          </div>

          {/* الجزء الشمال: الأشكال والأنيميشن */}
          <div className="relative hidden lg:block h-[500px]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-100/50 rounded-full blur-2xl"></div>

            {/* الكارت الطاير الأول */}
            <div className="absolute top-10 right-10 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 animate-float w-64 z-20">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                  <Users className="text-blue-600 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    نخبة المدرسين
                  </h3>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                <div className="w-4/5 h-full bg-blue-500 rounded-full"></div>
              </div>
            </div>

            {/* الكارت الطاير التاني */}
            <div className="absolute bottom-20 left-10 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-slate-100 animate-float-delayed w-56 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-emerald-600 w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    مذاكرة بذكاء
                  </h3>
                  <p className="text-xs text-slate-500">محتوى تفاعلي 100%</p>
                </div>
              </div>
            </div>

            {/* العنصر المركزي */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-white z-10 animate-float border-[6px] border-white/50 backdrop-blur-sm">
              <BookOpen className="w-20 h-20 mb-4 opacity-90" />
              <h2 className="text-2xl font-black">كيان</h2>
              <p className="text-blue-200 font-medium text-sm mt-2">
                مستقبلك بيبدأ هنا
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
