import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  BookOpen,
  Award,
  ArrowLeft,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

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

const Teachers = () => {
  useLinearFont();
  const [theme, toggleTheme] = useTheme();

  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTeachersAndCourses = async () => {
      try {
        const [teachersSnap, coursesSnap] = await Promise.all([
          getDocs(collection(db, "teachers")),
          getDocs(collection(db, "courses")),
        ]);

        setTeachers(teachersSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCourses(coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error fetching teachers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachersAndCourses();
  }, []);

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const fontStyle = {
    fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', sans-serif",
  };

  return (
    <div
      className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-10 px-4 sm:px-6 lg:px-8"
      dir="rtl"
      style={fontStyle}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 relative">
          <div className="absolute left-0 top-0">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-medium">
            <Award className="w-3.5 h-3.5" /> هيئة التدريس المعتمدة
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold text-[var(--text-primary)] tracking-tight">
            نخبة معلمي الثانوية العامة
          </h1>
          <p className="text-[var(--text-muted)] text-[13px]">
            تعلم مع أفضل الكفاءات التعليمية واستفد من خبراتهم الأكاديمية
          </p>
        </div>

        <div className="max-w-md mx-auto relative">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="ابحث باسم المدرس أو المادة..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-md py-3 pr-10 pl-3.5 text-[12.5px] font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2.5 justify-center py-20 text-[var(--text-muted)] text-[13px]">
            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <span>جاري تحميل المعلمين...</span>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="text-center py-20 bg-[var(--bg-panel)] rounded-lg border border-dashed border-[var(--border-strong)] space-y-2">
            <Users className="w-10 h-10 text-[var(--text-disabled)] mx-auto" />
            <h3 className="text-[13.5px] font-medium text-[var(--text-secondary)]">
              لم نجد أي مدرس مطابق لبحثك
            </h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((teacher) => {
              const teacherCoursesCount = courses.filter(
                (c) => c.teacherId === teacher.id,
              ).length;

              return (
                <div
                  key={teacher.id}
                  className="bg-[var(--bg-panel)] rounded-lg border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors p-5 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center font-semibold text-lg shrink-0">
                        {teacher.fullName?.charAt(0) || "أ"}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] line-clamp-1">
                          {teacher.fullName}
                        </h3>
                        <span className="text-[11px] font-medium text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-md inline-block mt-1">
                          مدرس {teacher.subject || "المادة"}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11.5px] text-[var(--text-muted)] leading-relaxed line-clamp-3">
                      {teacher.experience ||
                        "معلم خبير حاصل على أعلى التقييمات في تقديم وشرح المناهج الدراسية."}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-[var(--text-secondary)]">
                      <BookOpen className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <span>{teacherCoursesCount} كورسات منشورة</span>
                    </div>

                    <Link
                      to="/courses"
                      className="bg-[var(--accent-soft)] hover:opacity-80 text-[var(--accent)] px-3 py-1.5 rounded-md text-[11px] font-medium flex items-center gap-1 transition-opacity"
                    >
                      <span>تصفح الكورسات</span>
                      <ArrowLeft className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Teachers;
