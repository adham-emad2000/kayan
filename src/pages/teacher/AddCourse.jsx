import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  X,
  Clock,
  HelpCircle,
  FileCheck,
  Settings,
  Camera,
  Calendar,
  CalendarDays,
  Loader2,
  Link as LinkIcon,
  Video,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../../utils/cloudinary";

const AddCourse = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    grade: "", // 👈 حقل نصي حر للمدرس
    subject: userData?.subject || "الفيزياء",
    startDate: "",
    endDate: "",
    schedule: "ينزل كل سبت وأربعاء",
  });

  const [lessons, setLessons] = useState([
    {
      id: 1,
      title: "",
      videoType: "url",
      videoUrl: "",
      videoFile: null,
      duration: "",
      releaseDate: "",
      pdfUrl: "",
      notes: "",
      hasQuiz: false,
      quizData: { timerMinutes: 20, questions: [] },
      hasHomework: false,
      homeworkData: { questions: [] },
    },
  ]);

  const [builderModal, setBuilderModal] = useState({
    isOpen: false,
    type: "quiz",
    lessonIndex: null,
  });

  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentTimer, setCurrentTimer] = useState(20);

  const handleCourseChange = (e) => {
    setCourseData({ ...courseData, [e.target.name]: e.target.value });
  };

  const handleLessonChange = (id, field, value) => {
    setLessons(
      lessons.map((lesson) =>
        lesson.id === id ? { ...lesson, [field]: value } : lesson,
      ),
    );
  };

  const addLessonField = () => {
    setLessons([
      ...lessons,
      {
        id: Date.now(),
        title: "",
        videoType: "url",
        videoUrl: "",
        videoFile: null,
        duration: "",
        releaseDate: "",
        pdfUrl: "",
        notes: "",
        hasQuiz: false,
        quizData: { timerMinutes: 20, questions: [] },
        hasHomework: false,
        homeworkData: { questions: [] },
      },
    ]);
  };

  const removeLessonField = (id) => {
    if (lessons.length === 1) return;
    setLessons(lessons.filter((lesson) => lesson.id !== id));
  };

  const openQuestionsBuilder = (index, type) => {
    const lesson = lessons[index];
    if (type === "quiz") {
      setCurrentQuestions(lesson.quizData?.questions || []);
      setCurrentTimer(lesson.quizData?.timerMinutes || 20);
    } else {
      setCurrentQuestions(lesson.homeworkData?.questions || []);
    }
    setBuilderModal({ isOpen: true, type, lessonIndex: index });
  };

  const addNewQuestion = () => {
    setCurrentQuestions([
      ...currentQuestions,
      {
        id: Date.now(),
        questionText: "",
        questionImage: "",
        imageFile: null,
        options: ["", "", "", ""],
        correctOption: 0,
      },
    ]);
  };

  const handleQuestionImageUpload = (qIndex, file) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    const updated = [...currentQuestions];
    updated[qIndex].questionImage = previewUrl;
    updated[qIndex].imageFile = file;
    setCurrentQuestions(updated);
  };

  const saveQuestionsModal = () => {
    const updatedLessons = [...lessons];
    const index = builderModal.lessonIndex;

    if (builderModal.type === "quiz") {
      updatedLessons[index].quizData = {
        timerMinutes: Number(currentTimer) || 20,
        questions: currentQuestions,
      };
      updatedLessons[index].hasQuiz = currentQuestions.length > 0;
    } else {
      updatedLessons[index].homeworkData = {
        questions: currentQuestions,
      };
      updatedLessons[index].hasHomework = currentQuestions.length > 0;
    }

    setLessons(updatedLessons);
    setBuilderModal({ isOpen: false, type: "quiz", lessonIndex: null });
  };

  const handleThumbnailSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const uploadVideoToBunny = async (file, lessonTitle) => {
    const LIBRARY_ID = "734119";
    const API_KEY = "e181fd84-0ee3-4a28-829773ee9381-8322-4f6a";

    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          AccessKey: API_KEY,
        },
        body: JSON.stringify({ title: lessonTitle || "Lesson Video" }),
      },
    );
    const videoData = await createRes.json();
    const videoId = videoData.guid;

    if (!videoId) {
      throw new Error("فشل إنشاء سجل الفيديو على سيرفرات باني");
    }

    const uploadRes = await fetch(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          AccessKey: API_KEY,
        },
        body: file,
      },
    );

    if (!uploadRes.ok) {
      throw new Error("فشل رفع ملف الفيديو إلى السيرفر");
    }

    return `https://iframe.mediadelivery.net/embed/${LIBRARY_ID}/${videoId}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("يجب تسجيل الدخول أولاً لتنفيذ هذا الإجراء.");
      navigate("/login");
      return;
    }

    if (!courseData.title || !courseData.price) {
      alert("برجاء إدخال عنوان الكورس وسعر الاشتراك");
      return;
    }

    setLoading(true);
    setUploadStatus("جاري تجهيز ورفع بيانات الكورس...");

    try {
      let uploadedThumbnailUrl = "";
      if (thumbnailFile) {
        setUploadStatus("جاري رفع صورة الغلاف...");
        uploadedThumbnailUrl = await uploadToCloudinary(thumbnailFile);
      }

      setUploadStatus("جاري معالجة ورفع فيديوهات الحصص...");
      const processedLessons = await Promise.all(
        lessons
          .filter((l) => l.title.trim() !== "")
          .map(async (lesson, lessonIdx) => {
            let finalVideoUrl = lesson.videoUrl || "";

            if (lesson.videoType === "file" && lesson.videoFile) {
              setUploadStatus(
                `جاري رفع فيديو الحصة (${lessonIdx + 1}): ${lesson.title}...`,
              );
              finalVideoUrl = await uploadVideoToBunny(
                lesson.videoFile,
                lesson.title,
              );
            }

            const cleanLesson = {
              title: lesson.title,
              videoUrl: finalVideoUrl,
              duration: lesson.duration,
              releaseDate: lesson.releaseDate,
              pdfUrl: lesson.pdfUrl,
              notes: lesson.notes,
              hasQuiz: lesson.hasQuiz,
              quizData: lesson.quizData,
              hasHomework: lesson.hasHomework,
              homeworkData: lesson.homeworkData,
            };

            if (cleanLesson.quizData?.questions?.length > 0) {
              const uploadedQuizQuestions = await Promise.all(
                cleanLesson.quizData.questions.map(async (q) => {
                  let imgUrl = q.questionImage || "";
                  if (q.imageFile) {
                    imgUrl = await uploadToCloudinary(q.imageFile);
                  }
                  const { imageFile, ...restQ } = q;
                  return { ...restQ, questionImage: imgUrl };
                }),
              );
              cleanLesson.quizData.questions = uploadedQuizQuestions;
            }

            if (cleanLesson.homeworkData?.questions?.length > 0) {
              const uploadedHwQuestions = await Promise.all(
                cleanLesson.homeworkData.questions.map(async (q) => {
                  let imgUrl = q.questionImage || "";
                  if (q.imageFile) {
                    imgUrl = await uploadToCloudinary(q.imageFile);
                  }
                  const { imageFile, ...restQ } = q;
                  return { ...restQ, questionImage: imgUrl };
                }),
              );
              cleanLesson.homeworkData.questions = uploadedHwQuestions;
            }

            return cleanLesson;
          }),
      );

      // حساب السعر الأساسي للمدرس والسعر النهائي للطلاب مضاف إليه 10%
      const teacherBasePrice = Number(courseData.price) || 0;
      const finalStudentPrice = Math.round(teacherBasePrice * 1.1);

      setUploadStatus("جاري حفظ الكورس في قاعدة البيانات...");
      const courseRef = await addDoc(collection(db, "courses"), {
        title: courseData.title,
        description: courseData.description,
        price: finalStudentPrice,
        basePrice: teacherBasePrice,
        grade: courseData.grade || "عام", // حفظ النص الذي كتبه المدرس
        subject: courseData.subject,
        startDate: courseData.startDate || "",
        endDate: courseData.endDate || "",
        schedule: courseData.schedule || "ينزل أسبوعياً",
        thumbnailUrl: uploadedThumbnailUrl,
        teacherId: currentUser.uid,
        teacherName: userData?.fullName || "مدرس المنصة",
        studentsCount: 0,
        createdAt: new Date().toISOString(),
      });

      setUploadStatus("جاري حفظ الحصص والامتحانات...");
      await setDoc(doc(db, "courses", courseRef.id, "private", "lessons"), {
        lessons: processedLessons,
      });

      alert("تم نشر الكورس بكافة مواعيده وحصصه بنجاح!");
      navigate("/teacher/dashboard");
    } catch (error) {
      console.error("Error adding course:", error);
      alert("حدث خطأ أثناء إضافة الكورس: " + error.message);
    } finally {
      setLoading(false);
      setUploadStatus("");
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F0F4F8] text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white border-2 border-blue-100 rounded-[2.5rem] p-6 sm:p-8 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/teacher/dashboard"
              className="w-14 h-14 rounded-2xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border-2 border-blue-200 flex items-center justify-center transition-all shadow-sm cursor-pointer group"
            >
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                إنشاء كورس مع المواعيد والامتحانات
              </h1>
              <p className="text-sm text-slate-500 font-bold mt-0.5">
                حدد أيام النزول، فترة الكورس، وتفاصيل المحاضرات
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border-2 border-blue-100 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-blue-50 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  صورة غلاف الكورس
                </h2>
                <p className="text-xs text-slate-500 font-bold">
                  تظهر للطلاب في المتجر ولوحة التحكم
                </p>
              </div>
            </div>

            {thumbnailPreview ? (
              <div className="relative w-full rounded-3xl overflow-hidden border-2 border-blue-300 shadow-inner bg-slate-900 flex items-center justify-center p-2">
                <img
                  src={thumbnailPreview}
                  alt="غلاف"
                  className="w-full max-h-[400px] object-contain rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailPreview("");
                    setThumbnailFile(null);
                  }}
                  className="absolute top-4 left-4 bg-red-600 hover:bg-red-700 text-white p-3 rounded-2xl shadow-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 rounded-3xl border-3 border-dashed border-blue-200 hover:border-blue-600 bg-blue-50/40 hover:bg-blue-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-6 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-black text-slate-800">
                  اضغط هنا لاختيار صورة الغلاف
                </p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleThumbnailSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border-2 border-blue-100 shadow-md space-y-6">
            <div className="flex items-center gap-3 border-b-2 border-blue-50 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  البيانات ومواعيد نزول الكورس
                </h2>
                <p className="text-xs text-slate-500 font-bold">
                  حدد مدة الكورس وأيام نزول الحصص للطلاب
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-black text-slate-700 mb-2">
                  عنوان الكورس / الشهر الدراسي *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={courseData.title}
                  onChange={handleCourseChange}
                  placeholder="مثال: الشهر الأول: الفيزياء الحديثة وقوانين كيرشوف"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  سعر الكورس الأساسي (ج.م) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  value={courseData.price}
                  onChange={handleCourseChange}
                  placeholder="100"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 font-bold">
                  * سيظهر السعر للطلاب مضافاً إليه نسبة خدمات منصة كيان الإدارية
                  (10%). (مثال: 100 ستظهر للطلاب 110).
                </p>
              </div>

              {/* 👈 تم تحويل الصف الدراسي إلى Input نصي حر */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  الصف الدراسي / الفئة المستهدفة *
                </label>
                <input
                  type="text"
                  name="grade"
                  required
                  value={courseData.grade}
                  onChange={handleCourseChange}
                  placeholder="مثال: الصف الثالث الثانوي"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-black text-slate-700 mb-2 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>مواعيد نزول الحصص *</span>
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={courseData.schedule}
                  onChange={handleCourseChange}
                  placeholder="مثال: ينزل كل سبت وأربعاء الساعة 6 مساءً"
                  className="w-full bg-blue-50/50 border-2 border-blue-200 focus:border-blue-600 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>تاريخ بداية الكورس</span>
                </label>
                <input
                  type="text"
                  name="startDate"
                  value={courseData.startDate}
                  onChange={handleCourseChange}
                  placeholder="مثال: 1 أكتوبر 2026"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 mb-2 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <span>تاريخ نهاية الكورس</span>
                </label>
                <input
                  type="text"
                  name="endDate"
                  value={courseData.endDate}
                  onChange={handleCourseChange}
                  placeholder="مثال: 31 أكتوبر 2026"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-black text-slate-700 mb-2">
                  وصف وتفاصيل الكورس
                </label>
                <textarea
                  name="description"
                  rows="2"
                  value={courseData.description}
                  onChange={handleCourseChange}
                  placeholder="اكتب نبذة عن الدروس والواجبات المشمولة في هذا الشهر..."
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3 px-4 text-sm font-bold text-slate-800 focus:outline-none resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                محاضرات وحصص الكورس ({lessons.length})
              </h2>
              <button
                type="button"
                onClick={addLessonField}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-sm font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>إضافة حصة جديدة</span>
              </button>
            </div>

            <div className="space-y-6">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="bg-white rounded-[2.5rem] p-7 sm:p-8 border-2 border-blue-100 shadow-md space-y-6"
                >
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h3 className="text-base font-black text-slate-900">
                        بيانات الحصة ({index + 1})
                      </h3>
                    </div>

                    {lessons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLessonField(lesson.id)}
                        className="text-red-500 hover:bg-red-50 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-slate-700 mb-2">
                        عنوان الحصة *
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: المحاضرة 1 - مدخل المتجهات"
                        value={lesson.title}
                        onChange={(e) =>
                          handleLessonChange(lesson.id, "title", e.target.value)
                        }
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-2 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>يوم نزول الحصة</span>
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: السبت 5 أكتوبر"
                        value={lesson.releaseDate}
                        onChange={(e) =>
                          handleLessonChange(
                            lesson.id,
                            "releaseDate",
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-3 pt-2 border-t border-slate-100">
                      <label className="block text-xs font-black text-slate-700">
                        طريقة إضافة فيديو الحصة *
                      </label>

                      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
                        <button
                          type="button"
                          onClick={() =>
                            handleLessonChange(lesson.id, "videoType", "url")
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                            lesson.videoType !== "file"
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          <LinkIcon className="w-4 h-4" />
                          <span>رابط فيديو</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleLessonChange(lesson.id, "videoType", "file")
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                            lesson.videoType === "file"
                              ? "bg-white text-blue-600 shadow-sm"
                              : "text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          <Video className="w-4 h-4" />
                          <span>رفع ملف فيديو من الجهاز</span>
                        </button>
                      </div>

                      {lesson.videoType === "file" ? (
                        <div className="space-y-3 pt-1">
                          <label className="w-full h-36 rounded-2xl border-3 border-dashed border-indigo-200 hover:border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                              <Upload className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-black text-slate-800">
                              {lesson.videoFile
                                ? `تم اختيار: ${lesson.videoFile.name}`
                                : "اضغط هنا لاختيار ملف الفيديو (MP4, MKV, AVI)"}
                            </span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  handleLessonChange(
                                    lesson.id,
                                    "videoFile",
                                    file,
                                  );
                                }
                              }}
                            />
                          </label>

                          {lesson.videoFile && (
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-black text-emerald-800">
                              <span>✅ جاهز للرفع أوتوماتيكياً عند النشر</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleLessonChange(
                                    lesson.id,
                                    "videoFile",
                                    null,
                                  )
                                }
                                className="text-red-600 hover:underline cursor-pointer"
                              >
                                إزالة الملف
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            value={lesson.videoUrl}
                            onChange={(e) =>
                              handleLessonChange(
                                lesson.id,
                                "videoUrl",
                                e.target.value,
                              )
                            }
                            className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-800 focus:outline-none font-mono"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-2">
                        مدة الحصة
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: 45 دقيقة"
                        value={lesson.duration}
                        onChange={(e) =>
                          handleLessonChange(
                            lesson.id,
                            "duration",
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 px-4 text-sm font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-slate-100">
                    <div className="p-5 rounded-2xl bg-purple-50/60 border-2 border-purple-200 flex flex-col justify-between gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <HelpCircle className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="font-black text-xs text-slate-900">
                              امتحان إلكتروني للحصة
                            </p>
                            <p className="text-[11px] text-slate-500 font-bold">
                              {lesson.quizData?.questions?.length > 0
                                ? `مضاف ${lesson.quizData.questions.length} سؤال • تايمر: ${lesson.quizData.timerMinutes} د`
                                : "لا يوجد امتحان بعد"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openQuestionsBuilder(index, "quiz")}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 cursor-pointer transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        <span>إعداد وتعديل أسئلة الامتحان</span>
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-50/60 border-2 border-amber-200 flex flex-col justify-between gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <FileCheck className="w-5 h-5 text-amber-600" />
                          <div>
                            <p className="font-black text-xs text-slate-900">
                              واجب إلكتروني للحصة
                            </p>
                            <p className="text-[11px] text-slate-500 font-bold">
                              {lesson.homeworkData?.questions?.length > 0
                                ? `مضاف ${lesson.homeworkData.questions.length} سؤال واجب`
                                : "لا يوجد واجب إلكتروني بعد"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openQuestionsBuilder(index, "homework")}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                      >
                        <Settings className="w-4 h-4" />
                        <span>إعداد وتعديل أسئلة الواجب</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/30 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <>
                <div className="flex items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>جاري معالجة ونشر الكورس...</span>
                </div>
                {uploadStatus && (
                  <span className="text-xs font-bold text-blue-100 bg-blue-700/60 px-4 py-1 rounded-full">
                    {uploadStatus}
                  </span>
                )}
              </>
            ) : (
              "نشر الكورس بكافة المواعيد والحصص الآن"
            )}
          </button>
        </form>
      </div>

      {builderModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] border-2 border-blue-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 sm:p-8 border-b-2 border-slate-100 flex items-center justify-between bg-[#FAF9FD]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl ${
                    builderModal.type === "quiz"
                      ? "bg-purple-600"
                      : "bg-amber-500"
                  } text-white flex items-center justify-center shadow-md`}
                >
                  {builderModal.type === "quiz" ? (
                    <HelpCircle className="w-6 h-6" />
                  ) : (
                    <FileCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    منشئ{" "}
                    {builderModal.type === "quiz"
                      ? "الامتحان الإلكتروني"
                      : "الواجب الإلكتروني"}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold">
                    الحصة رقم {(builderModal.lessonIndex || 0) + 1}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setBuilderModal({
                    isOpen: false,
                    type: "quiz",
                    lessonIndex: null,
                  })
                }
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
              {builderModal.type === "quiz" && (
                <div className="bg-purple-50 border-2 border-purple-200 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        وقت الامتحان (التايمر)
                      </h4>
                      <p className="text-xs text-slate-500 font-bold">
                        يقفل الامتحان تلقائياً عند انتهاء الوقت
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentTimer}
                      onChange={(e) => setCurrentTimer(e.target.value)}
                      className="w-24 bg-white border-2 border-purple-300 rounded-xl py-2 px-3 text-center font-black text-sm text-purple-900 focus:outline-none"
                    />
                    <span className="text-xs font-black text-purple-900">
                      دقيقة
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {currentQuestions.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    className="p-6 rounded-3xl bg-slate-50 border-2 border-slate-200 space-y-5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                      <span className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-xl">
                        سؤال ({qIndex + 1})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentQuestions(
                            currentQuestions.filter((_, i) => i !== qIndex),
                          )
                        }
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>حذف السؤال</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-xs font-black text-slate-700">
                        نص السؤال:
                      </label>
                      <textarea
                        rows="2"
                        value={q.questionText}
                        onChange={(e) => {
                          const updated = [...currentQuestions];
                          updated[qIndex].questionText = e.target.value;
                          setCurrentQuestions(updated);
                        }}
                        placeholder="اكتب السؤال هنا..."
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl p-3.5 text-xs font-bold focus:border-blue-600 focus:outline-none"
                      ></textarea>

                      <div>
                        {q.questionImage ? (
                          <div className="relative w-48 h-32 rounded-xl overflow-hidden border-2 border-blue-200">
                            <img
                              src={q.questionImage}
                              alt="مسألة"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...currentQuestions];
                                updated[qIndex].questionImage = "";
                                updated[qIndex].imageFile = null;
                                setCurrentQuestions(updated);
                              }}
                              className="absolute top-1 left-1 bg-red-600 text-white p-1 rounded-lg"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <label className="inline-flex items-center gap-2 bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                            <Camera className="w-4 h-4 text-blue-600" />
                            <span>إرفاق صورة مسألة / رسمة بيانية</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                handleQuestionImageUpload(
                                  qIndex,
                                  e.target.files[0],
                                )
                              }
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-black text-slate-700">
                        الاختيارات (حدد الدائرة عند الإجابة الصحيحة):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                              q.correctOption === optIndex
                                ? "border-emerald-500 bg-emerald-50/50"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct_${qIndex}`}
                              checked={q.correctOption === optIndex}
                              onChange={() => {
                                const updated = [...currentQuestions];
                                updated[qIndex].correctOption = optIndex;
                                setCurrentQuestions(updated);
                              }}
                              className="w-4 h-4 text-emerald-600 cursor-pointer"
                            />
                            <input
                              type="text"
                              placeholder={`الاختيار (${optIndex + 1})`}
                              value={opt}
                              onChange={(e) => {
                                const updated = [...currentQuestions];
                                updated[qIndex].options[optIndex] =
                                  e.target.value;
                                setCurrentQuestions(updated);
                              }}
                              className="w-full text-xs font-bold bg-transparent focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addNewQuestion}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-blue-400 hover:border-blue-600 bg-blue-50/40 text-blue-600 font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة سؤال جديد</span>
              </button>
            </div>

            <div className="p-6 border-t-2 border-slate-100 bg-white flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setBuilderModal({
                    isOpen: false,
                    type: "quiz",
                    lessonIndex: null,
                  })
                }
                className="px-6 py-3 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={saveQuestionsModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs shadow-md shadow-blue-600/30 cursor-pointer"
              >
                حفظ وإرفاق بالحصة ({currentQuestions.length} سؤال)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCourse;
