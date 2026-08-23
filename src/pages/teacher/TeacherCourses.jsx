import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Plus,
  ArrowRight,
  Video,
  Users,
  Trash2,
  Edit,
  Search,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const TeacherCourses = () => {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCourses = async () => {
    if (!currentUser) return;
    try {
      const q = query(
        collection(db, "courses"),
        where("teacherId", "==", currentUser.uid),
      );
      const snap = await getDocs(q);
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [currentUser]);

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا الكورس نهائياً؟"))
      return;
    try {
      await deleteDoc(doc(db, "courses", id));
      setCourses(courses.filter((c) => c.id !== id));
      alert("تم حذف الكورس بنجاح");
    } catch (err) {
      alert("فشل حذف الكورس: " + err.message);
    }
  };

  const filteredCourses = courses.filter((c) =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div
      className="min-h-screen bg-[#f4f1fb] text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* شريط علوي */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/teacher/dashboard"
              className="w-10 h-10 rounded-xl bg-white border border-purple-100 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-all"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                إدارة كورساتي
              </h1>
              <p className="text-xs text-slate-400">
                عرض وتعديل ومتابعة الكورسات المرفوعة
              </p>
            </div>
          </div>

          <Link
            to="/teacher/add-course"
            className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة كورس جديد</span>
          </Link>
        </div>

        {/* شريط البحث */}
        <div className="relative">
          <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="ابحث عن كورس معين..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-purple-100 rounded-2xl py-3.5 pr-11 pl-4 text-xs font-bold focus:outline-none focus:border-[#7c3aed] shadow-xs"
          />
        </div>

        {/* عرض الكورسات */}
        {loading ? (
          <div className="text-center py-16 text-xs font-bold text-slate-400">
            جاري تحميل الكورسات...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] border border-purple-100 p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-purple-300 mx-auto" />
            <h3 className="font-black text-slate-700">
              لم يتم العثور على أي كورسات
            </h3>
            <p className="text-xs text-slate-400">
              ابدأ بنشر أول كورس لطلابك من خلال زر الإضافة بالأعلى.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-[2rem] border border-purple-100 p-6 shadow-sm flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#7c3aed] bg-purple-50 px-3 py-1 rounded-full">
                      {course.grade}
                    </span>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl">
                      {course.price} ج.م
                    </span>
                  </div>

                  <h2 className="text-base font-black text-slate-900">
                    {course.title}
                  </h2>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {course.description || "لا يوجد وصف للكورس"}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-[#7c3aed]" />
                      <span>{course.lessons?.length || 0} حصة</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#7c3aed]" />
                      <span>{course.studentsCount || 0} طالب</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/teacher/edit-course/${course.id}`}
                      className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-all"
                      title="تعديل الكورس"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteCourse(course.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all cursor-pointer"
                      title="حذف الكورس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherCourses;
