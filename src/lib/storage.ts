import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "photos";

export async function uploadPhoto(
  file: File,
  userId: string
): Promise<{ url: string; thumbnailUrl: string }> {
  const supabase = createAdminClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = urlData.publicUrl;

  // Supabase image transforms for thumbnail
  const thumbnailUrl = `${url}?width=400&height=400&resize=cover`;

  return { url, thumbnailUrl };
}

export async function deletePhotoFromStorage(url: string) {
  const supabase = createAdminClient();
  // Extract path from full URL
  const match = url.match(/\/storage\/v1\/object\/public\/photos\/(.+?)(\?|$)/);
  if (!match) return;
  const path = match[1];
  await supabase.storage.from(BUCKET).remove([path]);
}
