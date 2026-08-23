import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Clock,
  Award,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  FileCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";

const Quiz = () => {
  const { id } = useParams(); // quizId
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [loading, setLoading] = useState(true);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(5 * 60); // 5 دقائق

  // بيانات الكويز (يفضل لاحقاً تجيبها من Firestore)
  const quizData = {
    title: "كويز سريع: قانون أوم والجهد الكهربي",
    durationMinutes: 5,
    questions: [
      {
        id: 1,
        question:
          "ما هو القانون الأساسي الذي يربط بين فرق الجهد (V) والشدة (I) والمقاومة (R)؟",
        options: ["V = I × R", "I = V × R²", "R = V + I", "V = I / R"],
        correctIndex: 0,
      },
      {
        id: 2,
        question: "وحدة قياس المقاومة الكهربية في النظام الدولي هي:",
        options: ["فولت (Volt)", "أوم (Ohm)", "أمبير (Ampere)", "وات (Watt)"],
        correctIndex: 1,
      },
    ],
  };

  // التأكد مما إذا كان الطالب قد حل هذا الكويز مسبقاً من قاعدة البيانات
  useEffect(() => {
    const checkAlreadySolved = async () => {
      if (!currentUser) return;
      try {
        const q = query(
          collection(db, "studentQuizAttempts"),
          where("studentId", "==", currentUser.uid),
          where("quizId", "==", id),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setAlreadyCompleted(true);
        }
      } catch (error) {
        console.error("Error checking attempt:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAlreadySolved();
  }, [currentUser, id]);

  // التايمر
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted && !alreadyCompleted && !loading) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isSubmitted && !alreadyCompleted) {
      handleSubmitQuiz();
    }
  }, [timeLeft, isSubmitted, alreadyCompleted, loading]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleSelectOption = (optIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: optIndex,
    });
  };

  const handleSubmitQuiz = async () => {
    let calculatedScore = 0;
    quizData.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctIndex) {
        calculatedScore += 1;
      }
    });

    setLoading(true);
    try {
      // حفظ النتيجة في الفايربيز
      await addDoc(collection(db, "studentQuizAttempts"), {
        studentId: currentUser.uid,
        studentName: userData?.fullName || "طالب",
        quizId: id,
        quizTitle: quizData.title,
        score: calculatedScore,
        totalQuestions: quizData.questions.length,
        submittedAt: new Date().toISOString(),
      });
      setScore(calculatedScore);
      setIsSubmitted(true);
    } catch (error) {
      alert("حدث خطأ أثناء حفظ النتيجة، حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  // شاشات العرض
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-black">
        جاري التحميل...
      </div>
    );

  if (alreadyCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F4EF]">
        <div className="bg-white p-8 rounded-[2rem] text-center shadow-lg border border-red-100">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-black mb-2">لا يمكنك دخول الاختبار</h1>
          <p className="text-xs text-slate-500 mb-6">
            لقد قمت بحل هذا الاختبار مسبقاً.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black"
          >
            العودة للخلف
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    const percent = Math.round((score / quizData.questions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F7F4EF]">
        <div className="bg-white p-8 rounded-[2rem] text-center shadow-lg w-full max-w-sm">
          <Award className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-black">تم تسليم الاختبار!</h1>
          <div className="my-6 p-4 bg-slate-50 rounded-2xl">
            <p className="text-3xl font-black">
              {score} / {quizData.questions.length}
            </p>
            <p className="text-xs font-bold text-amber-600">
              النسبة: {percent}%
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#F7F4EF] py-8 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-[2rem] border border-[#E6E1D6] flex justify-between items-center">
          <h1 className="font-black text-sm">{quizData.title}</h1>
          <div className="bg-slate-100 px-4 py-2 rounded-xl font-black text-xs text-red-600 flex items-center gap-2">
            <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-[#E6E1D6]">
          <p className="font-black text-slate-400 text-xs mb-4">
            سؤال {currentQuestionIndex + 1} من {quizData.questions.length}
          </p>
          <h2 className="text-lg font-black mb-6">
            {currentQuestion.question}
          </h2>
          <div className="space-y-3">
            {currentQuestion.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl text-right font-bold text-xs border-2 transition-all ${
                  selectedAnswers[currentQuestionIndex] === idx
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))}
              className="px-6 py-3 bg-slate-100 rounded-xl text-xs font-black"
            >
              السابق
            </button>
            {currentQuestionIndex < quizData.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((p) => p + 1)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black"
              >
                التالي
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="px-6 py-3 bg-green-600 text-white rounded-xl text-xs font-black"
              >
                إرسال الاختبار
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
