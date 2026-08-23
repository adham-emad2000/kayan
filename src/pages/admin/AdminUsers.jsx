import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Award,
  Search,
  Trash2,
  Phone,
  Mail,
  ShieldCheck,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";

const AdminUsers = () => {
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sSnap, tSnap] = await Promise.all([
        getDocs(collection(db, "students")),
        getDocs(collection(db, "teachers")),
      ]);

      setStudents(sSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setTeachers(tSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (collectionName, id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الحساب نهائياً؟")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (collectionName === "students") {
        setStudents(students.filter((s) => s.id !== id));
      } else {
        setTeachers(teachers.filter((t) => t.id !== id));
      }
      alert("تم حذف المستخدم بنجاح");
    } catch (err) {
      alert("فشل حذف المستخدم: " + err.message);
    }
  };

  const currentList = activeTab === "students" ? students : teachers;
  const filteredList = currentList.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm),
  );

  return (
    <div
      className="min-h-screen bg-[#070B19] text-slate-100 p-4 sm:p-8 font-sans relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/requests"
              className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center hover:text-white"
            >
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-white">
                إدارة المستخدمين والحسابات
              </h1>
              <p className="text-xs text-slate-400 font-bold">
                متابعة وإدارة حسابات الطلاب والمعلمين المسجلين
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              to="/admin/requests"
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>طلبات الإيصالات</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">
                {students.length}
              </div>
              <div className="text-xs font-bold text-slate-400">
                إجمالي الطلاب
              </div>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[2rem] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white">
                {teachers.length}
              </div>
              <div className="text-xs font-bold text-slate-400">
                إجمالي المعلمين
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/60 p-4 rounded-[2rem] border border-slate-800">
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("students")}
              className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${
                activeTab === "students"
                  ? "bg-blue-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              الطلاب ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("teachers")}
              className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${
                activeTab === "teachers"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              المعلمين ({teachers.length})
            </button>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث بالاسم، الإيميل، أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pr-11 pl-4 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-[2rem] p-6 overflow-x-auto shadow-xl">
          {loading ? (
            <div className="text-center py-16 text-indigo-400 font-bold">
              جاري جلب المستخدمين...
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-bold text-xs">
              لا توجد حسابات مطابقة للبحث.
            </div>
          ) : (
            <table className="w-full text-right">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-800">
                  <th className="pb-4">الاسم</th>
                  <th className="pb-4">البريد الإلكتروني</th>
                  <th className="pb-4">الهاتف</th>
                  <th className="pb-4">
                    {activeTab === "students" ? "الصف الدراسي" : "المادة"}
                  </th>
                  <th className="pb-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.map((user) => (
                  <tr
                    key={user.id}
                    className="text-xs font-bold text-slate-200"
                  >
                    <td className="py-4 font-black text-white">
                      {user.fullName}
                    </td>
                    <td className="py-4 font-mono text-slate-300">
                      {user.email}
                    </td>
                    <td className="py-4 font-mono" dir="ltr">
                      {user.phone || "--"}
                    </td>
                    <td className="py-4">
                      <span className="bg-slate-800 px-3 py-1 rounded-lg text-[11px] font-bold">
                        {activeTab === "students"
                          ? user.grade || "الصف الثالث الثانوي"
                          : user.subject || "عام"}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {user.phone && (
                          <a
                            href={`https://wa.me/2${user.phone}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 p-2 rounded-lg"
                            title="تواصل واتساب"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() =>
                            handleDeleteUser(
                              activeTab === "students"
                                ? "students"
                                : "teachers",
                              user.id,
                            )
                          }
                          className="bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 p-2 rounded-lg"
                          title="حذف الحساب"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
