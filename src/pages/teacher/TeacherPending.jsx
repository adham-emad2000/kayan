import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Upload,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Smartphone,
  CreditCard,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { uploadToCloudinary } from "../../utils/cloudinary";

const TeacherPending = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [paymentMethod, setPaymentMethod] = useState("vodafone");
  const [senderInfo, setSenderInfo] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [copiedText, setCopiedText] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false); // 👈 حالة إعادة المحاولة لو مرفوض

  const VODAFONE_NUMBER = "01009721205";
  const INSTAPAY_ADDRESS = "01014441277";

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setReceiptFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmitReceipt = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      alert("برجاء إرفاق صورة إيصال أو سكرين شوت التحويل أولاً.");
      return;
    }

    setUploading(true);
    try {
      const uploadedUrl = await uploadToCloudinary(receiptFile);

      const teacherRef = doc(db, "teachers", currentUser.uid);
      await updateDoc(teacherRef, {
        receiptUrl: uploadedUrl,
        paymentMethod:
          paymentMethod === "vodafone" ? "فودافون كاش" : "InstaPay",
        senderInfo: senderInfo || "غير مدخل",
        subscriptionStatus: "pending_review",
        subscriptionSubmittedAt: new Date().toISOString(),
      });

      setSuccessMsg(true);
      setIsRetrying(false);
    } catch (error) {
      console.error("Error uploading receipt:", error);
      alert("حدث خطأ أثناء رفع الإيصال: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isRejected = userData?.subscriptionStatus === "rejected" && !isRetrying;
  const isPendingReview =
    (userData?.subscriptionStatus === "pending_review" ||
      (userData?.receiptUrl && !userData?.isApproved)) &&
    !isRetrying;

  return (
    <div
      className="min-h-screen bg-[#F0F4F8] text-slate-900 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans"
      dir="rtl"
    >
      <div className="max-w-2xl w-full space-y-6">
        {/* بانر إعلاني احترافي */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-blue-700 via-indigo-600 to-purple-700 text-white p-8 sm:p-10 shadow-2xl shadow-indigo-600/20">
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-0 top-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-black border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>اشتراك هيئة التدريس المعتمد</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                أهلاً بك، أ. {userData?.fullName?.split(" ")[0]} 🌟
              </h1>
              <p className="text-white/80 text-xs sm:text-sm font-bold leading-relaxed max-w-md">
                خطوة واحدة أخيرة لتفعيل لوحة تحكمك والبدء في نشر كورساتك والوصول
                لآلاف الطلاب.
              </p>
            </div>

            <div className="shrink-0 bg-white text-slate-900 px-6 py-4 rounded-3xl text-center shadow-xl shadow-black/10 border-2 border-amber-300">
              <p className="text-[11px] font-bold text-slate-500">
                رسوم التفعيل
              </p>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">
                200{" "}
                <span className="text-sm font-bold text-slate-700">ج.م</span>
              </p>
            </div>
          </div>
        </div>

        {/* بطاقة الدفع والرفع */}
        <div className="bg-white rounded-[2.5rem] border-2 border-blue-100 p-6 sm:p-8 shadow-xl space-y-6">
          {/* حالة الرفض من الأدمن */}
          {isRejected ? (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-3xl p-6 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-rose-600/30">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-rose-950">
                عذراً، تم رفض إيصال التحويل الخاص بك
              </h2>
              <p className="text-xs font-bold text-rose-800 leading-relaxed max-w-md mx-auto">
                لم تتمكن إدارة المنصة من اعتماد الإيصال المرفق (قد يكون غير واضح
                أو بيانات التحويل غير مطابقة). يرجى التأكد وإعادة المحاولة.
              </p>
              <button
                type="button"
                onClick={() => setIsRetrying(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs shadow-md shadow-rose-600/30 cursor-pointer transition-all inline-flex items-center gap-2"
              >
                <span>إعادة رفع إيصال جديد والدفع</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : isPendingReview && !successMsg ? (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-6 text-center space-y-3">
              <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Clock className="w-7 h-7 animate-pulse" />
              </div>
              <h2 className="text-lg font-black text-amber-950">
                إيصالك قيد المراجعة والاعتماد الآن
              </h2>
              <p className="text-xs font-bold text-amber-800 leading-relaxed max-w-md mx-auto">
                تم استلام إيصال التحويل وجارٍ مراجعته من قِبل إدارة منصة كيان.
                سيتم تفعيل حسابك فور التأكد من العملية.
              </p>
            </div>
          ) : successMsg ? (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-black text-emerald-950">
                تم إرسال إيصال الدفع بنجاح!
              </h2>
              <p className="text-xs font-bold text-emerald-800 leading-relaxed max-w-md mx-auto">
                شكراً لك. سيتم تفعيل حسابك وإتاحة إضافة الكورسات في أسرع وقت.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-black text-slate-700 mb-3">
                  1. اختر طريقة التحويل المناسبة لك:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("vodafone")}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      paymentMethod === "vodafone"
                        ? "border-rose-500 bg-rose-50/50 text-rose-950 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-rose-600 shrink-0" />
                    <div className="text-right">
                      <p className="font-black text-xs">فودافون كاش</p>
                      <p className="text-[10px] text-slate-500">
                        محفظة إلكترونية
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("instapay")}
                    className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                      paymentMethod === "instapay"
                        ? "border-purple-500 bg-purple-50/50 text-purple-950 shadow-sm"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-purple-600 shrink-0" />
                    <div className="text-right">
                      <p className="font-black text-xs">InstaPay</p>
                      <p className="text-[10px] text-slate-500">تحويل فوري</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-5 space-y-2">
                <p className="text-xs font-bold text-slate-600">
                  حول مبلغ{" "}
                  <span className="font-black text-blue-600 font-mono">
                    200 ج.م
                  </span>{" "}
                  إلى الحساب التالي:
                </p>
                <div className="flex items-center justify-between bg-white border border-slate-200 p-3.5 rounded-2xl shadow-inner">
                  <span
                    className="font-mono font-black text-sm text-slate-800"
                    dir="ltr"
                  >
                    {paymentMethod === "vodafone"
                      ? VODAFONE_NUMBER
                      : INSTAPAY_ADDRESS}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        paymentMethod === "vodafone"
                          ? VODAFONE_NUMBER
                          : INSTAPAY_ADDRESS,
                      )
                    }
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedText ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmitReceipt} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    2. رقم الهاتف أو اسم الحساب المحول منه:
                  </label>
                  <input
                    type="text"
                    required
                    value={senderInfo}
                    onChange={(e) => setSenderInfo(e.target.value)}
                    placeholder="مثال: 010xxxxxxxx أو اسم حساب إنستاباي"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 rounded-2xl py-3.5 px-4 text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    3. إرفاق صورة إيصال التحويل أو سكرين شوت العملية *:
                  </label>

                  {previewUrl ? (
                    <div className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-blue-300 bg-slate-900 flex items-center justify-center p-2">
                      <img
                        src={previewUrl}
                        alt="إيصال التحويل"
                        className="w-full h-full object-contain rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl("");
                          setReceiptFile(null);
                        }}
                        className="absolute top-3 left-3 bg-red-600 text-white p-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                      >
                        إزالة الصورة
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-36 rounded-2xl border-3 border-dashed border-slate-300 hover:border-blue-600 bg-slate-50 hover:bg-blue-50/30 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all p-4 text-center"
                    >
                      <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-black text-slate-700">
                        اضغط هنا لاختيار صورة الإيصال (PNG, JPG)
                      </span>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading || !receiptFile}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/30 cursor-pointer flex items-center justify-center gap-2 transition-all mt-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري رفع الإيصال والتأكيد...</span>
                    </>
                  ) : (
                    <>
                      <span>تأكيد التحويل وإرسال الإيصال للتفعيل</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400">
              منصة كيان التعليمية © {new Date().getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-red-500 hover:bg-red-50 px-3.5 py-2 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPending;
