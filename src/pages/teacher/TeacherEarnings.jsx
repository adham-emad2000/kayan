import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  runTransaction,
  increment,
  doc,
} from "firebase/firestore";
import {
  Wallet,
  TrendingUp,
  Send,
  X,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  ArrowUpRight,
  Sun,
  Moon,
} from "lucide-react";

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

const TeacherEarnings = () => {
  useLinearFont();
  const [theme, toggleTheme] = useTheme();

  const { currentUser, userData } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالة نافذة سحب الأرباح (Modal)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState("vodafone_cash");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const PAYMENT_METHODS = [
    { id: "vodafone_cash", label: "فودافون كاش" },
    { id: "instapay", label: "انستاباي" },
  ];

  // إجمالي الأرباح الكلية مباشرة من مستند المعلم (Aggregated Field) — لا يقل أبداً
  const totalEarnings = userData?.totalEarnings || 0;

  // المبلغ "المحجوز" حالياً (طلبات سحب pending + approved) — بيتحدث عن طريق
  // transaction كل ما يتقدم طلب سحب جديد أو يترفض طلب قديم، بدل ما نجمعه من
  // الاستعلام على الـ client (ده كان بيسمح بـ race condition).
  const lockedBalance = userData?.lockedBalance || 0;

  const availableBalance = Math.max(0, totalEarnings - lockedBalance);

  // الاستماع اللحظي فقط لطلبات السحب الخاصة بالمدرس — دي دلوقتي للعرض في
  // سجل الطلبات بس، مش بتدخل في حساب الرصيد المتاح
  useEffect(() => {
    if (!currentUser) return;

    const qWithdrawals = query(
      collection(db, "withdrawalRequests"),
      where("teacherId", "==", currentUser.uid),
    );

    const unsubscribe = onSnapshot(
      qWithdrawals,
      (snap) => {
        const withdrawalList = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRequests(withdrawalList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching withdrawals:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Atomic فعلياً: بنقرا مستند المدرس "من جوه" الـ transaction (مش من الـ
  // state المحلي القديم)، فالفحص (numAmount > availableBalance) بيحصل على
  // أحدث نسخة من البيانات وقت الكتابة نفسها. إنشاء طلب السحب + زيادة
  // lockedBalance بيحصلوا مع بعض ذرّياً، فمستحيل يتخطى رصيده المتاح الحقيقي
  // حتى لو بعت طلبين في نفس اللحظة (تابين مفتوحين مثلاً).
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(amount);

    if (numAmount <= 0) {
      alert("برجاء إدخال مبلغ صحيح.");
      return;
    }

    if (!accountNumber.trim()) {
      alert("برجاء إدخال رقم فودافون كاش أو انستاباي.");
      return;
    }

    if (!accountName.trim()) {
      alert("برجاء إدخال اسم صاحب الحساب.");
      return;
    }

    const methodLabel =
      PAYMENT_METHODS.find((m) => m.id === paymentType)?.label || paymentType;
    const paymentMethod = `${methodLabel} - ${accountNumber.trim()} - ${accountName.trim()}`;

    setSubmitting(true);
    try {
      const teacherRef = doc(db, "teachers", currentUser.uid);
      const newReqRef = doc(collection(db, "withdrawalRequests"));

      await runTransaction(db, async (transaction) => {
        const teacherSnap = await transaction.get(teacherRef);

        if (!teacherSnap.exists()) {
          throw new Error("تعذر العثور على بيانات حسابك.");
        }

        const teacherData = teacherSnap.data();
        const currentAvailable = Math.max(
          0,
          (teacherData.totalEarnings || 0) - (teacherData.lockedBalance || 0),
        );

        if (numAmount > currentAvailable) {
          throw new Error("عفواً، المبلغ المطلوب أكبر من رصيدك المتاح حالياً.");
        }

        transaction.set(newReqRef, {
          teacherId: currentUser.uid,
          teacherName: userData?.fullName || "مدرس المنصة",
          amount: numAmount,
          paymentMethod,
          paymentType,
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
          status: "pending",
          createdAt: new Date().toISOString(),
        });

        transaction.update(teacherRef, {
          lockedBalance: increment(numAmount),
        });
      });

      alert("تم إرسال طلب السحب بنجاح وسيتم مراجعته وتحويل الأموال قريباً!");
      setAmount("");
      setAccountNumber("");
      setAccountName("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      alert(error.message || "حدث خطأ أثناء إرسال الطلب.");
    } finally {
      setSubmitting(false);
    }
  };

  const fontStyle = {
    fontFamily: "'IBM Plex Sans Arabic', 'Segoe UI', sans-serif",
  };

  if (loading) {
    return (
      <div
        className="min-h-[70vh] flex items-center justify-center text-[var(--text-muted)] text-[13px] bg-[var(--bg-base)]"
        dir="rtl"
        style={fontStyle}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span>جاري تحميل الأرباح والبيانات المالية...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-10 px-4 sm:px-6 lg:px-8"
      dir="rtl"
      style={fontStyle}
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* رأس الصفحة / الترحيب */}
        <div className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">
                  أرباحي والتحصيلات المالية
                </h1>
                <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              </div>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                تتبع أرباح كورساتك واطلب سحب أموالك بكل سهولة وشفافية
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-[var(--success)] hover:opacity-90 active:scale-[0.98] text-[#04140C] px-5 py-2.5 rounded-md font-medium text-[12.5px] flex items-center justify-center gap-2 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>طلب سحب أرباح جديدة</span>
          </button>
        </div>

        {/* الكروت الإحصائية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-[var(--bg-panel)] rounded-lg p-5 border border-[var(--border)] space-y-2.5">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-[11px] font-medium">
                إجمالي الأرباح الكلية
              </span>
              <div className="w-8 h-8 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] tabular-nums">
              {totalEarnings}{" "}
              <span className="text-[13px] text-[var(--text-muted)] font-normal">
                ج.م
              </span>
            </h2>
          </div>

          <div className="bg-[var(--bg-panel)] rounded-lg p-5 border border-[var(--border)] space-y-2.5">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-[11px] font-medium">
                الرصيد المتاح للسحب
              </span>
              <div className="w-8 h-8 rounded-md bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-[var(--success)] tabular-nums">
              {availableBalance}{" "}
              <span className="text-[13px] text-[var(--text-muted)] font-normal">
                ج.م
              </span>
            </h2>
          </div>
        </div>

        {/* سجل طلبات السحب */}
        <div className="bg-[var(--bg-panel)] rounded-lg border border-[var(--border)] p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4">
            <div className="w-9 h-9 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center">
              <CreditCard className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                سجل طلبات السحب السابقة
              </h3>
              <p className="text-[11.5px] text-[var(--text-muted)]">
                تابع حالة طلبات تحويل أرباحك لحظة بلحظة
              </p>
            </div>
          </div>

          {requests.length === 0 ? (
            <div className="text-center py-10 space-y-2.5">
              <div className="w-12 h-12 rounded-full bg-[var(--bg-panel-alt)] text-[var(--text-disabled)] flex items-center justify-center mx-auto">
                <Wallet className="w-6 h-6" />
              </div>
              <p className="text-[12.5px] text-[var(--text-muted)]">
                لم تقم بأي طلبات سحب أرباح حتى الآن.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[11px] font-medium text-[var(--text-muted)]">
                    <th className="py-2.5 px-3">المبلغ المطلوب</th>
                    <th className="py-2.5 px-3">طريقة الاستلام / الحساب</th>
                    <th className="py-2.5 px-3">تاريخ الطلب</th>
                    <th className="py-2.5 px-3 text-center">حالة الطلب</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[12px] text-[var(--text-secondary)]">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <td className="py-3 px-3 font-semibold text-[var(--accent)] text-[13px] tabular-nums">
                        {req.amount} ج.م
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {req.paymentMethod}
                      </td>
                      <td className="py-3 px-3 text-[var(--text-muted)]">
                        {new Date(req.createdAt).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {req.status === "pending" && (
                          <span className="bg-[color-mix(in_srgb,var(--warning)_15%,transparent)] text-[var(--warning)] px-2.5 py-1 rounded-full text-[10.5px] font-medium inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> قيد المراجعة
                          </span>
                        )}
                        {req.status === "approved" && (
                          <span className="bg-[var(--success-soft)] text-[var(--success)] px-2.5 py-1 rounded-full text-[10.5px] font-medium inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> تم التحويل
                          </span>
                        )}
                        {req.status === "rejected" && (
                          <span className="bg-[color-mix(in_srgb,var(--danger)_12%,transparent)] text-[var(--danger)] px-2.5 py-1 rounded-full text-[10.5px] font-medium inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> مرفوض
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* نافذة طلب السحب المنبثقة (Modal) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-panel)] rounded-lg p-7 max-w-md w-full border border-[var(--border)] shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center">
                  <Wallet className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                    طلب سحب أرباح جديدة
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    الرصيد المتاح: {availableBalance} ج.م
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-md bg-[var(--bg-panel-alt)] hover:text-[var(--danger)] flex items-center justify-center text-[var(--text-secondary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11.5px] font-medium text-[var(--text-secondary)] mb-1.5">
                  المبلغ المراد سحبه (ج.م) *
                </label>
                <input
                  type="number"
                  required
                  max={availableBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`الحد الأقصى ${availableBalance} ج.م`}
                  className="w-full bg-[var(--bg-panel-alt)] border border-[var(--border)] focus:border-[var(--success)] rounded-md py-3 px-3.5 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--text-secondary)] mb-1.5">
                  طريقة الاستلام *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentType(m.id)}
                      className={`py-2.5 rounded-md text-[12.5px] font-semibold border transition-colors ${
                        paymentType === m.id
                          ? "bg-[var(--success-soft)] border-[var(--success)] text-[var(--success)]"
                          : "bg-[var(--bg-panel-alt)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--text-secondary)] mb-1.5">
                  {paymentType === "vodafone_cash"
                    ? "رقم فودافون كاش *"
                    : "رقم انستاباي *"}
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={
                    paymentType === "vodafone_cash"
                      ? "01012345678"
                      : "01012345678 أو @username"
                  }
                  className="w-full bg-[var(--bg-panel-alt)] border border-[var(--border)] focus:border-[var(--success)] rounded-md py-3 px-3.5 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-medium text-[var(--text-secondary)] mb-1.5">
                  اسم صاحب الحساب *
                </label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="مثال: أحمد محمد"
                  className="w-full bg-[var(--bg-panel-alt)] border border-[var(--border)] focus:border-[var(--success)] rounded-md py-3 px-3.5 text-[13px] font-medium text-[var(--text-primary)] focus:outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[var(--success)] hover:opacity-90 active:scale-[0.99] disabled:opacity-50 text-[#04140C] py-3 rounded-md font-medium text-[13px] flex items-center justify-center gap-2 transition-all mt-3"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>تأكيد وإرسال طلب السحب</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherEarnings;
