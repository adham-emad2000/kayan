import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  BookOpen,
  PlayCircle,
  Clock,
  Video,
  BookmarkCheck,
  Zap,
  ArrowUpRight,
  CheckCircle2,
  GraduationCap,
  ChevronDown,
  ArrowLeft,
  Home,
  Users,
  LayoutGrid,
  Search,
  Circle,
  CircleDot,
  LogOut,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

import defaultCourseImage from "../../image.png";

// خط IBM Plex Sans Arabic — هندسي ونضيف، بيقرب من روح Inter بتاعة Linear
// بس بيدعم العربي. الأفضل ينتقل لـ index.html على مستوى الأبلكيشن كله،
// هنا بنحقنه مرة واحدة فقط عشان الصفحة دي تشتغل مستقلة.
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

// حلقة تقدّم دائرية — نسخة هادية ورفيعة تناسب الطابع الداكن الدقيق
const ProgressRing = ({
  percent = 0,
  colorClass = "stroke-[#6C7BFF]",
  size = 52,
  stroke = 4,
}) => {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const safePercent = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (safePercent / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        className="fill-none stroke-[#1E1F24]"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className={`fill-none ${colorClass} transition-all duration-700 ease-out`}
      />
    </svg>
  );
};

const NavItem = ({ icon: Icon, label, active, onClick, count }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors text-right ${
      active
        ? "bg-[#1A1B20] text-[#ECECEE]"
        : "text-[#9A9BA3] hover:text-[#ECECEE] hover:bg-[#151619]"
    }`}
  >
    <Icon className="w-[15px] h-[15px] shrink-0" strokeWidth={2} />
    <span className="flex-1">{label}</span>
    {count != null && (
      <span className="text-[11px] text-[#6B6C74] font-mono tabular-nums">
        {count}
      </span>
    )}
  </button>
);

const Dashboard = () => {
  useLinearFont();

  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [lastUnfinishedLesson, setLastUnfinishedLesson] = useState(null);

  const [taskFilter, setTaskFilter] = useState("all");
  const [courseTab, setCourseTab] = useState("enrolled");
  const [visibleCoursesCount, setVisibleCoursesCount] = useState(4);

  const [studentPerformance, setStudentPerformance] = useState({
    lastExam: {
      subject: "لا توجد نتائج بعد",
      grade: "-- / --",
      percent: 0,
      status: "لم يتم الاختبار",
    },
    tasks: { remaining: 0, total: 0 },
    courses: { active: 0, total: 0 },
  });

  const [stats, setStats] = useState({
    enrolledSubjects: 0,
    watchedVideos: 0,
    savedVideos: 0,
    studyHours: 0,
  });

  const [tasksList, setTasksList] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      try {
        // 1. كل الكورسات (بيانات عامة فقط - عنوان/وصف/سعر، مفيهاش دروس)
        const coursesSnap = await getDocs(collection(db, "courses"));
        const allCourses = coursesSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          image: d.data().thumbnailUrl || defaultCourseImage,
          teacher: d.data().teacherName || "مدرس المادة",
          desc: d.data().description || "لا يوجد وصف مدخل لهذا الكورس.",
          badge: d.data().grade || "كورس أساسي",
        }));
        setCourses(allCourses);

        // 2. اشتراكات الطالب
        const enrollQuery = query(
          collection(db, "enrollments"),
          where("studentId", "==", currentUser.uid),
        );
        const enrollSnap = await getDocs(enrollQuery);
        const enrolledCourseIds = enrollSnap.docs.map((d) => d.data().courseId);
        const myCoursesBase = allCourses.filter((c) =>
          enrolledCourseIds.includes(c.id),
        );

        if (myCoursesBase.length === 0) {
          setCourseTab("all");
        }

        // 3. جلب دروس كل كورس مشترك فيه الطالب من المستند الخاص
        //    (private/lessons) - ده المكان الجديد بعد فصل الأسئلة عن بيانات الكورس العامة
        const myCourses = await Promise.all(
          myCoursesBase.map(async (c) => {
            try {
              const lessonsSnap = await getDoc(
                doc(db, "courses", c.id, "private", "lessons"),
              );
              return {
                ...c,
                lessons: lessonsSnap.exists()
                  ? lessonsSnap.data().lessons || []
                  : [],
              };
            } catch (e) {
              console.error("Error fetching lessons for course", c.id, e);
              return { ...c, lessons: [] };
            }
          }),
        );
        setEnrolledCourses(myCourses);

        // 4. كل نتايج الطالب (من غير orderBy عشان نتجنب الحاجة لـ composite index
        //    اللي كان بيخلي الاستعلام يفشل بصمت في الكود القديم)
        let myQuizResults = [];
        try {
          const quizSnap = await getDocs(
            query(
              collection(db, "quizResults"),
              where("studentId", "==", currentUser.uid),
            ),
          );
          myQuizResults = quizSnap.docs.map((d) => d.data());
        } catch (e) {
          console.error("Error fetching quiz results:", e);
        }

        let myHomeworkResults = [];
        try {
          const hwSnap = await getDocs(
            query(
              collection(db, "homeworkSubmissions"),
              where("studentId", "==", currentUser.uid),
            ),
          );
          myHomeworkResults = hwSnap.docs.map((d) => d.data());
        } catch (e) {
          console.error("Error fetching homework submissions:", e);
        }

        // 5. آخر محاضرة شاهدها الطالب (من userProgress) - بترتيب في الـ JS
        //    بدل orderBy عشان نتجنب نفس مشكلة الـ composite index
        let resumeLesson = null;
        try {
          const progressSnap = await getDocs(
            query(
              collection(db, "userProgress"),
              where("studentId", "==", currentUser.uid),
            ),
          );
          if (!progressSnap.empty) {
            const sorted = progressSnap.docs
              .map((d) => d.data())
              .sort(
                (a, b) => new Date(b.lastWatched) - new Date(a.lastWatched),
              );
            const pData = sorted[0];
            resumeLesson = {
              id: pData.courseId,
              title: pData.lessonTitle || "استكمال المحاضرة السابقة",
              teacher: pData.teacherName || "مدرس المادة",
              progress: pData.progressPercent || 50,
            };
          }
        } catch (e) {
          console.error("Error fetching progress:", e);
        }

        if (
          !resumeLesson &&
          myCourses.length > 0 &&
          myCourses[0].lessons?.length > 0
        ) {
          resumeLesson = {
            id: myCourses[0].id,
            title: myCourses[0].lessons[0].title,
            teacher: myCourses[0].teacherName || "مدرس المادة",
            progress: 15,
          };
        }
        setLastUnfinishedLesson(resumeLesson);

        // 6. بناء قايمة المهام - المتبقية فقط (اللي الطالب لسه ماحلهاش)
        //    باستخدام quizData/homeworkData الفعليين بدل hasQuiz/hasHomework اللي مش موجودين أصلاً
        const extractedTasks = [];
        let totalTasksCount = 0;

        myCourses.forEach((c) => {
          (c.lessons || []).forEach((lesson) => {
            const hasQuiz = lesson.quizData?.questions?.length > 0;
            const hasHomework = lesson.homeworkData?.questions?.length > 0;

            if (hasQuiz) {
              totalTasksCount++;
              const alreadyDone = myQuizResults.some(
                (r) => r.courseId === c.id && r.lessonTitle === lesson.title,
              );
              if (!alreadyDone) {
                extractedTasks.push({
                  id: `quiz_${c.id}_${lesson.title}`,
                  type: "quiz",
                  title: `امتحان: ${lesson.title}`,
                  courseTitle: c.title,
                  courseId: c.id,
                  dueDate: "متاح الآن للحل",
                  urgent: true,
                });
              }
            }

            if (hasHomework) {
              totalTasksCount++;
              const alreadyDone = myHomeworkResults.some(
                (r) => r.courseId === c.id && r.lessonTitle === lesson.title,
              );
              if (!alreadyDone) {
                extractedTasks.push({
                  id: `hw_${c.id}_${lesson.title}`,
                  type: "homework",
                  title: `واجب: ${lesson.title}`,
                  courseTitle: c.title,
                  courseId: c.id,
                  dueDate: "تسليم إلكتروني",
                  urgent: false,
                });
              }
            }
          });
        });
        setTasksList(extractedTasks);

        // 7. آخر نتيجة امتحان - مرتبة في الـ JS من النتايج اللي جبناها فوق
        let lastExamResult = {
          subject: myCourses[0]?.subject || "عام",
          grade: "لم يختبر",
          percent: 0,
          status: "لا توجد نتائج بعد",
        };

        if (myQuizResults.length > 0) {
          const sortedResults = [...myQuizResults].sort(
            (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt),
          );
          const qData = sortedResults[0];
          const calcPercent = Math.round(
            (qData.score / (qData.totalMarks || 1)) * 100,
          );
          lastExamResult = {
            subject: qData.subject || qData.courseTitle || "الفيزياء",
            grade: `${qData.score} / ${qData.totalMarks}`,
            percent: calcPercent,
            status:
              calcPercent >= 85
                ? "ممتاز جدًا"
                : calcPercent >= 65
                  ? "جيد جدًا"
                  : "يحتاج مراجعة",
          };
        }

        setStudentPerformance({
          lastExam: lastExamResult,
          tasks: {
            remaining: extractedTasks.length,
            total: totalTasksCount || 1,
          },
          courses: { active: myCourses.length, total: allCourses.length || 1 },
        });

        const uniqueSubjects = new Set(
          myCourses.map((c) => c.subject).filter(Boolean),
        ).size;
        const totalLessons = myCourses.reduce(
          (acc, c) => acc + (c.lessons?.length || 0),
          0,
        );

        setStats({
          enrolledSubjects: uniqueSubjects || myCourses.length,
          watchedVideos: totalLessons,
          savedVideos: 0,
          studyHours: Math.round((totalLessons * 45) / 60),
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const filteredTasks = tasksList.filter((task) => {
    if (taskFilter === "quiz") return task.type === "quiz";
    if (taskFilter === "homework") return task.type === "homework";
    return true;
  });

  const activeCourseList = courseTab === "enrolled" ? enrolledCourses : courses;
  const displayedCourses = activeCourseList.slice(0, visibleCoursesCount);

  const fontStyle = {
    fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', sans-serif",
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#0B0C0F] flex items-center justify-center text-[#9A9BA3] text-sm"
        dir="rtl"
        style={fontStyle}
      >
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[#6C7BFF] border-t-transparent rounded-full animate-spin"></div>
          <span>جاري تحميل لوحة التحكم...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0B0C0F] text-[#ECECEE]"
      dir="rtl"
      style={fontStyle}
    >
      <div className="flex">
        {/* ===== Sidebar ===== */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-l border-[#1B1C21] bg-[#0D0E12]">
          <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#1B1C21]">
            <div className="w-6 h-6 rounded-md bg-[#6C7BFF] flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[13px] font-semibold text-[#ECECEE]">
              كيان
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B6C74] mr-auto" />
          </div>

          <div className="p-3">
            <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-[#232429] text-[#6B6C74] text-[12px] hover:border-[#33343A] hover:text-[#9A9BA3] transition-colors">
              <Search className="w-3.5 h-3.5" />
              <span>بحث سريع</span>
              <span className="mr-auto text-[10px] font-mono border border-[#232429] rounded px-1">
                Ctrl K
              </span>
            </button>
          </div>

          <nav className="px-3 space-y-0.5">
            <NavItem icon={Home} label="الرئيسية" active />
            <NavItem
              icon={LayoutGrid}
              label="الكورسات"
              count={courses.length}
              onClick={() => navigate("/courses")}
            />
            <NavItem
              icon={Users}
              label="المدرسين"
              onClick={() => navigate("/teachers")}
            />
          </nav>

          <div className="px-3 mt-6">
            <p className="px-2.5 text-[11px] font-semibold text-[#54555C] uppercase tracking-wide mb-1.5">
              المهام
            </p>
            <NavItem
              icon={CircleDot}
              label="امتحانات"
              count={tasksList.filter((t) => t.type === "quiz").length}
              onClick={() => setTaskFilter("quiz")}
              active={taskFilter === "quiz"}
            />
            <NavItem
              icon={Circle}
              label="واجبات"
              count={tasksList.filter((t) => t.type === "homework").length}
              onClick={() => setTaskFilter("homework")}
              active={taskFilter === "homework"}
            />
          </div>

          <div className="mt-auto p-3 border-t border-[#1B1C21]">
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-[#151619] transition-colors group">
              <div className="w-6 h-6 rounded-full bg-[#6C7BFF] text-white flex items-center justify-center text-[11px] font-semibold shrink-0 overflow-hidden">
                {userData?.photoURL ? (
                  <img
                    src={userData.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {userData?.fullName ? userData.fullName.trim()[0] : "ط"}
                  </span>
                )}
              </div>
              <span className="text-[12px] text-[#9A9BA3] line-clamp-1 flex-1 text-right">
                {userData?.fullName || "طالب"}
              </span>
              <button
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="text-[#54555C] hover:text-[#F2637B] transition-colors opacity-0 group-hover:opacity-100"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ===== Main ===== */}
        <div className="flex-1 min-w-0">
          {/* Topbar */}
          <header className="h-14 flex items-center justify-between px-5 lg:px-8 border-b border-[#1B1C21] sticky top-0 bg-[#0B0C0F]/90 backdrop-blur z-10">
            <div className="flex items-center gap-2 text-[13px] text-[#9A9BA3]">
              <Home className="w-3.5 h-3.5" />
              <span>لوحة التحكم</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#131417] p-0.5 rounded-md border border-[#1E1F24] text-[12px]">
              <span className="px-2.5 py-1 rounded text-[#6B6C74]">
                {userData?.grade || "الصف الثالث الثانوي"}
              </span>
            </div>
          </header>

          <main className="p-5 lg:p-8 space-y-8 max-w-5xl">
            {/* استكمال آخر محاضرة */}
            {lastUnfinishedLesson ? (
              <button
                onClick={() => navigate(`/player/${lastUnfinishedLesson.id}`)}
                className="w-full flex items-center gap-4 p-4 rounded-lg border border-[#1E1F24] bg-[#111216] hover:border-[#2A2B31] hover:bg-[#131417] transition-colors text-right group"
              >
                <div className="w-9 h-9 rounded-md bg-[#6C7BFF1A] text-[#6C7BFF] flex items-center justify-center shrink-0">
                  <PlayCircle className="w-4.5 h-4.5" strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#6B6C74] mb-0.5">
                    استكمال المحاضرة السابقة
                  </p>
                  <p className="text-[13px] font-medium text-[#ECECEE] line-clamp-1">
                    {lastUnfinishedLesson.title}
                  </p>
                </div>
                <div className="hidden sm:block w-32 h-1 bg-[#1E1F24] rounded-full overflow-hidden shrink-0">
                  <div
                    className="h-full bg-[#6C7BFF] rounded-full"
                    style={{ width: `${lastUnfinishedLesson.progress}%` }}
                  />
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#54555C] group-hover:text-[#6C7BFF] transition-colors shrink-0" />
              </button>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-[#232429] text-[13px] text-[#6B6C74] text-center">
                ابدأ باختيار كورس للمذاكرة من القائمة بالأسفل
              </div>
            )}

            {/* شريط الإحصائيات — 4 أعمدة مضغوطة زي عدادات Linear */}
            <div className="grid grid-cols-2 sm:grid-cols-4 rounded-lg border border-[#1E1F24] divide-x divide-x-reverse divide-[#1E1F24] overflow-hidden">
              {[
                {
                  title: "مواد مشترك بها",
                  val: stats.enrolledSubjects,
                  icon: BookOpen,
                },
                {
                  title: "فيديوهات متاحة",
                  val: stats.watchedVideos,
                  icon: Video,
                },
                {
                  title: "مهام وامتحانات",
                  val: tasksList.length,
                  icon: BookmarkCheck,
                },
                { title: "ساعات التعلم", val: stats.studyHours, icon: Zap },
              ].map((stat, i) => (
                <div key={i} className="p-4 bg-[#0D0E12]">
                  <div className="flex items-center gap-1.5 text-[#6B6C74] mb-2">
                    <stat.icon className="w-3.5 h-3.5" strokeWidth={2} />
                    <span className="text-[11px]">{stat.title}</span>
                  </div>
                  <div className="text-xl font-semibold text-[#ECECEE] tabular-nums">
                    {stat.val}
                  </div>
                </div>
              ))}
            </div>

            {/* مؤشرات الأداء */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-lg border border-[#1E1F24] bg-[#0D0E12] flex items-center gap-4">
                <div className="relative shrink-0">
                  <ProgressRing
                    percent={studentPerformance.lastExam.percent}
                    colorClass="stroke-[#6C7BFF]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-[#ECECEE] tabular-nums">
                      {studentPerformance.lastExam.percent}%
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-[#6B6C74] block mb-0.5">
                    آخر نتيجة امتحان
                  </span>
                  <h3 className="text-[13px] font-medium text-[#ECECEE] line-clamp-1">
                    {studentPerformance.lastExam.subject}
                  </h3>
                  <p className="text-[11px] text-[#6C7BFF] font-medium mt-0.5">
                    {studentPerformance.lastExam.grade} ·{" "}
                    {studentPerformance.lastExam.status}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[#1E1F24] bg-[#0D0E12] flex items-center gap-4">
                <div className="relative shrink-0">
                  <ProgressRing
                    percent={
                      studentPerformance.tasks.total > 0
                        ? (studentPerformance.tasks.remaining /
                            studentPerformance.tasks.total) *
                          100
                        : 0
                    }
                    colorClass="stroke-[#F2B84B]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-[#ECECEE] tabular-nums">
                      {studentPerformance.tasks.remaining}
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-[#6B6C74] block mb-0.5">
                    المهام الدراسية
                  </span>
                  <h3 className="text-[13px] font-medium text-[#ECECEE]">
                    الواجبات والكويزات
                  </h3>
                  <p className="text-[11px] text-[#F2B84B] font-medium mt-0.5">
                    {studentPerformance.tasks.remaining} مهمة بانتظار الحل
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[#1E1F24] bg-[#0D0E12] flex items-center gap-4">
                <div className="relative shrink-0">
                  <ProgressRing
                    percent={
                      studentPerformance.courses.total > 0
                        ? (studentPerformance.courses.active /
                            studentPerformance.courses.total) *
                          100
                        : 0
                    }
                    colorClass="stroke-[#3DD68C]"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-[#ECECEE] tabular-nums">
                      {studentPerformance.courses.active}
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-[#6B6C74] block mb-0.5">
                    الاشتراكات الحالية
                  </span>
                  <h3 className="text-[13px] font-medium text-[#ECECEE]">
                    الكورسات المفعلة
                  </h3>
                  <p className="text-[11px] text-[#3DD68C] font-medium mt-0.5">
                    من أصل {studentPerformance.courses.total} كورس متاح
                  </p>
                </div>
              </div>
            </div>

            {/* الكورسات + المهام */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* الكورسات */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-[#ECECEE]">
                    المناهج التعليمية
                  </h2>
                  <div className="flex items-center gap-1 bg-[#131417] p-0.5 rounded-md border border-[#1E1F24]">
                    <button
                      onClick={() => {
                        setCourseTab("enrolled");
                        setVisibleCoursesCount(4);
                      }}
                      className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${
                        courseTab === "enrolled"
                          ? "bg-[#1E1F24] text-[#ECECEE]"
                          : "text-[#6B6C74] hover:text-[#9A9BA3]"
                      }`}
                    >
                      كورساتي ({enrolledCourses.length})
                    </button>
                    <button
                      onClick={() => {
                        setCourseTab("all");
                        setVisibleCoursesCount(4);
                      }}
                      className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${
                        courseTab === "all"
                          ? "bg-[#1E1F24] text-[#ECECEE]"
                          : "text-[#6B6C74] hover:text-[#9A9BA3]"
                      }`}
                    >
                      جميع الكورسات ({courses.length})
                    </button>
                  </div>
                </div>

                {activeCourseList.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#232429] p-10 text-center space-y-2">
                    <BookOpen className="w-8 h-8 text-[#33343A] mx-auto" />
                    <p className="text-[13px] font-medium text-[#9A9BA3]">
                      {courseTab === "enrolled"
                        ? "أنت غير مشترك في أي كورسات بعد"
                        : "لا توجد كورسات متاحة حالياً"}
                    </p>
                    {courseTab === "enrolled" && (
                      <button
                        onClick={() => setCourseTab("all")}
                        className="text-[12px] font-medium text-[#6C7BFF] hover:underline mt-1"
                      >
                        تصفح الكورسات المتاحة
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-[#1E1F24] divide-y divide-[#1E1F24] overflow-hidden">
                      {displayedCourses.map((course) => {
                        const isEnrolled = enrolledCourses.some(
                          (c) => c.id === course.id,
                        );
                        return (
                          <Link
                            key={course.id}
                            to={`/course/${course.id}`}
                            className="flex items-center gap-3.5 p-3.5 bg-[#0D0E12] hover:bg-[#131417] transition-colors group"
                          >
                            <div className="w-11 h-11 rounded-md overflow-hidden bg-[#1A1B20] shrink-0 border border-[#1E1F24]">
                              <img
                                src={course.image}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium text-[#ECECEE] line-clamp-1">
                                {course.title}
                              </p>
                              <p className="text-[11px] text-[#6B6C74] line-clamp-1 mt-0.5">
                                {course.teacher} · {course.badge}
                              </p>
                            </div>
                            {isEnrolled && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#3DD68C1A] text-[#3DD68C] shrink-0">
                                مشترك
                              </span>
                            )}
                            <ArrowLeft className="w-3.5 h-3.5 text-[#33343A] group-hover:text-[#6C7BFF] transition-colors shrink-0" />
                          </Link>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-center">
                      {visibleCoursesCount < activeCourseList.length ? (
                        <button
                          onClick={() =>
                            setVisibleCoursesCount((prev) => prev + 4)
                          }
                          className="text-[12px] font-medium text-[#9A9BA3] hover:text-[#ECECEE] border border-[#1E1F24] hover:border-[#2A2B31] px-4 py-2 rounded-md transition-colors flex items-center gap-1.5"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>
                            عرض المزيد (
                            {activeCourseList.length - visibleCoursesCount}{" "}
                            متبقي)
                          </span>
                        </button>
                      ) : (
                        <Link
                          to="/courses"
                          className="text-[12px] font-medium text-[#6C7BFF] hover:underline flex items-center gap-1.5"
                        >
                          <span>تصفح مكتبة الكورسات كاملة</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* المهام — بروح قوائم الـ Issues في Linear */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-semibold text-[#ECECEE] flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#6B6C74]" />
                    <span>المهام والواجبات</span>
                  </h2>
                  <span className="text-[11px] font-medium text-[#6B6C74] tabular-nums">
                    {filteredTasks.length}
                  </span>
                </div>

                <div className="rounded-lg border border-[#1E1F24] bg-[#0D0E12]">
                  <div className="grid grid-cols-3 gap-0.5 p-1 border-b border-[#1E1F24]">
                    {[
                      { id: "all", label: "الكل", count: tasksList.length },
                      {
                        id: "quiz",
                        label: "امتحانات",
                        count: tasksList.filter((t) => t.type === "quiz")
                          .length,
                      },
                      {
                        id: "homework",
                        label: "واجبات",
                        count: tasksList.filter((t) => t.type === "homework")
                          .length,
                      },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setTaskFilter(f.id)}
                        className={`py-1.5 rounded text-[11px] font-medium transition-colors ${
                          taskFilter === f.id
                            ? "bg-[#1A1B20] text-[#ECECEE]"
                            : "text-[#6B6C74] hover:text-[#9A9BA3]"
                        }`}
                      >
                        {f.label} ({f.count})
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[440px] overflow-y-auto divide-y divide-[#1E1F24]">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-10 space-y-1.5">
                        <CheckCircle2 className="w-6 h-6 text-[#3DD68C] mx-auto" />
                        <p className="text-[12px] font-medium text-[#9A9BA3]">
                          لا توجد مهام في هذا القسم
                        </p>
                        <p className="text-[11px] text-[#54555C]">
                          أنت منجز لكل حاجة هنا 🎉
                        </p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => navigate(`/player/${task.courseId}`)}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#131417] transition-colors text-right group"
                        >
                          {task.type === "quiz" ? (
                            <CircleDot
                              className="w-3.5 h-3.5 text-[#B18CF8] shrink-0"
                              strokeWidth={2}
                            />
                          ) : (
                            <Circle
                              className="w-3.5 h-3.5 text-[#F2B84B] shrink-0"
                              strokeWidth={2}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[12.5px] font-medium text-[#ECECEE] line-clamp-1">
                              {task.title}
                            </p>
                            <p className="text-[11px] text-[#6B6C74] line-clamp-1 mt-0.5">
                              {task.courseTitle}
                            </p>
                          </div>
                          <span className="text-[10px] text-[#54555C] font-mono shrink-0 hidden sm:block">
                            {task.dueDate}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
