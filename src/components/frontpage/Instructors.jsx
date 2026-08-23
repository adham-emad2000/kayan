import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Video,
  Eye,
  ShoppingBag,
  BookOpen,
} from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const Instructors = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all");
  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  const tabs = [
    { id: "all", label: "جميع الكورسات" },
    { id: "الصف الأول الثانوي", label: "أولى ثانوي" },
    { id: "الصف الثاني الثانوي", label: "تانية ثانوي" },
    { id: "الصف الثالث الثانوي", label: "تالتة ثانوي" },
  ];

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

  const filteredCourses =
    activeTab === "all"
      ? coursesList
      : coursesList.filter((item) => item.grade === activeTab);

  const handleSubscribe = (courseId) => {
    if (!currentUser) {
      navigate("/login");
    } else {
      navigate(`/checkout/${courseId}`);
    }
  };

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
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-4">
            استكشف كورساتنا
          </h2>
          <p className="text-slate-600 font-medium">
            مجموعة مختارة من أقوى المناهج التعليمية
          </p>
        </div>

        {/* شريط الفلتر للمراحل الدراسية */}
        <div className="flex items-center justify-center gap-2.5 overflow-x-auto pb-6 mb-12 scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-2xl font-black text-xs sm:text-sm whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105"
                  : "bg-white/80 text-slate-600 border border-slate-200 hover:border-blue-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 font-black animate-pulse text-blue-600 text-base">
            جاري تحميل الكورسات المتاحة...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 bg-white/60 rounded-3xl border border-slate-200">
            <p className="text-slate-500 font-bold">
              لا توجد كورسات متاحة في هذه المرحلة حالياً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-5 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 flex flex-col justify-between"
              >
                <div>
                  {/* صورة الكورس بمقاس موحد */}
                  <div className="w-full h-52 rounded-[2rem] overflow-hidden mb-5 relative bg-slate-200">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover"
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
                      <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-black px-3 py-1 rounded-xl">
                        {course.grade || "عام"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 px-2 line-clamp-1">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 text-xs px-2 mt-2 line-clamp-2 h-9 leading-relaxed">
                    {course.description || "لا يوجد وصف مدخل لهذا الكورس."}
                  </p>
                </div>

                {/* أزرار التفاعل */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-200/50">
                  <Link
                    to={`/course/${course.id}`}
                    className="bg-slate-100 hover:bg-blue-600 hover:text-white py-3 rounded-2xl text-xs font-black text-center transition-all flex items-center justify-center gap-1.5"
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
                      onClick={() => handleSubscribe(course.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl text-xs font-black text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                    >
                      <ShoppingBag className="w-4 h-4" /> اشتراك
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Instructors;
