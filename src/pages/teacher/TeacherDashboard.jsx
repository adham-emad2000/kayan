import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Plus,
  DollarSign,
  Video,
  Trash2,
  Eye,
  Loader2,
  Sun,
  Moon,
  Search,
  Bell,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  Wifi,
  CheckSquare,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";

// خط ونظام ألوان مشتركين مع باقي صفحات المنصة (نفس التوكنز المستخدمة في
// Dashboard.jsx بالظبط) — الأفضل ينقلوا لملف مشترك واحد (مثلاً
// useAppTheme.js) بدل ما يتكرروا في كل صفحة، هنا مكررين عشان الملف
// يشتغل مستقل بذاته.
const useLinearFont = () => {
  useEffect(() => {
    const id = "ibm-plex-arabic-font";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);
};

const THEME_TOKENS_CSS = `
:root, [data-theme="dark"] {
  --bg-base: #0B0C0F;
  --bg-panel: #0D0E12;
  --bg-panel-alt: #131417;
  --bg-hover: #151619;
  --bg-card: #111216;
  --bg-active: #1A1B20;
  --border-sidebar: #1B1C21;
  --border: #1E1F24;
  --border-strong: #232429;
  --border-hover: #2A2B31;
  --text-disabled: #33343A;
  --text-faint: #54555C;
  --text-muted: #6B6C74;
  --text-secondary: #9A9BA3;
  --text-primary: #ECECEE;
  --accent: #6C7BFF;
  --accent-soft: #6C7BFF1A;
  --success: #3DD68C;
  --success-soft: #3DD68C1A;
  --warning: #F2B84B;
  --danger: #F2637B;
  --violet: #B18CF8;
}

[data-theme="light"] {
  --bg-base: #F7F7FA;
  --bg-panel: #FFFFFF;
  --bg-panel-alt: #F4F4F6;
  --bg-hover: #F4F4F6;
  --bg-card: #FFFFFF;
  --bg-active: #EEEEF1;
  --border-sidebar: #ECECEF;
  --border: #ECECEF;
  --border-strong: #D6D6DB;
  --border-hover: #C4C4CB;
  --text-disabled: #C4C4CB;
  --text-faint: #9A9BA3;
  --text-muted: #6B6C74;
  --text-secondary: #52525B;
  --text-primary: #18181B;
  --accent: #5A62E8;
  --accent-soft: #5A62E814;
  --success: #16A34A;
  --success-soft: #16A34A14;
  --warning: #C2790A;
  --danger: #E11D48;
  --violet: #8B5CF6;
}
`;

// باليتة تدرجات لونية ترسم على رأس كل كارت كورس بديلاً عن الصور التجريدية
// في المرجع - بترجع بنفس الترتيب دايماً حسب index الكورس (تجميلي بحت، مفيش
// بيانات جديدة بتتجاب).
const THUMB_GRADIENTS = [
  "from-orange-400 via-rose-400 to-red-500",
  "from-indigo-500 via-blue-500 to-cyan-400",
  "from-amber-400 via-orange-300 to-yellow-500",
  "from-emerald-400 via-teal-400 to-cyan-500",
  "from-fuchsia-500 via-purple-500 to-indigo-500",
  "from-lime-400 via-emerald-400 to-teal-500",
];

const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("kayan-theme") || "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    const id = "kayan-theme-tokens";
    if (!document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.textContent = THEME_TOKENS_CSS;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("kayan-theme", theme);
    } catch {
      // localStorage غير متاح — التبديل هيشتغل للجلسة الحالية بس
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  return [theme, toggleTheme];
};

const ThemeToggle = ({ theme, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    title={theme === "dark" ? "التبديل للوضع الفاتح" : "التبديل للوضع الداكن"}
    className="w-11 h-11 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors shrink-0"
  >
    {theme === "dark" ? (
      <Sun className="w-4.5 h-4.5" />
    ) : (
      <Moon className="w-4.5 h-4.5" />
    )}
  </button>
);

// ---------------------------------------------------------------------------
// كارت المدرس (ستايل فيزا/بطاقة ائتمان) — كل البيانات اللي جواه (الاسم،
// المادة، عدد الكورسات، عدد الطلاب) موجودة أصلاً في userData/courses/
// studentsCount اللي بتتجاب فوق، مفيش أي كويري جديدة.
const TeacherVisaCard = ({ userData, coursesCount, studentsCount }) => {
  const initials = (userData?.fullName || "م")
    .trim()
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div className="relative rounded-[1.75rem] overflow-hidden p-6 bg-gradient-to-br from-[#5A62E8] via-[#6C7BFF] to-[#8B5CF6] text-white shadow-lg shadow-indigo-500/20">
      {/* زخارف دائرية خلفية */}
      <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -right-8 -bottom-14 w-44 h-44 rounded-full bg-black/10 blur-2xl" />

      <div className="relative z-10 flex items-center justify-between mb-8">
        <Wifi className="w-6 h-6 text-white/70 rotate-90" />
        <span className="text-[11px] font-bold tracking-widest text-white/70">
          كيان TEACHER
        </span>
      </div>

      <div className="relative z-10 flex items-center gap-3 mb-7">
        {userData?.photoURL || userData?.avatarUrl ? (
          <img
            src={userData.photoURL || userData.avatarUrl}
            alt={userData?.fullName}
            className="w-12 h-12 rounded-2xl object-cover border-2 border-white/40"
          />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center font-black text-lg">
            {initials}
          </div>
        )}
        <div>
          <p className="font-bold text-[15px] leading-tight">
            {userData?.fullName || "مدرس المنصة"}
          </p>
          <p className="text-white/70 text-[11px]">
            {userData?.subject || "المادة"}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-[10px]">الكورسات</p>
          <p className="font-black text-lg tabular-nums">{coursesCount}</p>
        </div>
        <div>
          <p className="text-white/60 text-[10px]">الطلاب</p>
          <p className="font-black text-lg tabular-nums">{studentsCount}</p>
        </div>
        <div>
          <p className="text-white/60 text-[10px]">العضوية</p>
          <p className="font-black text-[13px]">مدرس موثّق</p>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// كاليندر ديكوري بسيط للشهر الحالي — تنقل بين الشهور بحالة محلية فقط،
// مفيش أي اتصال ببيانات أو كويريز.
const ARABIC_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];
const ARABIC_DAY_LETTERS = ["ح", "ن", "ث", "ر", "خ", "ج", "س"];

const MiniCalendar = () => {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const goPrev = () => setViewDate(new Date(year, month - 1, 1));
  const goNext = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrev}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <p className="font-bold text-[13px] text-[var(--text-primary)]">
          {ARABIC_MONTHS[month]} {year}
        </p>
        <button
          onClick={goNext}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {ARABIC_DAY_LETTERS.map((d, i) => (
          <span
            key={i}
            className="text-[10px] font-bold text-[var(--text-faint)]"
          >
            {d}
          </span>
        ))}
        {cells.map((d, i) =>
          d === null ? (
            <span key={i} />
          ) : (
            <span
              key={i}
              className={`mx-auto w-7 h-7 flex items-center justify-center rounded-full text-[11px] font-semibold transition-colors ${
                isToday(d)
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {d}
            </span>
          ),
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// سلايدر الإشعارات — بيجمع 3 أنواع أحداث (اشتراك طالب جديد / تسليم واجب /
// حل امتحان) في قائمة واحدة مرتبة بالأحدث، وكل إشعار قابل للضغط فيفتح
// صفحة تفاصيل الكورس على التاب المناسب مباشرة.
const NOTIF_ICONS = {
  enroll: {
    Icon: UserPlus,
    cls: "bg-[var(--success-soft)] text-[var(--success)]",
  },
  homework: {
    Icon: CheckSquare,
    cls: "bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-[var(--warning)]",
  },
  quiz: {
    Icon: HelpCircle,
    cls: "bg-[var(--accent-soft)] text-[var(--accent)]",
  },
};

const NotificationsSlider = ({
  notifications,
  loading,
  onNotificationClick,
}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= notifications.length) setIndex(0);
  }, [notifications.length, index]);

  const goPrev = () =>
    setIndex((i) => (i === 0 ? notifications.length - 1 : i - 1));
  const goNext = () =>
    setIndex((i) => (i === notifications.length - 1 ? 0 : i + 1));

  return (
    <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-[13px] text-[var(--text-primary)] flex items-center gap-2">
          <Bell className="w-4 h-4 text-[var(--accent)]" />
          آخر الإشعارات
        </h3>
        {notifications.length > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={goNext}
              className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 justify-center py-6 text-[var(--text-muted)] text-[12px]">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          جاري التحميل...
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-6 text-center text-[var(--text-muted)] text-[12px]">
          لسه مفيش أي نشاط جديد
        </div>
      ) : (
        <>
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(${index * 100}%)` }}
            >
              {notifications.map((n) => {
                const { Icon, cls } = NOTIF_ICONS[n.type] || NOTIF_ICONS.enroll;
                const label =
                  n.type === "homework"
                    ? `${n.studentName} سلّم واجب`
                    : n.type === "quiz"
                      ? `${n.studentName} حل امتحان`
                      : `${n.studentName} اشترك في كورس`;
                return (
                  <button
                    key={n.id}
                    onClick={() => onNotificationClick?.(n)}
                    className="w-full shrink-0 flex gap-3 text-right cursor-pointer"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-[var(--text-primary)] line-clamp-1">
                        {label}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                        {n.courseTitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {notifications.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-4">
              {notifications.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index
                      ? "w-4 bg-[var(--accent)]"
                      : "w-1.5 bg-[var(--border-strong)]"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TeacherDashboard = () => {
  useLinearFont();
  const [theme, toggleTheme] = useTheme();
  const navigate = useNavigate();

  const { currentUser, userData } = useAuth();

  const [courses, setCourses] = useState([]);
  const [studentsCount, setStudentsCount] = useState(0);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  // مصدر الأرباح الوحيد والموثوق: حقل totalEarnings الجاهز على مستند
  // المعلم نفسه (نفس المصدر المستخدم في TeacherEarnings.jsx و Navbar.jsx).
  const totalEarnings = userData?.totalEarnings || 0;

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      try {
        const coursesQuery = query(
          collection(db, "courses"),
          where("teacherId", "==", currentUser.uid),
        );
        const coursesSnap = await getDocs(coursesQuery);
        const coursesList = coursesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCourses(coursesList);

        const enrollmentsQuery = query(
          collection(db, "enrollments"),
          where("teacherId", "==", currentUser.uid),
        );
        const enrollmentsSnap = await getDocs(enrollmentsQuery);
        // كل مستند enrollment هو اشتراك في كورس واحد، فلو نفس الطالب مشترك
        // في أكتر من كورس هيبقى ليه أكتر من مستند - بنعمل Set على studentId
        // عشان العدد يبقى عدد الطلاب الفريدين فعلاً مش عدد الاشتراكات.
        const uniqueStudentIds = new Set(
          enrollmentsSnap.docs.map((d) => d.data().studentId),
        );
        setStudentsCount(uniqueStudentIds.size);

        // بناء قائمة إشعارات موحدة من 3 مصادر: اشتراكات جديدة، تسليم واجبات،
        // وحل امتحانات - كل واحدة ليها كويري خاصة بيها فلترة بـ teacherId
        // (نفس فيلد teacherId المتوفر أصلاً على enrollments، وبقى متوفر
        // كمان على homeworkSubmissions/quizResults بعد إضافته وقت الحفظ في
        // CoursePlayer.jsx). كل عنصر بيحمل courseId عشان لما ندوس عليه
        // نقدر نروح لتفاصيل الكورس على التاب الصح.
        const getCourseTitle = (data) =>
          data.courseTitle ||
          coursesList.find((c) => c.id === data.courseId)?.title ||
          "أحد كورساتك";
        const getTime = (data) => {
          if (data.createdAt?.toMillis) return data.createdAt.toMillis();
          if (data.submittedAt)
            return new Date(data.submittedAt).getTime() || 0;
          return 0;
        };

        const enrollEvents = enrollmentsSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: `enroll_${docSnap.id}`,
            type: "enroll",
            studentName: data.studentName || data.fullName || "طالب جديد",
            courseTitle: getCourseTitle(data),
            courseId: data.courseId,
            createdAt: getTime(data),
          };
        });

        let homeworkEvents = [];
        let quizEvents = [];
        try {
          const hwQuery = query(
            collection(db, "homeworkSubmissions"),
            where("teacherId", "==", currentUser.uid),
          );
          const hwSnap = await getDocs(hwQuery);
          homeworkEvents = hwSnap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: `hw_${docSnap.id}`,
              type: "homework",
              studentName: data.studentName || "طالب",
              courseTitle: getCourseTitle(data),
              courseId: data.courseId,
              createdAt: getTime(data),
            };
          });

          const quizQuery = query(
            collection(db, "quizResults"),
            where("teacherId", "==", currentUser.uid),
          );
          const quizSnap = await getDocs(quizQuery);
          quizEvents = quizSnap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: `quiz_${docSnap.id}`,
              type: "quiz",
              studentName: data.studentName || "طالب",
              courseTitle: getCourseTitle(data),
              courseId: data.courseId,
              createdAt: getTime(data),
            };
          });
        } catch (e) {
          // لسه ممكن مفيش نتائج واجبات/امتحانات مسجلة بـ teacherId (بيانات
          // قديمة قبل إضافة الفيلد) - مش بيوقف الداشبورد.
          console.log("No homework/quiz activity yet:", e);
        }

        const combinedEvents = [
          ...enrollEvents,
          ...homeworkEvents,
          ...quizEvents,
        ]
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 10);
        setEnrollments(combinedEvents);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [currentUser]);

  const handleNotificationClick = (notification) => {
    if (!notification.courseId) return;
    const tab =
      notification.type === "homework"
        ? "homework"
        : notification.type === "quiz"
          ? "quizzes"
          : "students";
    navigate(`/teacher/course/${notification.courseId}/students?tab=${tab}`);
  };

  const handleDelete = async (e, id) => {
    e.preventDefault();
    if (deletingId) return;
    if (!window.confirm("متأكد من رغبتك في حذف هذا الكورس؟")) return;

    setDeleteError("");
    setDeletingId(id);

    try {
      // ملاحظة: الأمان الحقيقي هنا لازم يكون على مستوى Firestore Security
      // Rules، مش على الفرونت بس.
      await deleteDoc(doc(db, "courses", id));
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete course:", error);
      setDeleteError("تعذّر حذف الكورس، برجاء المحاولة مرة أخرى.");
    } finally {
      setDeletingId(null);
    }
  };

  const fontStyle = {
    fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', sans-serif",
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] pb-20"
      dir="rtl"
      style={fontStyle}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-8">
        {/* الهيدر العلوي: ترحيب + بحث + إشعارات */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              أهلاً بك، {userData?.fullName?.split(" ")[0]}
              <span>👋</span>
            </h1>
            <p className="text-[var(--text-muted)] text-[13px] mt-1">
              مدرس {userData?.subject || "المادة"} — يلا نضيف حاجة جديدة
              النهاردة
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-[var(--text-faint)] absolute right-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="دور على أي حاجة..."
                className="w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl py-3 pr-11 pl-4 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-faint)] outline-none focus:border-[var(--border-hover)] transition-colors"
              />
            </div>
            <button className="relative w-11 h-11 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0">
              <Bell className="w-4.5 h-4.5" />
              {enrollments.length > 0 && (
                <span className="absolute -top-1 -left-1 w-4.5 h-4.5 rounded-full bg-[var(--danger)] text-white text-[9px] font-bold flex items-center justify-center">
                  {enrollments.length}
                </span>
              )}
            </button>
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>

        {/* تخطيط عمودين: المحتوى الرئيسي + سايد بار زي المرجع */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* العمود الرئيسي */}
          <div>
            {/* بانر ملون: دعوة لإنشاء كورس جديد */}
            <Link
              to="/teacher/add-course"
              className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-l from-orange-500 via-rose-500 to-red-500 p-8 sm:p-10 flex items-center justify-between mb-10 group"
            >
              <div className="absolute -left-10 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10 max-w-md">
                <h2 className="text-white text-xl sm:text-2xl font-bold mb-2">
                  جاهز تضيف كورس جديد؟
                </h2>
                <p className="text-white/80 text-[13px] mb-5">
                  شارك خبرتك مع الطلاب — أضف كورس جديد وابدأ الشرح من أول حصة.
                </p>
                <span className="inline-flex items-center gap-2 bg-white text-slate-900 font-bold text-[13px] px-5 py-2.5 rounded-xl group-hover:bg-white/90 transition-colors">
                  <Plus className="w-4 h-4" /> إنشاء كورس جديد
                </span>
              </div>
              <Sparkles className="w-16 h-16 text-white/25 relative z-10 hidden sm:block" />
            </Link>

            {/* كروت الإحصائيات */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <Link
                to="/teacher/courses"
                className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[var(--border-hover)] transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {courses.length}
                  </p>
                  <p className="text-[var(--text-muted)] text-[11px]">
                    الكورسات
                  </p>
                </div>
              </Link>
              <Link
                to="/teacher/students"
                className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[var(--border-hover)] transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {studentsCount}
                  </p>
                  <p className="text-[var(--text-muted)] text-[11px]">الطلاب</p>
                </div>
              </Link>
              <Link
                to="/teacher/earnings"
                className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[var(--border-hover)] transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-[var(--warning)] flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)] tabular-nums">
                    {totalEarnings}
                  </p>
                  <p className="text-[var(--text-muted)] text-[11px]">
                    الأرباح (ج.م)
                  </p>
                </div>
              </Link>
            </div>

            {/* قسم الكورسات المنشورة */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                كورساتك
              </h2>
              <div className="flex items-center gap-3">
                {deleteError && (
                  <p className="text-[11px] font-medium text-[var(--danger)] bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] px-3 py-1.5 rounded-md">
                    {deleteError}
                  </p>
                )}
                <Link
                  to="/teacher/courses"
                  className="text-[var(--accent)] text-[13px] font-semibold hover:opacity-80 transition-opacity"
                >
                  كل الكورسات
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2.5 justify-center py-16 text-[var(--text-muted)] text-[13px]">
                <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <span>جاري تحميل الكورسات...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 bg-[var(--bg-panel)] rounded-2xl border border-dashed border-[var(--border-strong)]">
                <p className="text-[var(--text-muted)] text-[13px] mb-4">
                  لم تقم بإنشاء أي كورسات بعد
                </p>
                <Link
                  to="/teacher/add-course"
                  className="bg-[var(--accent)] text-white px-5 py-2.5 rounded-xl text-[12px] font-medium hover:opacity-90 transition-opacity"
                >
                  إنشاء أول كورس
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {courses.map((course, index) => {
                  const isDeleting = deletingId === course.id;
                  const gradient =
                    THUMB_GRADIENTS[index % THUMB_GRADIENTS.length];
                  return (
                    <div
                      key={course.id}
                      className="bg-[var(--bg-panel)] rounded-[1.5rem] border border-[var(--border)] hover:border-[var(--border-hover)] hover:shadow-lg hover:shadow-black/5 transition-all overflow-hidden flex flex-col"
                    >
                      <div
                        className={`relative h-36 w-full overflow-hidden bg-gradient-to-br ${gradient} p-3 flex items-start`}
                      >
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <Video className="w-6 h-6 text-white/70 relative z-10" />
                        )}
                        <span className="relative z-10 bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1 rounded-lg mt-auto">
                          {course.subject || "كورس"}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-[14px] mb-1.5 text-[var(--text-primary)] line-clamp-1">
                            {course.title}
                          </h3>
                          <p className="text-[var(--text-muted)] text-[12px] line-clamp-2">
                            {course.description || "لا يوجد وصف مدخل."}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                          <Link
                            to={`/course/${course.id}`}
                            className="flex-1 bg-[var(--accent-soft)] text-[var(--accent)] hover:opacity-80 py-2.5 rounded-xl text-[12px] font-semibold text-center transition-opacity flex items-center justify-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" /> دخول الكورس
                          </Link>
                          <Link
                            to={`/teacher/course/${course.id}/students`}
                            className="bg-[var(--success-soft)] text-[var(--success)] hover:opacity-80 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-opacity flex items-center justify-center gap-1.5"
                            title="إحصائيات الطلاب"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={(e) => handleDelete(e, course.id)}
                            disabled={deletingId !== null}
                            className="bg-[color-mix(in_srgb,var(--danger)_10%,transparent)] text-[var(--danger)] px-3.5 py-2.5 rounded-xl text-[12px] hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            title="حذف الكورس"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* السايد بار: كارت المدرس + الكاليندر + سلايدر الإشعارات */}
          <div className="space-y-6 lg:sticky lg:top-8">
            <TeacherVisaCard
              userData={userData}
              coursesCount={courses.length}
              studentsCount={studentsCount}
            />
            <MiniCalendar />
            <NotificationsSlider
              notifications={enrollments}
              loading={loading}
              onNotificationClick={handleNotificationClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
