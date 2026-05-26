const path = require("path");
const crypto = require("crypto");

const { createClient } = require("@supabase/supabase-js");

const { httpError } = require("../utils/httpError");

let client = null;

const isSupabaseStorageEnabled = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return typeof url === "string" && url.trim() !== "" && typeof key === "string" && key.trim() !== "";
};

const getSupabase = () => {
  if (!isSupabaseStorageEnabled()) {
    return null;
  }

  if (!client) {
    client = createClient(process.env.SUPABASE_URL.trim(), process.env.SUPABASE_SERVICE_ROLE_KEY.trim(), {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return client;
};

const getBucketName = (kind) => {
  if (kind === "listing") {
    return process.env.SUPABASE_STORAGE_BUCKET_LISTING || "listing-images";
  }

  return process.env.SUPABASE_STORAGE_BUCKET_DRAWINGS || "drawings";
};

const buildObjectPath = (prefix, originalName, fallbackExt) => {
  const ext = path.extname(originalName || "").toLowerCase() || fallbackExt;
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  const random = crypto.randomBytes(8).toString("hex");
  return `${prefix}/${Date.now()}-${random}${safeExt}`;
};

const getPublicObjectUrl = (bucket, objectPath) => {
  const base = process.env.SUPABASE_URL.trim().replace(/\/$/, "");
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encodedPath}`;
};

const uploadBuffer = async ({ bucket, objectPath, buffer, contentType }) => {
  const supabase = getSupabase();
  if (!supabase) {
    throw httpError(500, "Supabase Storage is not configured.");
  }

  const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    contentType,
    upsert: false,
    cacheControl: "3600"
  });

  if (error) {
    if (/bucket not found/i.test(error.message)) {
      throw httpError(
        500,
        `Supabase bucket "${bucket}" not found. Create a public bucket with this name in Supabase Dashboard → Storage.`
      );
    }
    throw httpError(500, `Storage upload failed: ${error.message}`);
  }

  return getPublicObjectUrl(bucket, objectPath);
};

const uploadListingImage = async (file) => {
  const bucket = getBucketName("listing");
  const ext = path.extname(file.originalname || "").toLowerCase();
  const objectPath = buildObjectPath("listings", file.originalname, ext || ".jpg");

  return uploadBuffer({
    bucket,
    objectPath,
    buffer: file.buffer,
    contentType: file.mimetype || "image/jpeg"
  });
};

const uploadDrawingPdf = async (file) => {
  const bucket = getBucketName("drawing");
  const objectPath = buildObjectPath("drawings", file.originalname, ".pdf");

  return uploadBuffer({
    bucket,
    objectPath,
    buffer: file.buffer,
    contentType: file.mimetype || "application/pdf"
  });
};

module.exports = {
  isSupabaseStorageEnabled,
  uploadListingImage,
  uploadDrawingPdf
};
