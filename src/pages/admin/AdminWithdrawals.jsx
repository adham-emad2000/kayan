import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  doc,
  runTransaction,
  increment,
} from "firebase/firestore";
import { CheckCircle, XCircle, Clock, Wallet } from "lucide-react";

const AdminWithdrawals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // اتحول من getDocs (قراءة مرة واحدة) لـ onSnapshot عشان لو أدمن تاني
  // عالج نفس الطلب من جهاز تاني في نفس اللحظة، الشاشة تتحدث لحظياً
  // بدل ما تفضل قديمة لحد ما تعمل refresh يدوي.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "withdrawalRequests"),
      (snap) => {
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRequests(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching withdrawal requests:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // تمت إعادة كتابة الدالة دي بالكامل عشان تبقى Atomic ومتوافقة مع نظام
  // lockedBalance الجديد:
  // - بنقرا حالة الطلب "من جوه" الـ transaction عشان نتأكد إنه لسه pending
  //   (حماية من معالجة نفس الطلب مرتين لو حصل ضغط مزدوج).
  // - عند "القبول": الفلوس كانت أصلاً محجوزة (lockedBalance) وقت ما المدرس
  //   طلب السحب، فمش محتاجين نلمسها تاني — بس بنأكد حالة الطلب.
  // - عند "الرفض": بنرجّع المبلغ للرصيد المتاح عن طريق تنقيص lockedBalance،
  //   عشان المدرس يقدر يطلبه تاني أو يستخدمه في طلب سحب مختلف.
  const updateStatus = async (req, newStatus) => {
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, "withdrawalRequests", req.id);
        const reqSnap = await transaction.get(reqRef);

        if (!reqSnap.exists()) {
          throw new Error("هذا الطلب لم يعد موجوداً.");
        }

        const reqData = reqSnap.data();

        if (reqData.status !== "pending") {
          throw new Error("تم معالجة هذا الطلب بالفعل من قبل.");
        }

        if (newStatus === "rejected" && reqData.teacherId) {
          const teacherRef = doc(db, "teachers", reqData.teacherId);
          transaction.update(teacherRef, {
            lockedBalance: increment(-(Number(reqData.amount) || 0)),
          });
        }

        transaction.update(reqRef, { status: newStatus });
      });

      alert("تم تحديث حالة الطلب بنجاح!");
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.message || "فشل تحديث حالة الطلب.");
    }
  };

  return (
    <div
      className="bg-white rounded-[2.5rem] p-8 border-2 border-blue-100 shadow-md space-y-6"
      dir="rtl"
    >
      <div className="flex items-center gap-3 border-b-2 border-blue-50 pb-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-900">
            طلبات سحب أرباح المعلمين
          </h2>
          <p className="text-xs text-slate-500 font-bold">
            مراجعة واعتماد طلبات السحب المالية
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm font-bold text-slate-500 py-6">
          جاري تحميل الطلبات...
        </p>
      ) : requests.length === 0 ? (
        <p className="text-center text-sm font-bold text-slate-500 py-6">
          لا توجد طلبات سحب حتى الآن.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 text-xs font-black text-slate-500">
                <th className="py-3 px-4">المعلم</th>
                <th className="py-3 px-4">المبلغ المطلوب</th>
                <th className="py-3 px-4">طريقة الاستلام / الحساب</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-800">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-4 font-black text-slate-900">
                    {req.teacherName}
                  </td>
                  <td className="py-4 px-4 text-blue-600 font-black">
                    {req.amount} ج.م
                  </td>
                  <td className="py-4 px-4 font-mono">{req.paymentMethod}</td>
                  <td className="py-4 px-4">
                    {req.status === "pending" && (
                      <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> قيد المراجعة
                      </span>
                    )}
                    {req.status === "approved" && (
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> تم التحويل
                      </span>
                    )}
                    {req.status === "rejected" && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[11px] font-black inline-flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> مرفوض
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    {req.status === "pending" && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateStatus(req, "approved")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer shadow-sm"
                        >
                          قبول (تم التحويل)
                        </button>
                        <button
                          onClick={() => updateStatus(req, "rejected")}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer shadow-sm"
                        >
                          رفض
                        </button>
                      </div>
                    )}
                    {req.status !== "pending" && (
                      <span className="text-slate-400 font-medium">
                        تمت المعالجة
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminWithdrawals;
