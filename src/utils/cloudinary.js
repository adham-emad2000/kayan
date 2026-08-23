const CLOUD_NAME = "p1yzag0u"; // اسم السحابة الخاص بك
const UPLOAD_PRESET = "dzzttgle"; // اسم الـ Preset المأخوذ من شاشتك

export const uploadToCloudinary = async (file) => {
  if (!file) return "";

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("cloud_name", CLOUD_NAME);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        errorData.error?.message || "فشل رفع الصورة إلى Cloudinary",
      );
    }

    const data = await res.json();
    return data.secure_url; // رابط الصورة المباشر والآمن
  } catch (error) {
    console.error("Cloudinary Error:", error);
    throw error;
  }
};
