import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Users,
  CheckSquare,
  HelpCircle,
  Loader2,
  CircleCheck,
  CircleDashed,
  Search,
  X,
} from "lucide-react";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const TABS = [
  { id: "students", label: "الطلاب المشتركين", icon: Users },
  { id: "homework", label: "الواجبات", icon: CheckSquare },
  { id: "quizzes", label: "الامتحانات", icon: HelpCircle },
];

const TeacherCourseStudents = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    TABS.some((t) => t.id === initialTab) ? initialTab : "students",
  );
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [homeworkSubs, setHomeworkSubs] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedHwLesson, setSelectedHwLesson] = useState(null);
  const [selectedQuizLesson, setSelectedQuizLesson] = useState(null);

  // حالة مودال مراجعة إجابات الطالب
  const [reviewModalData, setReviewModalData] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      if (!currentUser || !id) return;
      setLoading(true);
      try {
        const courseSnap = await getDoc(doc(db, "courses", id));
        if (!courseSnap.exists()) {
          navigate("/teacher/dashboard");
          return;
        }
        const courseData = { id: courseSnap.id, ...courseSnap.data() };

        // بيانات الدروس (وفيها الأسئلة) بقت في مستند خاص منفصل - المدرس مسموح له يقراها
        const lessonsDocRef = doc(db, "courses", id, "private", "lessons");
        const lessonsSnap = await getDoc(lessonsDocRef);
        courseData.lessons = lessonsSnap.exists()
          ? lessonsSnap.data().lessons || []
          : [];

        setCourse(courseData);

        const lessonsWithHw = (courseData.lessons || []).filter(
          (l) => l.homeworkData?.questions?.length > 0,
        );
        const lessonsWithQuiz = (courseData.lessons || []).filter(
          (l) => l.quizData?.questions?.length > 0,
        );
        setSelectedHwLesson(lessonsWithHw[0]?.title || null);
        setSelectedQuizLesson(lessonsWithQuiz[0]?.title || null);

        const enrollQuery = query(
          collection(db, "enrollments"),
          where("courseId", "==", id),
        );
        const enrollSnap = await getDocs(enrollQuery);
        setEnrollments(enrollSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const hwQuery = query(
          collection(db, "homeworkSubmissions"),
          where("courseId", "==", id),
        );
        const hwSnap = await getDocs(hwQuery);
        setHomeworkSubs(hwSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const quizQuery = query(
          collection(db, "quizResults"),
          where("courseId", "==", id),
        );
        const quizSnap = await getDocs(quizQuery);
        setQuizResults(quizSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching course stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, currentUser, navigate]);

  const lessonsWithHomework = useMemo(
    () =>
      (course?.lessons || []).filter(
        (l) => l.homeworkData?.questions?.length > 0,
      ),
    [course],
  );
  const lessonsWithQuiz = useMemo(
    () =>
      (course?.lessons || []).filter((l) => l.quizData?.questions?.length > 0),
    [course],
  );

  const filteredEnrollments = enrollments.filter((e) =>
    (e.studentName || e.fullName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const buildRosterForLesson = (
    submissions,
    lessonTitle,
    scoreField,
    totalField,
  ) => {
    return enrollments
      .map((enr) => {
        const sub = submissions.find(
          (s) => s.studentId === enr.studentId && s.lessonTitle === lessonTitle,
        );
        return {
          studentId: enr.studentId,
          studentName: enr.studentName || enr.fullName || "طالب",
          submitted: !!sub,
          score: sub ? sub[scoreField] : null,
          total: sub ? sub[totalField] : null,
          userAnswers: sub?.userAnswers || {},
          submittedAt: sub?.submittedAt || null,
        };
      })
      .filter((row) =>
        row.studentName.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  };

  const homeworkRoster = selectedHwLesson
    ? buildRosterForLesson(
        homeworkSubs,
        selectedHwLesson,
        "score",
        "totalMarks", // كان مكتوب "totalQuestions" وده حقل مش موجود في homeworkSubmissions - كان بيطلع score/undefined
      )
    : [];
  const quizRoster = selectedQuizLesson
    ? buildRosterForLesson(
        quizResults,
        selectedQuizLesson,
        "score",
        "totalMarks",
      )
    : [];

  // فتح مودال مراجعة الإجابات
  const handleOpenReview = (row, lessonTitle, type) => {
    const lesson = course?.lessons?.find((l) => l.title === lessonTitle);
    const questions =
      type === "homework"
        ? lesson?.homeworkData?.questions
        : lesson?.quizData?.questions;

    setReviewModalData({
      studentName: row.studentName,
      score: row.score,
      total: row.total,
      userAnswers: row.userAnswers,
      questions: questions || [],
      lessonTitle,
      type,
    });
  };

  const fontStyle = {
    fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', sans-serif",
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[var(--bg-base,#0B0C0F)] flex items-center justify-center text-[var(--text-muted,#6B6C74)] gap-2 text-[13px]"
        dir="rtl"
        style={fontStyle}
      >
        <Loader2 className="w-4 h-4 animate-spin" /> جاري تحميل بيانات الكورس...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-8 px-4 sm:px-6 lg:px-8 relative"
      dir="rtl"
      style={fontStyle}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[12.5px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" /> رجوع
        </button>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            {course?.title}
          </h1>
          <p className="text-[var(--text-muted)] text-[12.5px] mt-1">
            إحصائيات الطلاب والواجبات والامتحانات لهذا الكورس
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-[12.5px] font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? "border-[var(--accent)] text-[var(--accent)]"
                    : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="دور باسم الطالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--bg-panel-alt)] border border-[var(--border)] rounded-md py-2.5 pr-10 pl-3.5 text-[12.5px] font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Tab: الطلاب المشتركين */}
        {activeTab === "students" && (
          <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl overflow-hidden">
            {filteredEnrollments.length === 0 ? (
              <p className="text-center py-14 text-[var(--text-muted)] text-[13px]">
                لا يوجد طلاب مشتركين حتى الآن.
              </p>
            ) : (
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[11px]">
                    <th className="text-right py-3 px-4 font-semibold">
                      الطالب
                    </th>
                    <th className="text-right py-3 px-4 font-semibold">
                      تاريخ الاشتراك
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnrollments.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                        {e.studentName || e.fullName || "طالب"}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-muted)]">
                        {e.createdAt?.toDate
                          ? e.createdAt.toDate().toLocaleDateString("ar-EG")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: الواجبات */}
        {activeTab === "homework" && (
          <div className="space-y-4">
            {lessonsWithHomework.length === 0 ? (
              <p className="text-center py-14 text-[var(--text-muted)] text-[13px] bg-[var(--bg-panel)] border border-dashed border-[var(--border-strong)] rounded-2xl">
                لا توجد دروس فيها واجب إلكتروني في هذا الكورس.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {lessonsWithHomework.map((l) => (
                    <button
                      key={l.title}
                      onClick={() => setSelectedHwLesson(l.title)}
                      className={`px-3.5 py-2 rounded-lg text-[11.5px] font-semibold border transition-colors cursor-pointer ${
                        selectedHwLesson === l.title
                          ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {l.title}
                    </button>
                  ))}
                </div>

                <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl overflow-hidden">
                  {homeworkRoster.length === 0 ? (
                    <p className="text-center py-14 text-[var(--text-muted)] text-[13px]">
                      لا يوجد طلاب مشتركين حتى الآن.
                    </p>
                  ) : (
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[11px]">
                          <th className="text-right py-3 px-4 font-semibold">
                            الطالب
                          </th>
                          <th className="text-right py-3 px-4 font-semibold">
                            الحالة
                          </th>
                          <th className="text-right py-3 px-4 font-semibold">
                            الدرجة
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            الإجراء
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {homeworkRoster.map((row) => (
                          <tr
                            key={row.studentId}
                            className="border-b border-[var(--border)] last:border-0"
                          >
                            <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                              {row.studentName}
                            </td>
                            <td className="py-3 px-4">
                              {row.submitted ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold">
                                  <CircleCheck className="w-4 h-4" /> سلّم
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-slate-500 font-semibold">
                                  <CircleDashed className="w-4 h-4" /> لسه
                                  مسلّمش
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-[var(--text-secondary)]">
                              {row.submitted
                                ? `${row.score} / ${row.total}`
                                : "—"}
                            </td>
                            <td className="py-3 px-4 text-left">
                              {row.submitted ? (
                                <button
                                  onClick={() =>
                                    handleOpenReview(
                                      row,
                                      selectedHwLesson,
                                      "homework",
                                    )
                                  }
                                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                                >
                                  مراجعة الإجابات 🔍
                                </button>
                              ) : (
                                <span className="text-slate-600 text-[11px]">
                                  غير متاح
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: الامتحانات */}
        {activeTab === "quizzes" && (
          <div className="space-y-4">
            {lessonsWithQuiz.length === 0 ? (
              <p className="text-center py-14 text-[var(--text-muted)] text-[13px] bg-[var(--bg-panel)] border border-dashed border-[var(--border-strong)] rounded-2xl">
                لا توجد دروس فيها امتحان إلكتروني في هذا الكورس.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {lessonsWithQuiz.map((l) => (
                    <button
                      key={l.title}
                      onClick={() => setSelectedQuizLesson(l.title)}
                      className={`px-3.5 py-2 rounded-lg text-[11.5px] font-semibold border transition-colors cursor-pointer ${
                        selectedQuizLesson === l.title
                          ? "bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {l.title}
                    </button>
                  ))}
                </div>

                <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-2xl overflow-hidden">
                  {quizRoster.length === 0 ? (
                    <p className="text-center py-14 text-[var(--text-muted)] text-[13px]">
                      لا يوجد طلاب مشتركين حتى الآن.
                    </p>
                  ) : (
                    <table className="w-full text-[12.5px]">
                      <thead>
                        <tr className="border-b border-[var(--border)] text-[var(--text-muted)] text-[11px]">
                          <th className="text-right py-3 px-4 font-semibold">
                            الطالب
                          </th>
                          <th className="text-right py-3 px-4 font-semibold">
                            الحالة
                          </th>
                          <th className="text-right py-3 px-4 font-semibold">
                            الدرجة
                          </th>
                          <th className="text-right py-3 px-4 font-semibold">
                            النسبة
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            الإجراء
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {quizRoster.map((row) => {
                          const percent =
                            row.submitted && row.total
                              ? Math.round((row.score / row.total) * 100)
                              : null;
                          return (
                            <tr
                              key={row.studentId}
                              className="border-b border-[var(--border)] last:border-0"
                            >
                              <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                                {row.studentName}
                              </td>
                              <td className="py-3 px-4">
                                {row.submitted ? (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-500 font-semibold">
                                    <CircleCheck className="w-4 h-4" /> حل
                                    الامتحان
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-slate-500 font-semibold">
                                    <CircleDashed className="w-4 h-4" /> لسه
                                    ماحلوش
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-[var(--text-secondary)]">
                                {row.submitted
                                  ? `${row.score} / ${row.total}`
                                  : "—"}
                              </td>
                              <td className="py-3 px-4 text-[var(--text-secondary)]">
                                {percent !== null ? `${percent}%` : "—"}
                              </td>
                              <td className="py-3 px-4 text-left">
                                {row.submitted ? (
                                  <button
                                    onClick={() =>
                                      handleOpenReview(
                                        row,
                                        selectedQuizLesson,
                                        "quiz",
                                      )
                                    }
                                    className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                                  >
                                    مراجعة الإجابات 🔍
                                  </button>
                                ) : (
                                  <span className="text-slate-600 text-[11px]">
                                    غير متاح
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* مودال مراجعة إجابات الطالب للمدرس */}
      {reviewModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-[2.5rem] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* هيدر المودال */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <h3 className="text-lg font-black text-white">
                  مراجعة {reviewModalData.type === "quiz" ? "امتحان" : "واجب"}:{" "}
                  {reviewModalData.studentName}
                </h3>
                <p className="text-xs text-indigo-400 font-bold mt-1">
                  الدرس: {reviewModalData.lessonTitle} | النتيجة:{" "}
                  {reviewModalData.score} / {reviewModalData.total}
                </p>
              </div>
              <button
                onClick={() => setReviewModalData(null)}
                className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* محتوى الأسئلة */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {reviewModalData.questions.map((q, qIndex) => {
                const studentChoice = reviewModalData.userAnswers?.[qIndex];
                const correctChoice =
                  q.correctOption !== undefined
                    ? q.correctOption
                    : q.correctIndex;
                const isCorrect = studentChoice === correctChoice;

                return (
                  <div
                    key={qIndex}
                    className={`p-5 rounded-2xl border ${
                      isCorrect
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : "bg-rose-950/20 border-rose-500/30"
                    } space-y-3`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black px-3 py-1 rounded-xl bg-slate-800 text-slate-300">
                        السؤال {qIndex + 1}
                      </span>
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-xl ${
                          isCorrect
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        }`}
                      >
                        {isCorrect ? "إجابة صحيحة ✓" : "إجابة خاطئة ✗"}
                      </span>
                    </div>

                    <p className="text-sm font-black text-white leading-relaxed">
                      {q.questionText}
                    </p>

                    <div className="grid grid-cols-1 gap-2 pt-2">
                      {q.options.map((opt, optIdx) => {
                        let badgeStyle =
                          "bg-slate-950/40 border-slate-800 text-slate-400";

                        if (optIdx === correctChoice) {
                          badgeStyle =
                            "bg-emerald-600/20 border-emerald-500 text-emerald-300 font-black";
                        } else if (optIdx === studentChoice && !isCorrect) {
                          badgeStyle =
                            "bg-rose-600/20 border-rose-500 text-rose-300 font-black";
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-xs flex items-center justify-between ${badgeStyle}`}
                          >
                            <span>{opt}</span>
                            {optIdx === studentChoice && (
                              <span className="text-[10px] font-bold bg-slate-800 px-2 py-0.5 rounded text-white">
                                إجابة الطالب
                              </span>
                            )}
                            {optIdx === correctChoice &&
                              optIdx !== studentChoice && (
                                <span className="text-[10px] font-bold bg-emerald-800 px-2 py-0.5 rounded text-white">
                                  الإجابة الصحيحة
                                </span>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* فوتر المودال */}
            <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setReviewModalData(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-black cursor-pointer shadow-lg"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCourseStudents;
