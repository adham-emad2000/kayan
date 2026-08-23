import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Video,
  HelpCircle,
  FileCheck,
  User,
  ArrowLeft,
  PlayCircle,
} from "lucide-react";
import defaultImage from "../../image.png";

// ملاحظة: الكارت ده بيتعرض جوه صفحات زي Courses.jsx اللي بتستخدم نظام
// الثيم المشترك (data-theme + CSS variables زي --bg-panel و --text-primary).
// كان الكارت قبل كده بألوان ثابتة (slate/blue الغامقة) فمكنش بيستجيب لتبديل
// الوضع الفاتح/الداكن - هنا بقى بيقرا نفس الـ variables عشان يتماشى تلقائيًا
// مع أي ثيم الصفحة شغالة عليه.
const CourseCard = ({ course, isEnrolled = false }) => {
  const lessonsCount = course.lessons?.length || 0;
  const quizCount = course.lessons?.filter((l) => l.hasQuiz)?.length || 0;
  const hwCount = course.lessons?.filter((l) => l.hasHomework)?.length || 0;

  const cardImage = course.thumbnailUrl || course.image || defaultImage;

  return (
    <div className="group relative rounded-[1.75rem] p-[1px] bg-gradient-to-b from-[var(--border-strong)] via-[var(--border)] to-transparent hover:from-[var(--accent)]/60 hover:via-[var(--accent)]/20 hover:to-transparent transition-all duration-500">
      {/* توهج خلفي عند الـ hover */}
      <div className="absolute -inset-1 rounded-[2rem] bg-[var(--accent)]/0 group-hover:bg-[var(--accent)]/15 blur-xl transition-all duration-500 -z-10" />

      <div className="relative rounded-[1.7rem] bg-[var(--bg-panel)] backdrop-blur-xl border border-[var(--border)] overflow-hidden flex flex-col justify-between h-full transition-transform duration-500 group-hover:-translate-y-1.5">
        {/* 1. صورة الغلاف */}
        <div className="relative h-48 w-full overflow-hidden bg-[var(--bg-panel-alt)]">
          <img
            src={cardImage}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-panel)] via-[var(--bg-panel)]/10 to-transparent" />

          {/* شارات فوق الصورة */}
          <div className="absolute top-3 right-3 flex flex-wrap items-center gap-2">
            <span className="bg-[var(--accent-soft)] text-[var(--accent)] text-[11px] font-black px-3 py-1 rounded-xl border border-[var(--accent)]/20 backdrop-blur-sm">
              {course.subject || "الفيزياء"}
            </span>
            <span className="bg-[var(--bg-panel)]/70 text-[var(--text-primary)] text-[11px] font-bold px-3 py-1 rounded-xl border border-[var(--border)] backdrop-blur-sm">
              {course.grade || "الصف الثالث الثانوي"}
            </span>
          </div>
        </div>

        {/* 2. جسم الكارت */}
        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent)] transition-colors line-clamp-2">
              {course.title}
            </h3>

            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
              <div className="w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center border border-[var(--accent)]/20">
                <User className="w-3.5 h-3.5" />
              </div>
              <span>
                المحاضر:{" "}
                <strong className="text-[var(--text-secondary)]">
                  {course.teacherName || course.teacher || "مدرس المنصة"}
                </strong>
              </span>
            </div>
          </div>

          {/* 3. صندوق مواعيد النزول */}
          <div className="space-y-2 pt-1">
            <div className="bg-[var(--bg-panel-alt)] border border-[var(--border)] rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-black text-[var(--text-primary)]">
                <Clock className="w-4 h-4 text-[var(--accent)] shrink-0" />
                <span className="line-clamp-1">
                  {course.schedule || "ينزل كل سبت وأربعاء"}
                </span>
              </div>

              {(course.startDate || course.endDate) && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                  <Calendar className="w-3.5 h-3.5 text-[var(--text-faint)] shrink-0" />
                  <span>
                    من {course.startDate || "--"} إلى {course.endDate || "--"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-muted)] px-1 pt-1">
              <span className="flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-[var(--accent)]" />
                {lessonsCount} حصص
              </span>
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-[var(--violet)]" />
                {quizCount} امتحان
              </span>
              <span className="flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-[var(--warning)]" />
                {hwCount} واجب
              </span>
            </div>
          </div>

          {/* 4. السعر والزر */}
          <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between gap-3 mt-2">
            <div>
              <span className="text-[10px] font-bold text-[var(--text-faint)] block">
                قيمة الاشتراك
              </span>
              <div className="text-xl font-black text-[var(--text-primary)]">
                {course.price ? `${course.price} ج.م` : "مجاناً"}
              </div>
            </div>

            {isEnrolled ? (
              <Link
                to={`/player/${course.id}`}
                className="relative overflow-hidden bg-[var(--success)] hover:opacity-90 active:scale-95 text-white text-xs font-black px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-[var(--success)]/25 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>مشاهدة</span>
              </Link>
            ) : (
              <Link
                to={`/course/${course.id}`}
                className="relative overflow-hidden bg-[var(--accent)] hover:opacity-90 active:scale-95 text-white text-xs font-black px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-[var(--accent)]/25 cursor-pointer"
              >
                <span>تفاصيل الكورس</span>
                <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
