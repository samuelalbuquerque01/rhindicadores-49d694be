import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "atestados";

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_");

const getFileExtension = (name: string) => {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "bin";
};

export const createAfastamentoStoragePath = (file: File, colaboradorId?: string | null) => {
  const safeName = sanitizeFileName(file.name);
  const ext = getFileExtension(safeName);
  const id = crypto.randomUUID();
  const folder = colaboradorId || "sem-colaborador";
  return `${folder}/${Date.now()}-${id}.${ext}`;
};

export async function uploadAfastamentoAnexo(file: File, colaboradorId?: string | null) {
  const path = createAfastamentoStoragePath(file, colaboradorId);
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return path;
}

export async function removeAfastamentoAnexo(path?: string | null) {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) throw error;
}

export async function createAfastamentoSignedUrl(path?: string | null, expiresIn = 60 * 60) {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data?.signedUrl ?? null;
}

export async function downloadAfastamentoAnexo(path?: string | null) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(path);
  if (error) throw error;
  return data;
}

export const isHttpUrl = (value?: string | null) => {
  if (!value) return false;
  return value.startsWith("http://") || value.startsWith("https://");
};
