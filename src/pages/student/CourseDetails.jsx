import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  PlayCircle,
  BookOpen,
  Sparkles,
  User,
  GraduationCap,
  Layers,
  Zap,
  Flame,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import defaultCourseImage from "../../image.png";

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const staticFeatures = [
    "شرح فيديو فائق الجودة والوضوح مع تطبيقات تفاعلية",
    "ملزمة الشرح وبنك الأسئلة PDF بجودة عالية للطباعة",
    "امتحانات إلكترونية أسبوعية بتصحيح فوري وتايمر",
    "واجبات دورية وتدريبات مكثفة بعد كل محاضرة",
    "إمكانية إعادة تشغيل الحصة بدون حد أقصى للمشاهدات",
    "متابعة دورية وإجابة مباشرة على كل استفساراتك",
  ];

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const docRef = doc(db, "courses", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          setCourse(null);
        }

        if (currentUser) {
          const enrollQuery = query(
            collection(db, "enrollments"),
            where("studentId", "==", currentUser.uid),
            where("courseId", "==", id),
          );
          const enrollSnap = await getDocs(enrollQuery);
          if (!enrollSnap.empty) {
            setIsEnrolled(true);
          }
        }
      } catch (error) {
        console.error("Error fetching course details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [id, currentUser]);

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#070B0E] flex items-center justify-center font-black text-emerald-400 text-base font-sans"
        dir="rtl"
      >
        <div className="flex items-center gap-3 bg-[#0E161B] border border-emerald-500/20 px-8 py-4 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.15)]">
          <div className="w-5 h-5 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span>جاري تجهيز بيانات الكورس...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className="min-h-screen bg-[#070B0E] text-white flex flex-col items-center justify-center p-6 text-center font-sans"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-1">
          عفواً، هذا الكورس غير متوفر حالياً!
        </h2>
        <p className="text-xs font-bold text-slate-400 mb-6">
          قد يكون تم حذف الكورس أو أن الرابط غير صحيح.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/30"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const courseImage = course.thumbnailUrl || defaultCourseImage;
  const priceDisplay = course.price ? `${course.price} ج.م` : "مجاناً";

  return (
    <div
      className="relative min-h-screen bg-[#070B0E] text-white font-sans py-10 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-emerald-500 selection:text-black"
      dir="rtl"
    >
      {/* إضاءات نيون خلفية وتأثيرات Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/15 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-teal-500/10 blur-[150px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 w-96 h-96 rounded-full bg-emerald-600/10 blur-[140px]" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* زر العودة العلوي */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-black text-slate-300 hover:text-emerald-400 transition-all cursor-pointer bg-[#0E161B]/80 hover:bg-[#131D24] px-5 py-2.5 rounded-2xl border border-white/10 hover:border-emerald-500/30 w-fit backdrop-blur-xl shadow-lg shadow-black/40 group"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-400" />
          <span>العودة للرئيسية</span>
        </button>

        {/* الكارد الرئيسي الزجاجي المضيء */}
        <div className="bg-[#0E161B]/85 backdrop-blur-2xl rounded-[2.5rem] border border-emerald-500/20 p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* الجانب الأيمن: الشرح، التواريخ، والمميزات (7 أعمدة) */}
          <div className="lg:col-span-7 space-y-7">
            {/* الشارات النيون المودرن */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{course.subject || "الفيزياء"}</span>
              </span>

              <span className="bg-white/5 text-slate-200 border border-white/10 px-4 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                <span>{course.grade || "الصف الثالث الثانوي"}</span>
              </span>

              <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>{course.lessons?.length || 0} محاضرات</span>
              </span>
            </div>

            {/* العنوان والمحاضر */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                {course.title}
              </h1>

              <div className="flex items-center gap-3 text-sm font-bold text-slate-300 pt-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                  <User className="w-4 h-4" />
                </div>
                <span>
                  المحاضر:{" "}
                  <strong className="text-emerald-400 text-base">
                    {course.teacherName || course.teacher || "مدرس المادة"}
                  </strong>
                </span>
              </div>
            </div>

            {/* نبذة عن الكورس */}
            <p className="text-sm text-slate-300 leading-relaxed font-medium bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              {course.description ||
                "هذا الكورس يساعدك تتابع المنهج بشكل مريح ومنظم مع شرح وافٍ وحل مكثف لأهم الأسئلة والتطبيقات والامتحانات الدورية."}
            </p>

            {/* بوكس المواعيد والجدول بتأثير نيون غامق */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#121D24] to-[#0B1317] p-6 rounded-[2rem] border border-emerald-500/30 space-y-4 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3 font-black text-white text-xs sm:text-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30 font-black">
                  <Calendar className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span>
                  فترة الكورس: من{" "}
                  <strong className="text-emerald-400">
                    {course.startDate || "بداية الشهر"}
                  </strong>{" "}
                  إلى{" "}
                  <strong className="text-emerald-400">
                    {course.endDate || "نهاية الشهر"}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-3 font-bold text-slate-300 pt-3 border-t border-white/10 text-xs sm:text-sm">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2">
                  <span>جدول ومواعيد النزول:</span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg text-xs font-black">
                    {course.schedule || "ينزل كل سبت وأربعاء"}
                  </span>
                </div>
              </div>
            </div>

            {/* ماذا ستحصل عليه في هذا الكورس */}
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <div className="w-2.5 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <span>ماذا ستحصل عليه في هذا الكورس؟</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {staticFeatures.map((feature, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 bg-white/[0.03] hover:bg-emerald-500/[0.06] p-4 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition-all group"
                  >
                    <div className="w-6 h-6 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform">
                      <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-200 leading-snug">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* الجانب الأيسر: الصورة، السعر، وزر الاشتراك (5 أعمدة) */}
          <div className="lg:col-span-5 bg-[#0B1216]/90 p-6 rounded-[2.2rem] border border-emerald-500/25 space-y-6 sticky top-24 shadow-2xl backdrop-blur-xl">
            {/* صورة غلاف الكورس مع توهج خفيف */}
            <div className="relative h-60 w-full rounded-2xl overflow-hidden border border-white/10 bg-[#070B0E] group shadow-inner">
              <img
                src={courseImage}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-3 right-3 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 text-emerald-300 text-[11px] font-black px-3 py-1 rounded-xl">
                منصة كيان التعليمية
              </div>
            </div>

            {/* بوكس السعر بتصميم جريء ومميز */}
            <div className="bg-[#121D24] p-5 rounded-2xl border border-emerald-500/20 flex items-center justify-between shadow-inner">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">
                  إجمالي قيمة الاشتراك:
                </span>
                <span className="text-[10px] text-emerald-400 font-bold">
                  شامل كافة الحصص والامتحانات
                </span>
              </div>
              <div className="text-3xl font-black bg-gradient-to-l from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                {priceDisplay}
              </div>
            </div>

            {/* زر الاشتراك / المشاهدة النيون */}
            {isEnrolled ? (
              <button
                onClick={() => navigate(`/player/${course.id}`)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-black py-4.5 rounded-2xl text-base transition-all shadow-[0_0_30px_rgba(16,185,129,0.35)] cursor-pointer flex items-center justify-center gap-2"
              >
                <PlayCircle className="w-5 h-5 stroke-[2.5]" />
                <span>أنت مشترك بالفعل • مشاهدة الحصص</span>
              </button>
            ) : (
              <button
                onClick={() => navigate(`/checkout/${course.id}`)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.99] text-slate-950 font-black py-4.5 rounded-2xl text-base transition-all shadow-[0_0_35px_rgba(16,185,129,0.4)] cursor-pointer flex items-center justify-center gap-2"
              >
                <Flame className="w-5 h-5 fill-slate-950" />
                <span>تأكيد الاشتراك الآن</span>
              </button>
            )}

            {/* بادج الضمان والأمان */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-bold pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>دفع آمن ومضمون وتفعيل فوري للاشتراك</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
