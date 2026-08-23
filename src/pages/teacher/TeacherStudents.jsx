import React, { useState, useEffect } from "react";
import { Search, MessageSquare, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const TeacherStudents = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      const q = query(
        collection(db, "enrollments"),
        where("teacherId", "==", currentUser.uid),
      );
      const snap = await getDocs(q);
      const enrollments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // كل مستند enrollment هو اشتراك في كورس واحد (نفس الطالب ممكن يبقى
      // ليه أكتر من مستند لو مشترك في أكتر من كورس). هنا بنجمعهم حسب
      // studentId عشان "طلابي" تعرض كل طالب مرة واحدة بس، مع قائمة
      // بكل الكورسات اللي مشترك فيها، بدل ما تكرره صف لكل اشتراك.
      const grouped = new Map();
      enrollments.forEach((en) => {
        const key = en.studentId;
        if (!grouped.has(key)) {
          grouped.set(key, {
            studentId: en.studentId,
            studentName: en.studentName || "طالب",
            studentPhone: en.studentPhone || "",
            courseTitles: [],
          });
        }
        const entry = grouped.get(key);
        if (en.courseTitle && !entry.courseTitles.includes(en.courseTitle)) {
          entry.courseTitles.push(en.courseTitle);
        }
        // لو أي مستند من مستنداته فيه رقم تليفون ومكانش متسجل قبل كده
        if (!entry.studentPhone && en.studentPhone) {
          entry.studentPhone = en.studentPhone;
        }
      });

      setStudents(Array.from(grouped.values()));
    };
    fetchStudents();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-[#f4f1fb] p-8" dir="rtl">
      <h1 className="text-xl font-black mb-6">طلابي ({students.length})</h1>
      <div className="bg-white rounded-[2rem] p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="text-slate-400 text-xs border-b border-slate-100">
              <th className="pb-4">اسم الطالب</th>
              <th className="pb-4">الكورسات</th>
              <th className="pb-4 text-center">تواصل</th>
            </tr>
          </thead>
          <tbody>
            {students.map((st) => (
              <tr
                key={st.studentId}
                className="text-xs font-bold border-b border-slate-50"
              >
                <td className="py-4">{st.studentName}</td>
                <td className="py-4 space-y-1">
                  {st.courseTitles.length > 0 ? (
                    st.courseTitles.map((title) => (
                      <div key={title} className="text-slate-600">
                        {title}
                      </div>
                    ))
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="py-4 text-center">
                  {st.studentPhone ? (
                    <a
                      href={`https://wa.me/2${st.studentPhone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-green-600"
                    >
                      واتساب
                    </a>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default TeacherStudents;
