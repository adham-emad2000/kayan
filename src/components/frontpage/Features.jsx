import React from "react";
import {
  GraduationCap,
  FileCheck,
  ShieldAlert,
  Headphones,
} from "lucide-react";

const Features = () => {
  const featuresList = [
    {
      number: "01",
      icon: <GraduationCap className="w-6 h-6 text-blue-600" />,
      title: "نخبة من خبراء التعليم الأكاديمي",
      description:
        "نخبة معتمدة من أفضل معلمي الثانوية العامة، يقدمون محتوى علمياً متكاملاً يعتمد على الفهم العميق والتحليل الاستراتيجي.",
    },
    {
      number: "02",
      icon: <FileCheck className="w-6 h-6 text-blue-600" />,
      title: "منظومة اختبارات وتقييم مستمر",
      description:
        "اختبارات دورية ومحاكاة دقيقة للامتحانات النهائية، مزودة بنظام تقييم فوري لتحديد ومتابعة مستواك الدراسي بدقة.",
    },
    {
      number: "03",
      icon: <ShieldAlert className="w-6 h-6 text-blue-600" />,
      title: "متابعة أداء شاملة لولي الأمر",
      description:
        "لوحة تحكم وتنبيهات ذكية تتيح لولي الأمر الإطلاع المستمر على معدلات الحضور، التقدم الأكاديمي، ودرجات الاختبارات.",
    },
    {
      number: "04",
      icon: <Headphones className="w-6 h-6 text-blue-600" />,
      title: "دعم أكاديمي وتقني متواصل",
      description:
        "فريق متخصص من المعلمين والمساعدين جاهز للرد على الاستفسارات العلمية والتقنية وتقديم الدعم اللازم على مدار الساعة.",
    },
  ];

  return (
    <section className="py-24 bg-blue-700 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* عنوان السيكشن */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="bg-blue-600/80 text-blue-100 border border-blue-500/50 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide inline-block mb-4 shadow-sm">
            مميزات المنصة
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            معايير احترافية تصنع الفارق في مسيرتك التعليمية
          </h2>
          <p className="text-blue-100/90 text-base sm:text-lg font-normal leading-relaxed">
            نقدم بيئة تعليمية رقمية متكاملة تجمع بين قوة المناهج وأحدث أدوات
            المتابعة والتقييم.
          </p>
        </div>

        {/* الكروت البيضاء */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {featuresList.map((item, index) => (
            <div
              key={index}
              className="bg-white text-slate-900 p-8 rounded-[2.5rem] shadow-[0_15px_40px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2 border border-slate-100 flex flex-col justify-between relative overflow-hidden group"
            >
              {/* رقم الترقيم الضخم والشيك في خلفية الكارت */}
              <div className="absolute top-6 left-8 text-7xl sm:text-8xl font-black text-blue-100/50 select-none pointer-events-none group-hover:text-blue-200/60 transition-colors">
                {item.number}
              </div>

              <div className="relative z-10">
                {/* الهيدر: الأيقونة */}
                <div className="mb-6">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
                    {item.icon}
                  </div>
                </div>

                {/* العنوان الرئيسي للكارت */}
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-4 tracking-tight">
                  {item.title}
                </h3>

                {/* التصميم الهندسي (بوكس داخلي هادي شايل الوصف) */}
                <div className="bg-slate-50/80 border border-slate-100 p-4 rounded-2xl">
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* خط سفلي بسيط ونظيف */}
              <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>منصة كيان التعليمية</span>
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
