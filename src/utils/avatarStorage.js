import { supabase } from "../lib/supabase";

const AVATAR_BUCKET = "avatars";

function getFileExtension(contentType) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

export function getAvatarPublicUrl(path) {
  if (!path) return null;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar({ userId, file }) {
  const extension = getFileExtension(file.type);
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) throw error;

  return {
    path,
    publicUrl: getAvatarPublicUrl(path),
  };
}

export async function removeAvatar(path) {
  if (!path) return;

  const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);
  if (error) throw error;
}
