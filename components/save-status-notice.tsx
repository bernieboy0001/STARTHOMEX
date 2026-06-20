type SaveStatus = "database-not-connected" | "error" | "saved";

export function SaveStatusNotice({ status }: { status?: SaveStatus }) {
  if (!status) return null;

  if (status === "database-not-connected") {
    return (
      <p className="notice">
        <strong>Database not connected</strong>
        <span>Add the real Supabase URL, anon key, and service role key in Vercel, then redeploy.</span>
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="notice">
        <strong>Save failed</strong>
        <span>Run the dashboard saving SQL upgrade in Supabase, then try again.</span>
      </p>
    );
  }

  return (
    <p className="notice">
      <strong>Saved</strong>
      <span>Your update was saved.</span>
    </p>
  );
}
