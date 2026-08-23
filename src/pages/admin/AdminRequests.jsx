import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Eye,
  X,
  Smartphone,
  BookOpen,
  User,
  GraduationCap,
  Users,
  Layers,
  Sparkles,
  Wallet,
  CreditCard,
  Award,
} from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  increment,
  updateDoc,
} from "firebase/firestore";

const StatCard = ({ icon: Icon, label, value, gradient, shadowColor }) => (
  <div
    className={`relative overflow-hidden bg-slate-900/85 backdrop-blur-xl border border-slate-800 p-6 rounded-[2.2rem] shadow-2xl ${shadowColor} hover:scale-[1.03] transition-all duration-300 group`}
  >
    <div
      className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${gradient}`}
    />

    <div className="relative z-10 flex items-center gap-4">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br ${gradient} text-white shadow-lg`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tight">
          {value}
        </div>
        <div className="text-xs font-bold text-slate-400 mt-1">{label}</div>
      </div>
    </div>
  </div>
);

const AdminRequests = () => {
  // mainTab ممكن يكون: 'enrollments' | 'teachers' | 'withdrawals'
  const [mainTab, setMainTab] = useState("enrollments");

  const [enrollmentRequests, setEnrollmentRequests] = useState([]);
  const [teacherRequests, setTeacherRequests] = useState([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [previewImage, setPreviewImage] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    teachersCount: 0,
    studentsCount: 0,
    coursesCount: 0,
  });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [reqSnap, tSnap, withdrawSnap, studentsSnap, cSnap] =
          await Promise.all([
            getDocs(collection(db, "enrollmentRequests")),
            getDocs(collection(db, "teachers")),
            getDocs(collection(db, "withdrawalRequests")),
            getDocs(collection(db, "students")),
            getDocs(collection(db, "courses")),
          ]);

        setEnrollmentRequests(
          reqSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );

        // جلب المدرسين الذين قاموا برفع إيصال وبانتظار الموافقة أو غير معتمدين
        const teachersList = tSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setTeacherRequests(teachersList);

        setWithdrawalRequests(
          withdrawSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );

        setStats({
          teachersCount: teachersList.filter((t) => t.isApproved).length,
          studentsCount: studentsSnap.size,
          coursesCount: cSnap.size,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // معالجة طلبات اشتراكات الطلاب
  const handleEnrollmentStatus = async (req, status) => {
    if (
      !window.confirm(
        `هل أنت متأكد من ${status === "approved" ? "قبول" : "رفض"} هذا الطلب؟`,
      )
    )
      return;

    setProcessingId(req.id);
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, "enrollmentRequests", req.id);
        const reqSnap = await transaction.get(reqRef);

        if (!reqSnap.exists()) throw new Error("هذا الطلب لم يعد موجوداً.");

        const reqData = reqSnap.data();
        if (reqData.status !== "pending")
          throw new Error("تم معالجة هذا الطلب بالفعل من قبل.");

        if (status === "approved") {
          const enrollmentRef = doc(
            db,
            "enrollments",
            `${reqData.studentId}_${reqData.courseId}`,
          );
          transaction.set(enrollmentRef, {
            ...reqData,
            status: "approved",
            enrolledAt: new Date().toISOString(),
          });

          if (reqData.teacherId) {
            const teacherRef = doc(db, "teachers", reqData.teacherId);
            transaction.update(teacherRef, {
              totalEarnings: increment(Number(reqData.amount) || 0),
            });
          }
        }

        transaction.update(reqRef, {
          status,
          processedAt: new Date().toISOString(),
        });
      });

      setEnrollmentRequests((prev) =>
        prev.map((item) => (item.id === req.id ? { ...item, status } : item)),
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setProcessingId(null);
    }
  };

  // معالجة تفعيل حسابات المدرسين (اشتراك الـ 200 ج.م)
  const handleTeacherApproval = async (teacher, status) => {
    if (
      !window.confirm(
        `هل أنت متأكد من ${status === "approved" ? "قبول وتفعيل حساب" : "رفض"} المدرس ${teacher.fullName}؟`,
      )
    )
      return;

    setProcessingId(teacher.id);
    try {
      const teacherRef = doc(db, "teachers", teacher.id);
      await updateDoc(teacherRef, {
        isApproved: status === "approved",
        subscriptionStatus: status === "approved" ? "active" : "rejected",
        processedAt: new Date().toISOString(),
      });

      setTeacherRequests((prev) =>
        prev.map((t) =>
          t.id === teacher.id
            ? {
                ...t,
                isApproved: status === "approved",
                subscriptionStatus:
                  status === "approved" ? "active" : "rejected",
              }
            : t,
        ),
      );
      alert(
        status === "approved" ? "تم تفعيل حساب المدرس بنجاح!" : "تم رفض الطلب.",
      );
    } catch (e) {
      alert("حدث خطأ: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  // معالجة طلبات سحب أرباح المدرسين
  const handleWithdrawalStatus = async (req, status) => {
    if (
      !window.confirm(
        `هل أنت متأكد من ${status === "approved" ? "قبول وتحويل" : "رفض"} طلب السحب هذا؟`,
      )
    )
      return;

    setProcessingId(req.id);
    try {
      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, "withdrawalRequests", req.id);
        const reqSnap = await transaction.get(reqRef);

        if (!reqSnap.exists()) throw new Error("هذا الطلب لم يعد موجوداً.");

        const reqData = reqSnap.data();
        if (reqData.status !== "pending")
          throw new Error("تم معالجة هذا الطلب بالفعل من قبل.");

        if (status === "rejected" && reqData.teacherId) {
          const teacherRef = doc(db, "teachers", reqData.teacherId);
          transaction.update(teacherRef, {
            lockedBalance: increment(-(Number(reqData.amount) || 0)),
          });
        }

        transaction.update(reqRef, {
          status,
          processedAt: new Date().toISOString(),
        });
      });

      setWithdrawalRequests((prev) =>
        prev.map((item) => (item.id === req.id ? { ...item, status } : item)),
      );
      alert("تم تحديث حالة طلب السحب بنجاح!");
    } catch (e) {
      alert(e.message || "حدث خطأ أثناء تحديث الطلب.");
    } finally {
      setProcessingId(null);
    }
  };

  // إحصائيات الأقسام
  const pendingEnrollments = enrollmentRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const approvedEnrollments = enrollmentRequests.filter(
    (r) => r.status === "approved",
  ).length;
  const rejectedEnrollments = enrollmentRequests.filter(
    (r) => r.status === "rejected",
  ).length;

  const pendingTeachers = teacherRequests.filter(
    (t) => !t.isApproved && t.receiptUrl,
  ).length;
  const approvedTeachers = teacherRequests.filter((t) => t.isApproved).length;
  const rejectedTeachers = teacherRequests.filter(
    (t) => !t.isApproved && t.subscriptionStatus === "rejected",
  ).length;

  const pendingWithdrawals = withdrawalRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const approvedWithdrawals = withdrawalRequests.filter(
    (r) => r.status === "approved",
  ).length;
  const rejectedWithdrawals = withdrawalRequests.filter(
    (r) => r.status === "rejected",
  ).length;

  // تحديد القائمة المعروضة حسب التبويب الرئيسي
  const getFilteredList = () => {
    if (mainTab === "enrollments") {
      return enrollmentRequests.filter((r) => {
        const matchesStatus = r.status === activeTab;
        const searchLower = searchTerm.toLowerCase();
        return (
          matchesStatus &&
          (r.studentName?.toLowerCase().includes(searchLower) ||
            r.courseTitle?.toLowerCase().includes(searchLower) ||
            r.senderNumber?.includes(searchTerm))
        );
      });
    } else if (mainTab === "teachers") {
      return teacherRequests.filter((t) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          t.fullName?.toLowerCase().includes(searchLower) ||
          t.email?.toLowerCase().includes(searchLower) ||
          t.subject?.toLowerCase().includes(searchLower);

        if (activeTab === "pending")
          return !t.isApproved && t.receiptUrl && matchesSearch;
        if (activeTab === "approved") return t.isApproved && matchesSearch;
        if (activeTab === "rejected")
          return (
            !t.isApproved &&
            t.subscriptionStatus === "rejected" &&
            matchesSearch
          );
        return false;
      });
    } else {
      return withdrawalRequests.filter((r) => {
        const matchesStatus = r.status === activeTab;
        const searchLower = searchTerm.toLowerCase();
        return (
          matchesStatus &&
          (r.teacherName?.toLowerCase().includes(searchLower) ||
            r.paymentMethod?.toLowerCase().includes(searchLower))
        );
      });
    }
  };

  const filtered = getFilteredList();

  return (
    <div
      className="min-h-screen bg-[#070B19] text-slate-100 p-4 sm:p-8 font-sans relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" /> لوحة تحكم السيستم المركزية
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              إدارة الطلبات والتحويلات المالية
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-bold">
              راقب اشتراكات الطلاب، تفعيل حسابات المدرسين، وطلبات السحب بكل
              سهولة.
            </p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-xl shadow-blue-600/30 shrink-0 border border-indigo-400/30 z-10">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        {/* كروت الإحصائيات العامة */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={GraduationCap}
            label="مدرسين مفعلين"
            value={stats.teachersCount}
            gradient="from-blue-600 to-cyan-500"
            shadowColor="hover:shadow-blue-500/10"
          />
          <StatCard
            icon={Users}
            label="طلاب"
            value={stats.studentsCount}
            gradient="from-purple-600 to-fuchsia-500"
            shadowColor="hover:shadow-purple-500/10"
          />
          <StatCard
            icon={Layers}
            label="كورسات"
            value={stats.coursesCount}
            gradient="from-amber-600 to-orange-500"
            shadowColor="hover:shadow-amber-500/10"
          />
          <StatCard
            icon={Clock}
            label="اشتراكات معلقة"
            value={pendingEnrollments}
            gradient="from-indigo-600 to-violet-500"
            shadowColor="hover:shadow-indigo-500/10"
          />
          <StatCard
            icon={Award}
            label="مدرسين بانتظار التفعيل"
            value={pendingTeachers}
            gradient="from-rose-600 to-pink-500"
            shadowColor="hover:shadow-rose-500/10"
          />
        </div>

        {/* التبديل الرئيسي */}
        <div className="flex flex-col sm:flex-row bg-slate-900/90 border border-slate-800 p-2 rounded-2xl gap-2">
          <button
            onClick={() => {
              setMainTab("enrollments");
              setActiveTab("pending");
            }}
            className={`flex-1 py-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mainTab === "enrollments"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>اشتراكات الطلاب ({pendingEnrollments} معلق)</span>
          </button>

          <button
            onClick={() => {
              setMainTab("teachers");
              setActiveTab("pending");
            }}
            className={`flex-1 py-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mainTab === "teachers"
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>تفعيل المدرسين ({pendingTeachers} بانتظار الإيصال)</span>
          </button>

          <button
            onClick={() => {
              setMainTab("withdrawals");
              setActiveTab("pending");
            }}
            className={`flex-1 py-4 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mainTab === "withdrawals"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800/40"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>سحوبات المدرسين ({pendingWithdrawals} معلق)</span>
          </button>
        </div>

        {/* شريط الفلترة والبحث */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 backdrop-blur-xl p-4 rounded-[2.2rem] border border-slate-800">
          <div className="flex gap-2 w-full md:w-auto">
            {[
              {
                id: "pending",
                label: `قيد المراجعة (${
                  mainTab === "enrollments"
                    ? pendingEnrollments
                    : mainTab === "teachers"
                      ? pendingTeachers
                      : pendingWithdrawals
                })`,
                activeColor: "bg-amber-500 text-slate-950 shadow-amber-500/25",
              },
              {
                id: "approved",
                label: `المقبولة (${
                  mainTab === "enrollments"
                    ? approvedEnrollments
                    : mainTab === "teachers"
                      ? approvedTeachers
                      : approvedWithdrawals
                })`,
                activeColor:
                  "bg-emerald-500 text-slate-950 shadow-emerald-500/25",
              },
              {
                id: "rejected",
                label: `المرفوضة (${
                  mainTab === "enrollments"
                    ? rejectedEnrollments
                    : mainTab === "teachers"
                      ? rejectedTeachers
                      : rejectedWithdrawals
                })`,
                activeColor: "bg-rose-500 text-white shadow-rose-500/25",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 md:flex-initial px-5 py-3 rounded-2xl font-black text-xs transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? `${tab.activeColor} shadow-lg scale-105`
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                mainTab === "enrollments"
                  ? "ابحث باسم الطالب أو الكورس..."
                  : mainTab === "teachers"
                    ? "ابحث باسم المدرس أو المادة..."
                    : "ابحث باسم المدرس أو طريقة الاستلام..."
              }
              className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl py-3.5 pr-12 pl-4 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-indigo-400 font-black animate-pulse text-base">
            جاري مزامنة البيانات والطلبات...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-[2.5rem] p-16 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-black text-slate-300">
              لا توجد طلبات مطابقة في هذا القسم حالياً
            </h3>
          </div>
        ) : mainTab === "enrollments" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 hover:border-indigo-500/40 p-6 rounded-[2.2rem] shadow-xl transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                    <span className="text-[11px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-xl uppercase">
                      {req.paymentMethod === "vodafone"
                        ? "فودافون كاش"
                        : "InstaPay"}
                    </span>
                    <span className="font-black text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                      {req.amount} ج.م
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-black text-white text-sm">
                      <User className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="line-clamp-1">{req.studentName}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-slate-300">
                      <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="line-clamp-1">{req.courseTitle}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>المحول منه: {req.senderNumber}</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setPreviewImage(req.receiptUrl)}
                    className="relative h-36 w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer group/img"
                  >
                    <img
                      src={req.receiptUrl}
                      alt="إيصال"
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-indigo-950/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-black">
                      <Eye className="w-4 h-4 text-indigo-300" />
                      <span>معاينة كاملة للإيصال</span>
                    </div>
                  </div>
                </div>

                {req.status === "pending" ? (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
                    <button
                      onClick={() => handleEnrollmentStatus(req, "approved")}
                      disabled={processingId === req.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> قبول وتفعيل
                    </button>
                    <button
                      onClick={() => handleEnrollmentStatus(req, "rejected")}
                      disabled={processingId === req.id}
                      className="bg-rose-500/10 text-rose-400 border border-rose-500/20 py-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> رفض
                    </button>
                  </div>
                ) : (
                  <div
                    className={`text-center py-2.5 text-xs font-black rounded-xl border ${
                      req.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {req.status === "approved" ? "✨ تم الاعتماد" : "❌ مرفوض"}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : mainTab === "teachers" ? (
          // عرض طلبات تفعيل المدرسين ورفع إيصال الـ 200 ج.م
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 hover:border-rose-500/40 p-6 rounded-[2.2rem] shadow-xl transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                    <span className="text-[11px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-xl uppercase">
                      اشتراك مدرس (200 ج.م)
                    </span>
                    <span className="font-black text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                      {t.paymentMethod || "تحويل بنكي"}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-black text-white text-sm">
                      <User className="w-4 h-4 text-rose-400 shrink-0" />
                      <span className="line-clamp-1">{t.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-slate-300">
                      <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>المادة: {t.subject}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-slate-300">
                      <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>الهاتف: {t.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono font-bold text-slate-200 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                      <span>المحول منه: {t.senderInfo || "غير مدخل"}</span>
                    </div>
                  </div>

                  {t.receiptUrl ? (
                    <div
                      onClick={() => setPreviewImage(t.receiptUrl)}
                      className="relative h-36 w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer group/img"
                    >
                      <img
                        src={t.receiptUrl}
                        alt="إيصال المدرس"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-rose-950/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-black">
                        <Eye className="w-4 h-4 text-rose-300" />
                        <span>معاينة إيصال المدرس</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 bg-slate-950 rounded-2xl border border-dashed border-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold">
                      لم يتم رفع إيصال بعد
                    </div>
                  )}
                </div>

                {!t.isApproved ? (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
                    <button
                      onClick={() => handleTeacherApproval(t, "approved")}
                      disabled={processingId === t.id || !t.receiptUrl}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> موافقة وتفعيل
                    </button>
                    <button
                      onClick={() => handleTeacherApproval(t, "rejected")}
                      disabled={processingId === t.id}
                      className="bg-rose-500/10 text-rose-400 border border-rose-500/20 py-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> رفض
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2.5 text-xs font-black rounded-xl border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    ✨ حساب مدرس مُفعل ونشط
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 hover:border-emerald-500/40 p-6 rounded-[2.2rem] shadow-xl transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
                    <span className="text-[11px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl uppercase">
                      طلب سحب أرباح
                    </span>
                    <span className="font-black text-base text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-xl font-mono">
                      {req.amount} ج.م
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2 font-black text-white text-sm">
                      <User className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="line-clamp-1">{req.teacherName}</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-slate-300">
                      <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>طريقة الاستلام:</span>
                    </div>
                    <div
                      className="flex items-center gap-2 font-mono font-bold text-emerald-300 bg-slate-950/80 p-3 rounded-xl border border-emerald-500/20 select-all"
                      dir="ltr"
                    >
                      <span>{req.paymentMethod}</span>
                    </div>
                  </div>
                </div>

                {req.status === "pending" ? (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
                    <button
                      onClick={() => handleWithdrawalStatus(req, "approved")}
                      disabled={processingId === req.id}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> تم التحويل وقبول
                    </button>
                    <button
                      onClick={() => handleWithdrawalStatus(req, "rejected")}
                      disabled={processingId === req.id}
                      className="bg-rose-500/10 text-rose-400 border border-rose-500/20 py-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> رفض
                    </button>
                  </div>
                ) : (
                  <div
                    className={`text-center py-2.5 text-xs font-black rounded-xl border ${
                      req.status === "approved"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}
                  >
                    {req.status === "approved" ? "✨ تم الاعتماد" : "❌ مرفوض"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative bg-slate-900 border border-slate-800 rounded-[2.5rem] p-5 max-w-xl w-full max-h-[90vh] flex flex-col items-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-5 left-5 bg-slate-800 hover:bg-rose-500 hover:text-white p-2.5 rounded-2xl text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-white mb-4">
              صورة إيصال التحويل الأصلية
            </h3>
            <div className="w-full max-h-[75vh] overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-2">
              <img
                src={previewImage}
                alt="إيصال مكبر"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
