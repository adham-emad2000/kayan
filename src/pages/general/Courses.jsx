import React, { useState, useEffect } from "react";
import { Search, BookOpen, Sparkles, Sun, Moon } from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import CourseCard from "../../components/course/CourseCard";
import { useAuth } from "../../context/AuthContext";

// خط ونظام ألوان مشتركين مع باقي صفحات المنصة (نفس التوكنز المستخدمة في
// Dashboard.jsx بالظبط) — الأفضل ينقلوا لملف مشترك واحد بدل التكرار.
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
  --bg-base: #FFFFFF;
  --bg-panel: #FFFFFF;
  --bg-panel-alt: #F4F4F6;
  --bg-hover: #F4F4F6;
  --bg-card: #FAFAFB;
  --bg-active: #EEEEF1;
  --border-sidebar: #E7E7EA;
  --border: #E7E7EA;
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

const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("kayan-theme") || "dark";
    } catch {
      return "dark";
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
    className="w-8 h-8 rounded-md border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors shrink-0"
  >
    {theme === "dark" ? (
      <Sun className="w-4 h-4" />
    ) : (
      <Moon className="w-4 h-4" />
    )}
  </button>
);

const Courses = () => {
  useLinearFont();
  const [theme, toggleTheme] = useTheme();

  const { currentUser } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledIds, setEnrolledIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "courses"));
        setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

        if (currentUser) {
          const enrollSnap = await getDocs(collection(db, "enrollments"));
          const myEnrolls = enrollSnap.docs
            .filter((d) => d.data().studentId === currentUser.uid)
            .map((d) => d.data().courseId);
          setEnrolledIds(myEnrolls);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const filteredCourses = courses.filter((c) => {
    const matchSearch =
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacherName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = selectedGrade === "all" || c.grade === selectedGrade;
    const matchSubject =
      selectedSubject === "all" || c.subject === selectedSubject;
    return matchSearch && matchGrade && matchSubject;
  });

  const fontStyle = {
    fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', sans-serif",
  };
  const selectClass =
    "w-full bg-[var(--bg-panel-alt)] border border-[var(--border)] rounded-md py-2.5 px-3.5 text-[12.5px] font-medium text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] cursor-pointer transition-colors";

  return (
    <div
      className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-10 px-4 sm:px-6 lg:px-8"
      dir="rtl"
      style={fontStyle}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 relative">
          <div className="absolute left-0 top-0">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-medium">
            <Sparkles className="w-3.5 h-3.5" /> مكتبة الكورسات الكاملة
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold text-[var(--text-primary)] tracking-tight">
            استكشف أقوى المناهج التعليمية
          </h1>
          <p className="text-[var(--text-muted)] text-[13px]">
            اختر مادتك المفضلة وتفوق مع نخبة من أكفأ المعلمين
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-[var(--bg-panel)] p-4 rounded-lg border border-[var(--border)]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative sm:col-span-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="ابحث باسم الكورس أو المدرس..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[var(--bg-panel-alt)] border border-[var(--border)] rounded-md py-2.5 pr-10 pl-3.5 text-[12.5px] font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>

            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className={selectClass}
            >
              <option value="all">جميع الصفوف الدراسية</option>
              <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
              <option value="الصف الثاني الثانوي">الصف الثاني الثانوي</option>
              <option value="الصف الثالث الثانوي">الصف الثالث الثانوي</option>
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={selectClass}
            >
              <option value="all">جميع المواد الدراسية</option>
              <option value="الفيزياء">الفيزياء</option>
              <option value="الكيمياء">الكيمياء</option>
              <option value="الأحياء">الأحياء</option>
              <option value="الرياضيات">الرياضيات</option>
              <option value="اللغة العربية">اللغة العربية</option>
              <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        {loading ? (
          <div className="flex items-center gap-2.5 justify-center py-20 text-[var(--text-muted)] text-[13px]">
            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <span>جاري تحميل الكورسات...</span>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-panel)] rounded-lg border border-dashed border-[var(--border-strong)] space-y-2">
            <BookOpen className="w-10 h-10 text-[var(--text-disabled)] mx-auto" />
            <h3 className="text-[13.5px] font-medium text-[var(--text-secondary)]">
              لم نجد أي كورسات تطابق هذا البحث
            </h3>
            <p className="text-[11.5px] text-[var(--text-muted)]">
              جرب تغيير كلمات البحث أو الفلاتر المختارة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={enrolledIds.includes(course.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
