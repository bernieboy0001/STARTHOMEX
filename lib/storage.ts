import { createAdminClient } from "@/lib/supabase/admin";

export const careFilesBucket = "care-files";

/** Ensure first-time deployments do not fail simply because Storage was not created manually. */
export async function ensureCareFilesBucket() {
  const admin = createAdminClient();
  const { data } = await admin.storage.getBucket(careFilesBucket);
  if (data) return admin;

  const { error } = await admin.storage.createBucket(careFilesBucket, {
    public: false,
    fileSizeLimit: "262144000"
  });

  if (error && !/already exists/i.test(error.message)) throw error;
  return admin;
}
