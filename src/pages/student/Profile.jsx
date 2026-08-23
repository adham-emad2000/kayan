import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  BookOpen,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const Profile = () => {
  const { userData, currentUser } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  useEffect(() => {
    const fetchEnrolled = async () => {
      if (!currentUser) return;
      const q = query(
        collection(db, "enrollments"),
        where("studentId", "==", currentUser.uid),
      );
      const snap = await getDocs(q);
      setEnrolledCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };
    fetchEnrolled();
  }, [currentUser]);

  return (
    <div className="bg-[#F7F4EF] min-h-screen py-8 px-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* بيانات الطالب */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-[#E6E1D6] shadow-sm flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-3xl font-black">
            {userData?.fullName?.charAt(0) || "م"}
          </div>
          <div>
            <h1 className="text-2xl font-black">{userData?.fullName}</h1>
            <p className="text-xs text-slate-500 font-bold">
              {userData?.grade}
            </p>
          </div>
        </div>

        {/* الكورسات الحقيقية */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-[#E6E1D6] shadow-sm space-y-6">
          <h3 className="font-black text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> كورساتي المشترك بها
          </h3>
          <div className="space-y-4">
            {enrolledCourses.map((c) => (
              <div
                key={c.id}
                className="bg-[#F7F4EF] p-5 rounded-2xl flex justify-between items-center"
              >
                <div>
                  <h4 className="font-black text-xs">{c.courseTitle}</h4>
                  <p className="text-[10px] text-slate-500">
                    من المعلم: {c.teacherName}
                  </p>
                </div>
                <span className="text-xs font-black text-green-700 bg-green-50 px-3 py-1 rounded-lg">
                  مفعل
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
