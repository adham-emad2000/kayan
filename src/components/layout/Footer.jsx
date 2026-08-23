import React from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Globe,
  Share2,
  Send,
} from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1E2A44] text-[#C7CEDB] pt-16 pb-12 border-t border-[#2A3A5C] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 mb-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#B8892B] flex items-center justify-center text-white font-black text-xl">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight">
                منصة كيان
              </span>
            </div>

            <p className="text-[#9AA3B5] text-sm leading-relaxed mb-6">
              منصتك التعليمية المتكاملة لرحلة الثانوية العامة. نجمع لك بين نخبة
              المعلمين، أحدث أساليب الشرح الرقمي، والمتابعة المستمرة لضمان
              تفوقك.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="#website"
                className="w-10 h-10 rounded-xl bg-[#26324D] border border-[#2A3A5C] flex items-center justify-center text-[#9AA3B5] hover:bg-[#B8892B] hover:text-white hover:border-[#B8892B] transition-all"
              >
                <Globe className="w-5 h-5" />
              </a>
              <a
                href="#share"
                className="w-10 h-10 rounded-xl bg-[#26324D] border border-[#2A3A5C] flex items-center justify-center text-[#9AA3B5] hover:bg-[#B8892B] hover:text-white hover:border-[#B8892B] transition-all"
              >
                <Share2 className="w-5 h-5" />
              </a>
              <a
                href="#telegram"
                className="w-10 h-10 rounded-xl bg-[#26324D] border border-[#2A3A5C] flex items-center justify-center text-[#9AA3B5] hover:bg-[#B8892B] hover:text-white hover:border-[#B8892B] transition-all"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-white font-bold text-base mb-4 tracking-wide">
              روابط سريعة
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/"
                  className="text-[#9AA3B5] hover:text-white transition-colors"
                >
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link
                  to="/courses"
                  className="text-[#9AA3B5] hover:text-white transition-colors"
                >
                  الكورسات
                </Link>
              </li>
              <li>
                <Link
                  to="/teachers"
                  className="text-[#9AA3B5] hover:text-white transition-colors"
                >
                  المدرسين
                </Link>
              </li>
              <li>
                <Link
                  to="/register-teacher"
                  className="text-[#9AA3B5] hover:text-white transition-colors"
                >
                  انضم كمعلم
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-white font-bold text-base mb-4 tracking-wide">
              المراحل التعليمية
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/courses"
                  className="text-[#9AA3B5] hover:text-white transition-colors"
                >
                  الصف الأول الثانوي
                </Link>
              </li>
              <li>
                <Link
                  to="/courses"
                  className="text-[#9AA3B5] hover:text-white transition-colors"
                >
                  الصف الثاني الثانوي
                </Link>
              </li>
              <li>
                <Link
                  to="/courses"
                  className="text-[#9AA3B5] hover:text-white transition-colors"
                >
                  الصف الثالث الثانوي
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="text-white font-bold text-base mb-4 tracking-wide">
              تواصل معنا
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-[#9AA3B5]">
                <MapPin className="w-5 h-5 text-[#B8892B] flex-shrink-0 mt-0.5" />
                <span>القاهرة، مصر</span>
              </li>
              <li className="flex items-center gap-3 text-[#9AA3B5]">
                <Phone className="w-5 h-5 text-[#B8892B] flex-shrink-0" />
                <span dir="ltr">+20 01014441277</span>
              </li>
              <li className="flex items-center gap-3 text-[#9AA3B5]">
                <Mail className="w-5 h-5 text-[#B8892B] flex-shrink-0" />
                <span>adhamemadd20@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#2A3A5C] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8A93A6] gap-4">
          <p>
            © {new Date().getFullYear()} منصة كيان التعليمية. جميع الحقوق
            محفوظة.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="hover:text-[#C7CEDB] transition-colors"
            >
              سياسة الخصوصية
            </Link>
            <Link
              to="/terms"
              className="hover:text-[#C7CEDB] transition-colors"
            >
              الشروط والأحكام
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
