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
} from "lucide-react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  increment,
} from "firebase/firestore";

// كارت إحصائيات متوهج وبألوان تخطف العين
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
  // التبويب الرئيسي للوحة: 'enrollments' (اشتراكات الطلاب) أو 'withdrawals' (سحب أرباح المدرسين)
  const [mainTab, setMainTab] = useState("enrollments");

  const [enrollmentRequests, setEnrollmentRequests] = useState([]);
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
        const [reqSnap, withdrawSnap, tSnap, sSnap, cSnap] = await Promise.all([
          getDocs(collection(db, "enrollmentRequests")),
          getDocs(collection(db, "withdrawalRequests")),
          getDocs(collection(db, "teachers")),
          getDocs(collection(db, "students")),
          getDocs(collection(db, "courses")),
        ]);

        setEnrollmentRequests(
          reqSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
        setWithdrawalRequests(
          withdrawSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
        setStats({
          teachersCount: tSnap.size,
          studentsCount: sSnap.size,
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

        if (!reqSnap.exists()) {
          throw new Error("هذا الطلب لم يعد موجوداً.");
        }

        const reqData = reqSnap.data();

        if (reqData.status !== "pending") {
          throw new Error("تم معالجة هذا الطلب بالفعل من قبل.");
        }

        if (status === "approved") {
          // 👇 الإصلاح الثاني: لازم الـ ID يكون ثابت بالشكل
          // "{studentId}_{courseId}" مش ID عشوائي (auto-generated).
          // الـ Firestore Rules بتتحقق من وجود enrollment عن طريق
          // exists() على مسار متوقع بنفس الشكل ده (زي منطق userProgress)،
          // فلو استخدمنا doc(collection(db, "enrollments")) هيتولد ID
          // عشوائي والـ rule هترجع false دايمًا حتى لو الطالب مشترك فعلاً،
          // وهيتمنع من مشاهدة دروس الكورس رغم دفعه واعتماد طلبه.
          const enrollmentRef = doc(
            db,
            "enrollments",
            `${reqData.studentId}_${reqData.courseId}`,
          );
          transaction.set(enrollmentRef, {
            ...reqData,
            // 👇 الإصلاح الأول: لازم نحدد الـ status صراحةً هنا.
            // قبل كده كان بيتنسخ status: "pending" من reqData زي ما هو
            // (لأن reqData اتقرت قبل ما تتحدّث)، فكانت وثيقة enrollment
            // بتفضل "pending" للأبد حتى لو الطلب اتقبل فعلاً في
            // enrollmentRequests.
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

  // معالجة طلبات سحب أرباح المدرسين
  // ملاحظة: تمت إعادة كتابة الدالة دي بالكامل عشان تبقى Atomic ومتوافقة مع
  // نظام lockedBalance، بنفس منطق AdminWithdrawals.jsx بالظبط:
  // - بنقرا حالة الطلب "من جوه" الـ transaction عشان نتأكد إنه لسه pending
  //   (حماية من معالجة نفس الطلب مرتين لو حصل ضغط مزدوج أو أدمن تاني عالجه
  //   في نفس اللحظة، خصوصاً إن الشاشة دي بتقرأ البيانات بـ getDocs مرة واحدة
  //   مش onSnapshot).
  // - عند "القبول": الفلوس كانت أصلاً محجوزة (lockedBalance) وقت ما المدرس
  //   طلب السحب، فمش محتاجين نلمسها تاني — بس بنأكد حالة الطلب.
  // - عند "الرفض": بنرجّع المبلغ للرصيد المتاح عن طريق تنقيص lockedBalance،
  //   عشان المدرس يقدر يطلبه تاني أو يستخدمه في طلب سحب مختلف. (قبل كده
  //   الدالة كانت بتعمل updateDoc مباشر من غير ما تلمس lockedBalance خالص،
  //   فالفلوس المرفوضة كانت بتفضل محجوزة للأبد.)
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

        if (!reqSnap.exists()) {
          throw new Error("هذا الطلب لم يعد موجوداً.");
        }

        const reqData = reqSnap.data();

        if (reqData.status !== "pending") {
          throw new Error("تم معالجة هذا الطلب بالفعل من قبل.");
        }

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

  // إحصائيات اشتراكات الطلاب
  const pendingEnrollments = enrollmentRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const approvedEnrollments = enrollmentRequests.filter(
    (r) => r.status === "approved",
  ).length;
  const rejectedEnrollments = enrollmentRequests.filter(
    (r) => r.status === "rejected",
  ).length;

  // إحصائيات طلبات السحب للمدرسين
  const pendingWithdrawals = withdrawalRequests.filter(
    (r) => r.status === "pending",
  ).length;
  const approvedWithdrawals = withdrawalRequests.filter(
    (r) => r.status === "approved",
  ).length;
  const rejectedWithdrawals = withdrawalRequests.filter(
    (r) => r.status === "rejected",
  ).length;

  // الفلترة حسب التبويب الحالي والبحث
  const currentList =
    mainTab === "enrollments" ? enrollmentRequests : withdrawalRequests;

  const filtered = currentList.filter((r) => {
    const matchesStatus = r.status === activeTab;
    const searchLower = searchTerm.toLowerCase();

    if (mainTab === "enrollments") {
      return (
        matchesStatus &&
        (r.studentName?.toLowerCase().includes(searchLower) ||
          r.courseTitle?.toLowerCase().includes(searchLower) ||
          r.senderNumber?.includes(searchTerm))
      );
    } else {
      return (
        matchesStatus &&
        (r.teacherName?.toLowerCase().includes(searchLower) ||
          r.paymentMethod?.toLowerCase().includes(searchLower))
      );
    }
  });

  return (
    <div
      className="min-h-screen bg-[#070B19] text-slate-100 p-4 sm:p-8 font-sans relative overflow-hidden"
      dir="rtl"
    >
      {/* إضاءات خلفية ضخمة */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        {/* هيدر اللوحة */}
        <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
          <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl" />
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-1.5 rounded-full text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" /> لوحة تحكم السيستم المركزية
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              إدارة الطلبات والتحويلات المالية
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm font-bold">
              راقب اشتراكات الطلاب، وتابع طلبات سحب أرباح المدرسين بكل سهولة.
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
            label="مدرسين"
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
            icon={Wallet}
            label="سحوبات معلقة"
            value={pendingWithdrawals}
            gradient="from-emerald-600 to-teal-500"
            shadowColor="hover:shadow-emerald-500/10"
          />
        </div>

        {/* التبديل الرئيسي بين (اشتراكات الطلاب) و (طلبات سحب الأرباح) */}
        <div className="flex bg-slate-900/90 border border-slate-800 p-2 rounded-2xl gap-2">
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
            <span>طلبات اشتراكات الطلاب ({pendingEnrollments} معلق)</span>
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
            <span>طلبات سحب أرباح المدرسين ({pendingWithdrawals} معلق)</span>
          </button>
        </div>

        {/* شريط الفلترة الفرعي (قيد المراجعة / المقبولة / المرفوضة) والبحث */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900/60 backdrop-blur-xl p-4 rounded-[2.2rem] border border-slate-800">
          <div className="flex gap-2 w-full md:w-auto">
            {[
              {
                id: "pending",
                label: `قيد المراجعة (${mainTab === "enrollments" ? pendingEnrollments : pendingWithdrawals})`,
                activeColor: "bg-amber-500 text-slate-950 shadow-amber-500/25",
              },
              {
                id: "approved",
                label: `المقبولة (${mainTab === "enrollments" ? approvedEnrollments : approvedWithdrawals})`,
                activeColor:
                  "bg-emerald-500 text-slate-950 shadow-emerald-500/25",
              },
              {
                id: "rejected",
                label: `المرفوضة (${mainTab === "enrollments" ? rejectedEnrollments : rejectedWithdrawals})`,
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
                  ? "ابحث باسم الطالب، الكورس، أو الرقم..."
                  : "ابحث باسم المدرس أو طريقة الاستلام..."
              }
              className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl py-3.5 pr-12 pl-4 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* عرض المحتوى بناءً على التبويب النشط */}
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
          // عرض طلبات اشتراكات الطلاب
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 hover:border-indigo-500/40 p-6 rounded-[2.2rem] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-5 group"
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
                    <div className="absolute inset-0 bg-indigo-950/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-black backdrop-blur-xs">
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
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white py-3 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> قبول وتفعيل
                    </button>
                    <button
                      onClick={() => handleEnrollmentStatus(req, "rejected")}
                      disabled={processingId === req.id}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
                    {req.status === "approved"
                      ? "✨ تم اعتماد وتفعيل هذا الاشتراك"
                      : "❌ تم رفض هذا الطلب"}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // عرض طلبات سحب أرباح المدرسين
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="bg-slate-900/70 backdrop-blur-xl border border-slate-800/80 hover:border-emerald-500/40 p-6 rounded-[2.2rem] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between space-y-5 group"
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
                      <span className="line-clamp-1">
                        طريقة الاستلام والحساب:
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 font-mono font-bold text-emerald-300 bg-slate-950/80 p-3 rounded-xl border border-emerald-500/20 select-all"
                      dir="ltr"
                    >
                      <span>{req.paymentMethod}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      تاريخ الطلب:{" "}
                      {new Date(req.createdAt).toLocaleString("ar-EG")}
                    </div>
                  </div>
                </div>

                {req.status === "pending" ? (
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/60">
                    <button
                      onClick={() => handleWithdrawalStatus(req, "approved")}
                      disabled={processingId === req.id}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white py-3 rounded-xl font-black text-xs transition-all shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> تم التحويل وقبول
                    </button>
                    <button
                      onClick={() => handleWithdrawalStatus(req, "rejected")}
                      disabled={processingId === req.id}
                      className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-3 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
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
                    {req.status === "approved"
                      ? "✨ تم تحويل الأموال واعتماد السحب"
                      : "❌ تم رفض طلب السحب"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal معاينة الإيصال */}
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
