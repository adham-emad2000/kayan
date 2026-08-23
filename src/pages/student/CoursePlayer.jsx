import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  PlayCircle,
  ArrowRight,
  BookOpen,
  HelpCircle,
  CheckSquare,
  ShieldAlert,
  Loader2,
  Sparkles,
  Video,
  X,
  Award,
  Lock,
  Clock,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

// يوتيوب بيرفض يفتح جوه iframe لو الرابط بصيغة watch?v= أو youtu.be/ العادية
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    if (host === "youtube.com" && parsed.pathname.startsWith("/embed/")) {
      return url;
    }

    let videoId = null;

    if (host === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    } else if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1];
      }
    }

    if (!videoId) return url;

    return `https://www.youtube.com/embed/${videoId}?rel=0`;
  } catch (e) {
    return url;
  }
};

const CoursePlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);

  const [hasSubmittedQuiz, setHasSubmittedQuiz] = useState(false);
  const [previousScore, setPreviousScore] = useState(null);

  const [hasSubmittedHomework, setHasSubmittedHomework] = useState(false);
  const [previousHomeworkScore, setPreviousHomeworkScore] = useState(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null,
  });

  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // حالة الحفظ الفعلي في Firestore، منفصلة عن حالة "الطالب دوس تسليم"
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // التايمر الخاص بالامتحان فقط (الواجب من غير تايمر)
  const [timeLeft, setTimeLeft] = useState(null);

  // 1. جلب الكورس والتحقق من الاشتراك والدروس من المستند السري (private/lessons)
  useEffect(() => {
    const fetchCourseAndCheckAccess = async () => {
      if (!currentUser) return;
      setLoading(true);

      try {
        const courseRef = doc(db, "courses", id);
        const courseSnap = await getDoc(courseRef);

        if (!courseSnap.exists()) {
          alert("الكورس غير موجود أو تم حذفه!");
          navigate("/dashboard");
          return;
        }

        const courseData = courseSnap.data();
        setCourse(courseData);

        // 👈 جلب الحصص والدروس من المستند الفرعي السري (تطابقاً مع EditCourse و Dashboard)
        const lessonsDocRef = doc(db, "courses", id, "private", "lessons");
        const lessonsSnap = await getDoc(lessonsDocRef);
        const courseLessons = lessonsSnap.exists()
          ? lessonsSnap.data().lessons || []
          : [];

        setLessons(courseLessons);
        if (courseLessons.length > 0) {
          setActiveLesson(courseLessons[0]);
        }

        if (
          userData?.role === "admin" ||
          userData?.role === "teacher" ||
          courseData.teacherId === currentUser.uid
        ) {
          setIsEnrolled(true);
          setLoading(false);
          return;
        }

        const enrollQuery = query(
          collection(db, "enrollments"),
          where("studentId", "==", currentUser.uid),
          where("courseId", "==", id),
        );
        const enrollSnap = await getDocs(enrollQuery);

        if (!enrollSnap.empty) {
          setIsEnrolled(true);
        } else {
          setIsEnrolled(false);
        }
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndCheckAccess();
  }, [id, currentUser, userData, navigate]);

  // 2. تسجيل تقدم الطالب وحفظ آخر حصة شاهدها لـ Dashboard
  useEffect(() => {
    const saveProgress = async () => {
      if (!currentUser || !activeLesson || !course || !isEnrolled) return;
      try {
        const progressDocId = `${currentUser.uid}_${id}`;
        await setDoc(
          doc(db, "userProgress", progressDocId),
          {
            studentId: currentUser.uid,
            courseId: id,
            lessonTitle: activeLesson.title,
            teacherName: course.teacherName || "مدرس المادة",
            lastWatched: new Date().toISOString(),
            progressPercent: Math.min(
              100,
              Math.round(
                ((lessons.findIndex((l) => l.title === activeLesson.title) +
                  1) /
                  (lessons.length || 1)) *
                  100,
              ),
            ),
          },
          { merge: true },
        );
      } catch (e) {
        console.error("Failed to update progress:", e);
      }
    };

    saveProgress();
  }, [activeLesson, currentUser, id, course, lessons, isEnrolled]);

  // 3. التحقق من أداء الامتحان مسبقاً
  useEffect(() => {
    const checkQuizSubmissionStatus = async () => {
      if (!currentUser || !activeLesson) return;

      try {
        const docId = `${currentUser.uid}_${id}_${activeLesson.title}_quiz`;
        const docRef = doc(db, "quizResults", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setHasSubmittedQuiz(true);
          setPreviousScore(docSnap.data().score);
        } else {
          setHasSubmittedQuiz(false);
          setPreviousScore(null);
        }
      } catch (err) {
        console.error("Error checking quiz submission:", err);
      }
    };

    checkQuizSubmissionStatus();
  }, [currentUser, activeLesson, id]);

  // 3ب. التحقق من تسليم الواجب مسبقاً
  useEffect(() => {
    const checkHomeworkSubmissionStatus = async () => {
      if (!currentUser || !activeLesson) return;

      try {
        const docId = `${currentUser.uid}_${id}_${activeLesson.title}_homework`;
        const docRef = doc(db, "homeworkSubmissions", docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setHasSubmittedHomework(true);
          setPreviousHomeworkScore(docSnap.data().score);
        } else {
          setHasSubmittedHomework(false);
          setPreviousHomeworkScore(null);
        }
      } catch (err) {
        console.error("Error checking homework submission:", err);
      }
    };

    checkHomeworkSubmissionStatus();
  }, [currentUser, activeLesson, id]);

  // 4. عد تنازلي لتايمر الامتحان فقط، وتسليم تلقائي لما الوقت يخلص
  useEffect(() => {
    if (
      !modalState.isOpen ||
      modalState.type !== "quiz" ||
      isSubmitted ||
      timeLeft === null
    ) {
      return;
    }

    if (timeLeft <= 0) {
      handleSubmitActivity();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : prev));
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalState.isOpen, modalState.type, isSubmitted, timeLeft]);

  const formatTime = (seconds) => {
    if (seconds === null) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const openActivityModal = (type) => {
    if (type === "quiz" && hasSubmittedQuiz) return;
    if (type === "homework" && hasSubmittedHomework) return;
    setUserAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setSaveError(null);
    setIsSaving(false);

    if (type === "quiz") {
      const minutes = activeLesson?.quizData?.timerMinutes || 20;
      setTimeLeft(minutes * 60);
    } else {
      setTimeLeft(null);
    }

    setModalState({ isOpen: true, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
    setTimeLeft(null);
    setSaveError(null);
  };

  const handleSubmitActivity = async () => {
    const activityType = modalState.type; // "quiz" or "homework"
    const questions =
      activityType === "quiz"
        ? activeLesson?.quizData?.questions || []
        : activeLesson?.homeworkData?.questions || [];

    let correctCount = 0;
    questions.forEach((q, idx) => {
      const correctOpt =
        q.correctOption !== undefined ? q.correctOption : q.correctIndex;
      if (userAnswers[idx] === correctOpt) {
        correctCount++;
      }
    });

    const submissionId = `${currentUser.uid}_${id}_${activeLesson.title}_${activityType}`;
    const collectionName =
      activityType === "quiz" ? "quizResults" : "homeworkSubmissions";

    // لو المستخدم عنده تسليم قبل كده لأي سبب (سباق تنفيذ)، منمنعوش يشوف نتيجته القديمة
    const alreadyDone =
      activityType === "quiz" ? hasSubmittedQuiz : hasSubmittedHomework;
    if (alreadyDone) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      await setDoc(doc(db, collectionName, submissionId), {
        studentId: currentUser.uid,
        studentName: userData?.fullName || "طالب",
        teacherId: course?.teacherId || null,
        courseId: id,
        courseTitle: course?.title || "كورس تعليمي",
        subject: course?.subject || "الفيزياء",
        lessonTitle: activeLesson.title,
        score: correctCount,
        totalMarks: questions.length,
        userAnswers: userAnswers,
        submittedAt: new Date().toISOString(),
      });

      // شاشة النجاح متظهرش غير لما الحفظ في Firestore ينجح فعلاً
      setScore(correctCount);
      setIsSubmitted(true);
      setTimeLeft(null);

      if (activityType === "quiz") {
        setHasSubmittedQuiz(true);
        setPreviousScore(correctCount);
      } else {
        setHasSubmittedHomework(true);
        setPreviousHomeworkScore(correctCount);
      }
    } catch (error) {
      console.error(`Error saving ${activityType} result:`, error);
      setSaveError(
        "حصل خطأ أثناء حفظ إجاباتك، تأكد من الاتصال بالإنترنت وحاول تاني.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B19] flex flex-col items-center justify-center text-indigo-400 space-y-3 font-black">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span>جاري التحقق من الصلاحيات وتحميل الكورس...</span>
      </div>
    );
  }

  if (!isEnrolled) {
    return (
      <div
        className="min-h-screen bg-[#070B19] text-white flex items-center justify-center p-4 font-sans"
        dir="rtl"
      >
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-rose-500/30 p-8 rounded-[2.5rem] max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-3xl flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black">عذراً، غير مسموح بالدخول!</h2>
            <p className="text-slate-400 text-xs leading-relaxed">
              أنت غير مشترك في هذا الكورس، أو أن طلب الاشتراك الخاص بك ما زال
              قيد المراجعة.
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-lg"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  const isSingleLesson = lessons.length <= 1;
  const currentQuestions =
    modalState.type === "quiz"
      ? activeLesson?.quizData?.questions || []
      : activeLesson?.homeworkData?.questions || [];

  const embedVideoUrl = getYouTubeEmbedUrl(activeLesson?.videoUrl);

  return (
    <div
      className="min-h-screen bg-[#070B19] text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden"
      dir="rtl"
    >
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer bg-slate-900/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 w-fit"
        >
          <ArrowRight className="w-4 h-4" /> <span>العودة إلى لوحة التحكم</span>
        </button>

        {/* هيدر الكورس */}
        <div className="bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />{" "}
              {course?.subject || "الفيزياء"}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {course?.title}
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2.5 rounded-2xl border border-slate-800 text-xs font-bold text-slate-300">
            <span>
              المحاضر:{" "}
              <strong className="text-white">
                {course?.teacherName || "مدرس المادة"}
              </strong>
            </span>
          </div>
        </div>

        <div
          className={`grid grid-cols-1 ${
            isSingleLesson ? "lg:grid-cols-1" : "lg:grid-cols-12"
          } gap-8 items-start`}
        >
          <div
            className={`${
              isSingleLesson ? "max-w-4xl mx-auto w-full" : "lg:col-span-8"
            } space-y-6`}
          >
            {/* بوكس الفيديو */}
            <div className="aspect-video bg-slate-950 rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-slate-800 flex items-center justify-center">
              {embedVideoUrl ? (
                <iframe
                  src={embedVideoUrl}
                  title={activeLesson?.title || "درس"}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-3 bg-gradient-to-br from-slate-900 to-indigo-950/50">
                  <Video className="w-8 h-8 text-indigo-400" />
                  <span className="text-xs font-bold text-slate-300">
                    {activeLesson
                      ? `تشغيل: ${activeLesson.title}`
                      : "اختر درساً"}
                  </span>
                </div>
              )}
            </div>

            {/* تفاصيل الدرس */}
            {activeLesson && (
              <div className="bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 rounded-[2.2rem] border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-black text-white">
                    {activeLesson.title}
                  </h2>
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl">
                    {activeLesson.duration || "فيديو تعليمي"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
                  {activeLesson.desc ||
                    course?.description ||
                    "لا توجد تفاصيل إضافية لهذا الدرس."}
                </p>
              </div>
            )}

            {/* أزرار الكويز والواجب */}
            {activeLesson && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-purple-950/30 backdrop-blur-xl p-6 rounded-[2.2rem] border border-purple-500/20 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        الامتحان الإلكتروني للحصة
                      </h4>
                      <p className="text-[11px] text-purple-300/70 font-bold mt-0.5">
                        {hasSubmittedQuiz
                          ? `✅ تم الاختبار مسبقاً (النتيجة: ${previousScore}/${
                              activeLesson.quizData?.questions?.length || 0
                            })`
                          : activeLesson.quizData?.questions?.length > 0
                            ? `${activeLesson.quizData.questions.length} أسئلة مضافة`
                            : "لا توجد أسئلة"}
                      </p>
                    </div>
                  </div>

                  {hasSubmittedQuiz ? (
                    <div className="w-full bg-slate-800/80 text-slate-400 py-3 rounded-xl font-black text-xs text-center flex items-center justify-center gap-2 cursor-not-allowed">
                      <Lock className="w-4 h-4" />{" "}
                      <span>تم أداء الاختبار ومغلق</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => openActivityModal("quiz")}
                      disabled={!activeLesson.quizData?.questions?.length}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-3 rounded-xl font-black text-xs transition-all shadow-lg cursor-pointer"
                    >
                      بدء الامتحان التفاعلي 🎯
                    </button>
                  )}
                </div>

                <div className="bg-amber-950/30 backdrop-blur-xl p-6 rounded-[2.2rem] border border-amber-500/20 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        الواجب الإلكتروني للحصة
                      </h4>
                      <p className="text-[11px] text-amber-300/70 font-bold mt-0.5">
                        {hasSubmittedHomework
                          ? `✅ تم تسليم الواجب (النتيجة: ${previousHomeworkScore}/${
                              activeLesson.homeworkData?.questions?.length || 0
                            })`
                          : activeLesson.homeworkData?.questions?.length > 0
                            ? `${activeLesson.homeworkData.questions.length} أسئلة واجب`
                            : "لا توجد أسئلة"}
                      </p>
                    </div>
                  </div>
                  {hasSubmittedHomework ? (
                    <div className="w-full bg-slate-800/80 text-slate-400 py-3 rounded-xl font-black text-xs text-center flex items-center justify-center gap-2 cursor-not-allowed">
                      <Lock className="w-4 h-4" /> <span>تم تسليم الواجب</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => openActivityModal("homework")}
                      disabled={!activeLesson.homeworkData?.questions?.length}
                      className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 py-3 rounded-xl font-black text-xs transition-all shadow-lg cursor-pointer"
                    >
                      بدء حل الواجب 📝
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {!isSingleLesson && (
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-800 p-6 shadow-xl space-y-4">
                <h3 className="font-black text-white flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-indigo-400" /> محتوى الكورس
                  ({lessons.length} دروس)
                </h3>
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {lessons.map((lesson, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer text-right border ${
                        activeLesson?.title === lesson.title
                          ? "bg-indigo-600/20 border-indigo-500/40 text-white"
                          : "bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <PlayCircle className="w-5 h-5 shrink-0" />
                        <span className="text-xs font-bold line-clamp-1">
                          {lesson.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* مودال الامتحان والواجب */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 sm:p-7 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black ${
                    modalState.type === "quiz"
                      ? "bg-purple-600"
                      : "bg-amber-500 text-slate-950"
                  }`}
                >
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {modalState.type === "quiz"
                      ? "امتحان تفاعلي مباشر"
                      : "حل الواجب المنزلي"}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mt-0.5">
                    {activeLesson?.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {modalState.type === "quiz" &&
                  !isSubmitted &&
                  timeLeft !== null && (
                    <div
                      className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 ${
                        timeLeft <= 30
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
                    </div>
                  )}
                <button
                  onClick={closeModal}
                  className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-rose-500 text-slate-400 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              {!isSubmitted ? (
                <div className="space-y-6">
                  {currentQuestions.map((q, qIndex) => (
                    <div
                      key={qIndex}
                      className="bg-slate-950/60 border border-slate-800 p-6 rounded-3xl space-y-4"
                    >
                      <span className="text-[11px] font-black bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-xl">
                        سؤال ({qIndex + 1} من {currentQuestions.length})
                      </span>
                      <p className="text-sm font-black text-white leading-relaxed">
                        {q.questionText}
                      </p>
                      {q.questionImage && (
                        <div className="rounded-2xl overflow-hidden border border-slate-800 max-h-48 w-fit bg-slate-900">
                          <img
                            src={q.questionImage}
                            alt="مسألة"
                            className="max-h-48 object-contain"
                          />
                        </div>
                      )}
                      <div className="grid grid-cols-1 gap-2.5 pt-2">
                        {q.options.map((opt, optIndex) => (
                          <label
                            key={optIndex}
                            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                              userAnswers[qIndex] === optIndex
                                ? "border-indigo-500 bg-indigo-600/10 text-white font-black"
                                : "border-slate-800 bg-slate-900/50 text-slate-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question_${qIndex}`}
                              checked={userAnswers[qIndex] === optIndex}
                              onChange={() =>
                                setUserAnswers({
                                  ...userAnswers,
                                  [qIndex]: optIndex,
                                })
                              }
                              className="w-4 h-4 text-indigo-600 cursor-pointer"
                            />
                            <span className="text-xs">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {saveError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-5 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold text-rose-300 leading-relaxed">
                        {saveError}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
                    <Award className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white">
                      تم تسليم الإجابات بنجاح! 🎉
                    </h2>
                    <p className="text-sm text-slate-300">
                      لقد حصلت على{" "}
                      <strong className="text-emerald-400 text-lg font-black">
                        {score}
                      </strong>{" "}
                      من{" "}
                      <strong className="text-white">
                        {currentQuestions.length}
                      </strong>
                    </p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-2xl font-black text-xs cursor-pointer shadow-lg"
                  >
                    إغلاق والعودة للحصة
                  </button>
                </div>
              )}
            </div>

            {!isSubmitted && (
              <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
                <button
                  onClick={closeModal}
                  disabled={isSaving}
                  className="px-5 py-3 rounded-xl text-xs font-black text-slate-400 hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                >
                  إغلاق
                </button>
                <button
                  onClick={handleSubmitActivity}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-8 py-3.5 rounded-2xl font-black text-xs shadow-lg cursor-pointer flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : saveError ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>إعادة المحاولة</span>
                    </>
                  ) : (
                    <span>تسليم الإجابات وإنهاء الاختبار 🚀</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursePlayer;
