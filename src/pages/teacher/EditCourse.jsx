import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
  Save,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../../utils/cloudinary";

const EditCourse = () => {
  const { id } = useParams();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");

  const [courseData, setCourseData] = useState({
    title: "",
    description: "",
    price: "",
    grade: "الصف الأول الثانوي",
    subject: "الفيزياء",
    startDate: "",
    endDate: "",
    schedule: "ينزل كل سبت وأربعاء",
  });

  const [lessons, setLessons] = useState([]);
  const [builderModal, setBuilderModal] = useState({
    isOpen: false,
    type: "quiz",
    lessonIndex: null,
  });

  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentTimer, setCurrentTimer] = useState(20);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const docRef = doc(db, "courses", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          alert("الكورس غير موجود!");
          navigate("/teacher/courses");
          return;
        }

        const data = docSnap.data();
        if (data.teacherId !== currentUser?.uid && userData?.role !== "admin") {
          alert("غير مصرح لك بتعديل هذا الكورس.");
          navigate("/teacher/dashboard");
          return;
        }

        setCourseData({
          title: data.title || "",
          description: data.description || "",
          price: data.price || "",
          grade: data.grade || "الصف الأول الثانوي",
          subject: data.subject || "الفيزياء",
          startDate: data.startDate || "",
          endDate: data.endDate || "",
          schedule: data.schedule || "ينزل أسبوعياً",
        });

        setThumbnailPreview(data.thumbnailUrl || "");

        // الدروس (فيديو + أسئلة الامتحان/الواجب) بقت متخزنة في مستند منفصل
        // عشان الطلاب اللي مش مشتركين ميقدروش يشوفوا الإجابات الصحيحة
        const lessonsDocRef = doc(db, "courses", id, "private", "lessons");
        const lessonsSnap = await getDoc(lessonsDocRef);
        setLessons(
          lessonsSnap.exists() ? lessonsSnap.data().lessons || [] : [],
        );
      } catch (err) {
        console.error("Error fetching course:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id, currentUser, userData, navigate]);

  const handleCourseChange = (e) => {
    setCourseData({ ...courseData, [e.target.name]: e.target.value });
  };

  const handleLessonChange = (lessonId, field, value) => {
    setLessons(
      lessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, [field]: value } : lesson,
      ),
    );
  };

  const addLessonField = () => {
    setLessons([
      ...lessons,
      {
        id: Date.now(),
        title: "",
        videoUrl: "",
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

  const removeLessonField = (lessonId) => {
    if (lessons.length === 1) return;
    setLessons(lessons.filter((lesson) => lesson.id !== lessonId));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseData.title || !courseData.price) {
      alert("برجاء ملء البيانات الأساسية للكورس.");
      return;
    }

    setSaving(true);
    try {
      let finalThumbnailUrl = thumbnailPreview;

      if (thumbnailFile) {
        finalThumbnailUrl = await uploadToCloudinary(thumbnailFile);
      }

      const processedLessons = await Promise.all(
        lessons
          .filter((l) => l.title.trim() !== "")
          .map(async (lesson) => {
            const cleanLesson = { ...lesson };

            if (cleanLesson.quizData?.questions?.length > 0) {
              cleanLesson.quizData.questions = await Promise.all(
                cleanLesson.quizData.questions.map(async (q) => {
                  let imgUrl = q.questionImage || "";
                  if (q.imageFile) {
                    imgUrl = await uploadToCloudinary(q.imageFile);
                  }
                  const { imageFile, ...restQ } = q;
                  return { ...restQ, questionImage: imgUrl };
                }),
              );
            }

            if (cleanLesson.homeworkData?.questions?.length > 0) {
              cleanLesson.homeworkData.questions = await Promise.all(
                cleanLesson.homeworkData.questions.map(async (q) => {
                  let imgUrl = q.questionImage || "";
                  if (q.imageFile) {
                    imgUrl = await uploadToCloudinary(q.imageFile);
                  }
                  const { imageFile, ...restQ } = q;
                  return { ...restQ, questionImage: imgUrl };
                }),
              );
            }

            return cleanLesson;
          }),
      );

      // 1. بيانات الكورس العامة فقط (من غير حقل lessons خالص)
      await updateDoc(doc(db, "courses", id), {
        title: courseData.title,
        description: courseData.description,
        price: Number(courseData.price),
        grade: courseData.grade,
        subject: courseData.subject,
        startDate: courseData.startDate || "",
        endDate: courseData.endDate || "",
        schedule: courseData.schedule || "ينزل أسبوعياً",
        thumbnailUrl: finalThumbnailUrl,
        updatedAt: new Date().toISOString(),
      });

      // 2. الدروس (فيديو + أسئلة + إجابات) في مستندها الخاص المنفصل
      await setDoc(
        doc(db, "courses", id, "private", "lessons"),
        { lessons: processedLessons },
        { merge: true },
      );

      alert("تم تحديث بيانات الكورس بنجاح!");
      navigate("/teacher/courses");
    } catch (error) {
      console.error("Error updating course:", error);
      alert("حدث خطأ أثناء التحديث: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center font-bold text-blue-600">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F0F4F8] text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans"
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white border-2 border-blue-100 rounded-[2.5rem] p-6 sm:p-8 shadow-md flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/teacher/courses"
              className="w-14 h-14 rounded-2xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white border-2 border-blue-200 flex items-center justify-center transition-all shadow-sm cursor-pointer group"
            >
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                تعديل الكورس
              </h1>
              <p className="text-sm text-slate-500 font-bold mt-0.5">
                تعديل تفاصيل المحاضرات، الأسعار، ومواعيد النزول
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
              <div className="relative w-full h-64 rounded-3xl overflow-hidden border-2 border-blue-300 shadow-inner">
                <img
                  src={thumbnailPreview}
                  alt="غلاف"
                  className="w-full h-full object-cover"
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
                <Upload className="w-8 h-8 text-blue-600" />
                <p className="text-sm font-black text-slate-800">
                  اضغط لاختيار صورة غلاف جديدة
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
                  البيانات ومواعيد النزول
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-black text-slate-700 mb-2">
                  عنوان الكورس *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={courseData.title}
                  onChange={handleCourseChange}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  سعر الكورس (ج.م) *
                </label>
                <input
                  type="number"
                  name="price"
                  required
                  value={courseData.price}
                  onChange={handleCourseChange}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2">
                  الصف الدراسي *
                </label>
                <select
                  name="grade"
                  value={courseData.grade}
                  onChange={handleCourseChange}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-4 px-4 text-sm font-bold text-slate-800 focus:outline-none"
                >
                  <option value="الصف الأول الثانوي">الصف الأول الثانوي</option>
                  <option value="الصف الثاني الثانوي">
                    الصف الثاني الثانوي
                  </option>
                  <option value="الصف الثالث الثانوي">
                    الصف الثالث الثانوي
                  </option>
                </select>
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
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold"
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
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-black text-slate-700 mb-2">
                  وصف الكورس
                </label>
                <textarea
                  name="description"
                  rows="2"
                  value={courseData.description}
                  onChange={handleCourseChange}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900">
                حصص ومحاضرات الكورس ({lessons.length})
              </h2>
              <button
                type="button"
                onClick={addLessonField}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-2xl text-sm font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>إضافة حصة</span>
              </button>
            </div>

            <div className="space-y-6">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id || index}
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
                        value={lesson.title}
                        onChange={(e) =>
                          handleLessonChange(lesson.id, "title", e.target.value)
                        }
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-2">
                        يوم النزول
                      </label>
                      <input
                        type="text"
                        value={lesson.releaseDate}
                        onChange={(e) =>
                          handleLessonChange(
                            lesson.id,
                            "releaseDate",
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black text-slate-700 mb-2">
                        رابط الفيديو *
                      </label>
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
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-2">
                        مدة الحصة
                      </label>
                      <input
                        type="text"
                        value={lesson.duration}
                        onChange={(e) =>
                          handleLessonChange(
                            lesson.id,
                            "duration",
                            e.target.value,
                          )
                        }
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-3.5 px-4 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-slate-100">
                    <div className="p-5 rounded-2xl bg-purple-50/60 border-2 border-purple-200 flex flex-col justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <HelpCircle className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="font-black text-xs text-slate-900">
                            امتحان الحصة
                          </p>
                          <p className="text-[11px] text-slate-500 font-bold">
                            {lesson.quizData?.questions?.length > 0
                              ? `مضاف ${lesson.quizData.questions.length} أسئلة`
                              : "لا يوجد امتحان"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openQuestionsBuilder(index, "quiz")}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" /> تعديل الامتحان
                      </button>
                    </div>

                    <div className="p-5 rounded-2xl bg-amber-50/60 border-2 border-amber-200 flex flex-col justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="w-5 h-5 text-amber-600" />
                        <div>
                          <p className="font-black text-xs text-slate-900">
                            واجب الحصة
                          </p>
                          <p className="text-[11px] text-slate-500 font-bold">
                            {lesson.homeworkData?.questions?.length > 0
                              ? `مضاف ${lesson.homeworkData.questions.length} أسئلة`
                              : "لا يوجد واجب"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openQuestionsBuilder(index, "homework")}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" /> تعديل الواجب
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-3 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>جاري حفظ التعديلات...</span>
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                <span>حفظ التعديلات ونشر الكورس</span>
              </>
            )}
          </button>
        </form>
      </div>

      {builderModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] border-2 border-blue-200 max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#FAF9FD]">
              <h2 className="text-xl font-black text-slate-900">
                منشئ{" "}
                {builderModal.type === "quiz"
                  ? "الامتحان الإلكتروني"
                  : "الواجب الإلكتروني"}
              </h2>
              <button
                type="button"
                onClick={() =>
                  setBuilderModal({
                    isOpen: false,
                    type: "quiz",
                    lessonIndex: null,
                  })
                }
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {builderModal.type === "quiz" && (
                <div className="bg-purple-50 p-4 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900">
                    مدة الامتحان (بالدقائق):
                  </span>
                  <input
                    type="number"
                    value={currentTimer}
                    onChange={(e) => setCurrentTimer(e.target.value)}
                    className="w-20 bg-white border border-purple-300 rounded-xl p-2 text-center font-black text-xs"
                  />
                </div>
              )}

              <div className="space-y-4">
                {currentQuestions.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-blue-600">
                        سؤال ({qIndex + 1})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentQuestions(
                            currentQuestions.filter((_, i) => i !== qIndex),
                          )
                        }
                        className="text-red-500 text-xs font-bold"
                      >
                        حذف
                      </button>
                    </div>

                    <textarea
                      rows="2"
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...currentQuestions];
                        updated[qIndex].questionText = e.target.value;
                        setCurrentQuestions(updated);
                      }}
                      placeholder="نص السؤال..."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold"
                    />

                    <div>
                      {q.questionImage ? (
                        <div className="relative w-36 h-24 rounded-lg overflow-hidden border">
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
                            className="absolute top-1 left-1 bg-red-600 text-white p-1 rounded-md"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <label className="inline-flex items-center gap-2 bg-white border border-dashed border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer">
                          <Camera className="w-3.5 h-3.5 text-blue-600" />
                          <span>إرفاق صورة مسألة</span>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                            q.correctOption === optIndex
                              ? "border-emerald-500 bg-emerald-50/50"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct_edit_${qIndex}`}
                            checked={q.correctOption === optIndex}
                            onChange={() => {
                              const updated = [...currentQuestions];
                              updated[qIndex].correctOption = optIndex;
                              setCurrentQuestions(updated);
                            }}
                          />
                          <input
                            type="text"
                            placeholder={`خيار (${optIndex + 1})`}
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
                ))}
              </div>

              <button
                type="button"
                onClick={addNewQuestion}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-blue-400 text-blue-600 font-black text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> إضافة سؤال جديد
              </button>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setBuilderModal({
                    isOpen: false,
                    type: "quiz",
                    lessonIndex: null,
                  })
                }
                className="px-6 py-2.5 text-xs font-bold text-slate-500"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={saveQuestionsModal}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-black text-xs"
              >
                حفظ وإرفاق بالحصة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCourse;
