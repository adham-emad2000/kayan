import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeDoc = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);

      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

      if (user) {
        // 1. فحص كولكشن المدرسين أولاً
        const teacherRef = doc(db, "teachers", user.uid);
        unsubscribeDoc = onSnapshot(
          teacherRef,
          (teacherSnap) => {
            if (teacherSnap.exists()) {
              setUserData({
                id: teacherSnap.id,
                role: "teacher",
                ...teacherSnap.data(),
              });
              setLoading(false);
            } else {
              // 2. لو مش مدرس، نفحص كولكشن الطلاب (الذي يشمل الأدمن أيضاً)
              const studentRef = doc(db, "students", user.uid);
              unsubscribeDoc = onSnapshot(
                studentRef,
                (studentSnap) => {
                  if (studentSnap.exists()) {
                    const data = studentSnap.data();
                    setUserData({
                      id: studentSnap.id,
                      role: data.role || "student",
                      ...data,
                    });
                  } else {
                    setUserData(null);
                  }
                  setLoading(false);
                },
                (err) => {
                  console.error("Student fetch error:", err);
                  setLoading(false);
                },
              );
            }
          },
          (err) => {
            console.error("Teacher fetch error:", err);
            setLoading(false);
          },
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
