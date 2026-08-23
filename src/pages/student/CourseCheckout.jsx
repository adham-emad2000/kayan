import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Upload,
  BookOpen,
  X,
  Flame,
  Loader2,
  Clock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { uploadToCloudinary } from "../../utils/cloudinary";
import defaultCourseImage from "../../image.png";

const CourseCheckout = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyPending, setAlreadyPending] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("vodafone");
  const [senderNumber, setSenderNumber] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchCourseAndCheckPending = async () => {
      try {
        const docRef = doc(db, "courses", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          setCourse(null);
        }

        if (currentUser) {
          const pendingQuery = query(
            collection(db, "enrollmentRequests"),
            where("studentId", "==", currentUser.uid),
            where("courseId", "==", id),
            where("status", "==", "pending"),
          );
          const pendingSnap = await getDocs(pendingQuery);
          if (!pendingSnap.empty) {
            setAlreadyPending(true);
          }
        }
      } catch (error) {
        console.error("Error fetching checkout details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndCheckPending();
  }, [id, currentUser]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptFile(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const handleCompletePayment = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("يجب تسجيل الدخول أولاً كطالب لإرسال طلب الاشتراك.");
      navigate("/login");
      return;
    }

    if (!receiptFile) {
      alert("برجاء إرفاق صورة إيصال التحويل أولاً");
      return;
    }

    setSubmitting(true);
    try {
      const uploadedReceiptUrl = await uploadToCloudinary(receiptFile);

      await addDoc(collection(db, "enrollmentRequests"), {
        studentId: currentUser.uid,
        studentName: userData?.fullName || "طالب مسجل",
        studentEmail: currentUser.email || "",
        studentPhone: userData?.phone || senderNumber,
        courseId: course.id,
        courseTitle: course.title,
        teacherId: course.teacherId || "",
        teacherName: course.teacherName || "مدرس المنصة",
        amount: Number(course.price) || 0,
        paymentMethod: paymentMethod,
        senderNumber: senderNumber,
        receiptUrl: uploadedReceiptUrl,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting enrollment:", error);
      alert("حدث خطأ أثناء إرسال الطلب: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-[#070B0E] flex items-center justify-center font-black text-emerald-400 text-base font-sans"
        dir="rtl"
      >
        <div className="flex items-center gap-3 bg-[#0E161B] border border-emerald-500/20 px-8 py-4 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.15)]">
          <div className="w-5 h-5 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span>جاري فتح بوابة الدفع...</span>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div
        className="min-h-screen bg-[#070B0E] text-white flex flex-col items-center justify-center p-6 text-center font-sans"
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">
          الكورس غير موجود أو غير متاح حالياً!
        </h2>
        <button
          onClick={() => navigate("/dashboard")}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-black text-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/30 mt-4"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  if (alreadyPending) {
    return (
      <div
        className="relative bg-[#070B0E] min-h-screen flex items-center justify-center py-12 px-4 font-sans overflow-hidden"
        dir="rtl"
      >
        <div className="pointer-events-none absolute w-96 h-96 rounded-full bg-amber-500/15 blur-[140px]" />

        <div className="relative z-10 bg-[#0E161B]/90 backdrop-blur-2xl border border-amber-500/30 text-white rounded-[2.5rem] p-8 sm:p-12 max-w-lg w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-lg">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white">
              طلبك قيد المراجعة حالياً! ⏳
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              لقد قمت بإرسال إيصال الاشتراك لكورس (
              <strong className="text-amber-400 font-black">
                {course.title}
              </strong>
              ) مسبقاً، وجاري مراجعته من الإدارة لتفعيل الكورس فوراً.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-2xl text-sm transition-all shadow-lg cursor-pointer"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div
        className="relative bg-[#070B0E] min-h-screen flex items-center justify-center py-12 px-4 font-sans overflow-hidden"
        dir="rtl"
      >
        <div className="pointer-events-none absolute w-96 h-96 rounded-full bg-emerald-500/20 blur-[140px]" />

        <div className="relative z-10 bg-[#0E161B]/90 backdrop-blur-2xl border border-emerald-500/30 text-white rounded-[2.5rem] p-8 sm:p-12 max-w-lg w-full text-center space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              تم إرسال طلب الاشتراك بنجاح! 🎉
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              جاري مراجعة إيصال التحويل من قِبل إدارة المنصة، وسيتم تفعيل كورس (
              <strong className="text-emerald-400 font-black">
                {course.title}
              </strong>
              ) في لوحة تحكمك فوراً.
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-4 rounded-2xl text-sm transition-all shadow-[0_0_35px_rgba(16,185,129,0.4)] cursor-pointer"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  const courseImage = course.thumbnailUrl || defaultCourseImage;
  const coursePrice = Number(course.price) || 0;

  return (
    <div
      className="relative min-h-screen bg-[#070B0E] text-white font-sans py-10 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-emerald-500 selection:text-black"
      dir="rtl"
    >
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/15 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-teal-500/10 blur-[150px]" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-black text-slate-300 hover:text-emerald-400 transition-all cursor-pointer bg-[#0E161B]/80 hover:bg-[#131D24] px-5 py-2.5 rounded-2xl border border-white/10 hover:border-emerald-500/30 w-fit backdrop-blur-xl shadow-lg shadow-black/40 group"
        >
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-emerald-400" />
          <span>العودة للتفاصيل</span>
        </button>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-black border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>بوابة الدفع الآمنة</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            تأكيد الاشتراك ورفع الإيصال
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-[#0E161B]/85 backdrop-blur-2xl border border-emerald-500/20 text-white rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            <h2 className="text-base font-black flex items-center gap-2 text-white">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <span>اختر وسيلة الدفع وحول المبلغ</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("vodafone")}
                className={`p-4 rounded-2xl border text-center font-black text-xs transition-all flex flex-col items-center gap-2 cursor-pointer ${
                  paymentMethod === "vodafone"
                    ? "bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Smartphone className="w-6 h-6" />
                <span>فودافون كاش</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("instapay")}
                className={`p-4 rounded-2xl border text-center font-black text-xs transition-all flex flex-col items-center gap-2 cursor-pointer ${
                  paymentMethod === "instapay"
                    ? "bg-emerald-500/15 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                <Sparkles className="w-6 h-6" />
                <span>InstaPay</span>
              </button>
            </div>

            <div className="bg-[#070B0E] p-5 rounded-2xl border border-emerald-500/20 space-y-2.5 text-xs">
              <p className="font-black text-emerald-400">
                تعليمات تحويل الأموال:
              </p>
              {paymentMethod === "vodafone" ? (
                <p className="text-slate-300 leading-relaxed">
                  قم بتحويل مبلغ{" "}
                  <strong className="text-white font-black">
                    {coursePrice} ج.م
                  </strong>{" "}
                  عبر فودافون كاش إلى الرقم التالي: <br />
                  <span
                    className="text-base font-black text-emerald-400 tracking-wider select-all block mt-1 font-mono"
                    dir="ltr"
                  >
                    01009721205
                  </span>
                </p>
              ) : (
                <p className="text-slate-300 leading-relaxed">
                  قم بتحويل مبلغ{" "}
                  <strong className="text-white font-black">
                    {coursePrice} ج.م
                  </strong>{" "}
                  عبر إنستاباي إلى الرقم التالي: <br />
                  <span
                    className="text-base font-black text-emerald-400 tracking-wider select-all block mt-1 font-mono"
                    dir="ltr"
                  >
                    01014441277
                  </span>
                </p>
              )}
            </div>

            <form onSubmit={handleCompletePayment} className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-300">
                  رقم الهاتف أو الحساب المحول منه *
                </label>
                <input
                  type="text"
                  placeholder="اكتب رقم هاتفك أو محفظتك التي قمت بالتحويل منها"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                  required
                  className="w-full bg-[#070B0E] border border-white/10 focus:border-emerald-400 rounded-xl px-4 py-3.5 text-xs text-white focus:outline-none transition-all font-bold font-mono placeholder:text-slate-500"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-300">
                  رفع صورة إيصال التحويل (سكرين شوت) *
                </label>

                {receiptPreview ? (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-emerald-500/30 bg-[#070B0E]">
                    <img
                      src={receiptPreview}
                      alt="إيصال التحويل"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptPreview("");
                        setReceiptFile(null);
                      }}
                      className="absolute top-3 left-3 bg-red-600/90 hover:bg-red-600 text-white p-2 rounded-xl transition-all cursor-pointer shadow-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-white/15 hover:border-emerald-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[#070B0E]/50 transition-all hover:bg-[#070B0E]">
                    <Upload className="w-8 h-8 text-emerald-400" />
                    <span className="text-xs font-black text-white">
                      اضغط هنا لاختيار صورة الإيصال
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPG, JPEG بجودة واضحة
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      required
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:opacity-50 text-slate-950 font-black py-4.5 rounded-2xl text-sm transition-all shadow-[0_0_35px_rgba(16,185,129,0.4)] cursor-pointer mt-4 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري رفع الإيصال وتأكيد الطلب...</span>
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4 fill-slate-950" />
                    <span>تأكيد وإرسال طلب الاشتراك</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 bg-[#0B1216]/90 border border-emerald-500/25 text-white rounded-[2.2rem] p-6 sm:p-8 space-y-6 shadow-2xl sticky top-24 backdrop-blur-xl">
            <h2 className="text-base font-black text-white">ملخص الطلب</h2>

            <div className="flex items-center gap-4 bg-[#070B0E] p-4 rounded-2xl border border-white/10">
              <img
                src={courseImage}
                alt={course.title}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white line-clamp-1">
                  {course.title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {course.teacherName || "مدرس المنصة"}
                </p>
                <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md inline-block">
                  {course.grade || "الصف الثالث الثانوي"}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-slate-300 border-t border-white/10">
              <div className="flex justify-between">
                <span>سعر الكورس</span>
                <span className="font-black text-white">{coursePrice} ج.م</span>
              </div>
              <div className="flex justify-between">
                <span>رسوم الخدمة</span>
                <span className="font-black text-emerald-400">مجاناً</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white pt-3 border-t border-white/10">
                <span>الإجمالي المطلوب</span>
                <span className="text-2xl font-black bg-gradient-to-l from-emerald-400 via-teal-300 to-white bg-clip-text text-transparent">
                  {coursePrice} ج.م
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-white/[0.02] p-3.5 rounded-xl border border-white/10 text-[11px] text-slate-400 font-bold">
              <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>
                يتم مراجعة الإيصال وتفعيل الكورس في حسابك خلال ساعات قليلة.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCheckout;
