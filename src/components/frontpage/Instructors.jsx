import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Video,
  Eye,
  ShoppingBag,
  BookOpen,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const Instructors = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👈 عدد الكورسات اللي بتظهر في الأول (مثلاً 6 كورسات)
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    const fetchAllCourses = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "courses"));
        setCoursesList(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllCourses();
  }, []);

  const handleSubscribe = (courseId) => {
    if (!currentUser) {
      navigate("/login");
    } else {
      navigate(`/checkout/${courseId}`);
    }
  };

  // 👈 دالة إظهار كورسات إضافية عند الضغط على زر "عرض المزيد"
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  // 👈 الكورسات التي سيتم عرضها بناءً على العداد الحالي
  const displayedCourses = coursesList.slice(0, visibleCount);

  return (
    <section
      className="py-24 animated-bg text-slate-900 relative overflow-hidden"
      dir="rtl"
    >
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animated-bg {
          background: linear-gradient(-45deg, #e0f2fe, #f0f9ff, #f8fafc, #dbeafe);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        .gold-shine {
          background: linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%);
          box-shadow: 0 0 15px rgba(217, 119, 6, 0.4);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* عنوان القسم بشكل أنيق وعصري */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black border border-blue-200/50 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>مكتبة الكورسات الشاملة</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            استكشف أقوى الكورسات والمناهج التعليمية
          </h2>
          <p className="text-slate-500 text-sm font-bold">
            تعلم مع نخبة المعلمين وبأحدث أساليب الشرح الرقمي لضمان تفوقك
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 font-black animate-pulse text-blue-600 text-base">
            جاري تحميل الكورسات المتاحة...
          </div>
        ) : coursesList.length === 0 ? (
          <div className="text-center py-16 bg-white/60 rounded-[2.5rem] border border-slate-200 shadow-sm max-w-md mx-auto">
            <p className="text-slate-500 font-bold text-sm">
              لا توجد كورسات متاحة حالياً. انتظرنا قريباً!
            </p>
          </div>
        ) : (
          <>
            {/* شبكة عرض الكورسات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between group"
                >
                  <div>
                    {/* صورة الكورس بمقاس موحد */}
                    <div className="w-full h-52 rounded-[2rem] overflow-hidden mb-5 relative bg-slate-200 shadow-inner">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <Video className="w-10 h-10" />
                        </div>
                      )}

                      {/* السعر اللامع */}
                      <div className="absolute bottom-4 left-4 gold-shine text-white text-sm font-black px-4 py-2 rounded-2xl">
                        {course.price || 0} ج.م
                      </div>

                      {/* شارة الصف الدراسي */}
                      <div className="absolute top-4 right-4">
                        <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 rounded-xl shadow-md">
                          {course.grade || "عام"}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-slate-900 px-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-slate-500 text-xs px-2 mt-2 line-clamp-2 h-9 leading-relaxed font-medium">
                      {course.description || "لا يوجد وصف مدخل لهذا الكورس."}
                    </p>
                  </div>

                  {/* أزرار التفاعل */}
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-200/50">
                    <Link
                      to={`/course/${course.id}`}
                      className="bg-slate-100 hover:bg-blue-600 hover:text-white py-3 rounded-2xl text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Eye className="w-4 h-4" /> تفاصيل
                    </Link>

                    {currentUser?.uid === course.teacherId ? (
                      <Link
                        to="/teacher/dashboard"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                      >
                        <BookOpen className="w-4 h-4" /> إدارة الكورس
                      </Link>
                    ) : userData?.role === "teacher" ? (
                      <span className="bg-slate-100 text-slate-400 py-3 rounded-2xl text-[11px] font-black text-center flex items-center justify-center cursor-not-allowed">
                        غير متاح للمدرسين
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSubscribe(course.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
                      >
                        <ShoppingBag className="w-4 h-4" /> اشتراك
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 👈 زر "عرض المزيد" يظهر فقط لو فيه كورسات زيادة لسه مظهرتش */}
            {visibleCount < coursesList.length && (
              <div className="text-center mt-14">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="bg-white hover:bg-blue-600 text-slate-800 hover:text-white border-2 border-slate-200 hover:border-blue-600 px-8 py-4 rounded-2xl font-black text-sm transition-all duration-300 shadow-lg shadow-slate-200 cursor-pointer inline-flex items-center gap-2 group active:scale-95"
                >
                  <span>عرض المزيد من الكورسات</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Instructors;
