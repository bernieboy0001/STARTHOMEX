"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { type ReactNode, useEffect, useMemo, useState } from "react";

type ClientData = {
  userEmail: string;
  recipient: any;
  tasks: any[];
  medications: any[];
  visits: any[];
  reminders: any[];
  contacts: any[];
  documents: any[];
  notes: any[];
  videos: any[];
};

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function supabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export function DashboardAuthRequired() {
  const pathname = usePathname();
  const supabase = useMemo(() => supabaseClient(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<ClientData | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setLoading(false);
        setData(null);
        return;
      }

      const { data: recipients, error: recipientsError } = await supabase
        .from("care_recipients")
        .select("*")
        .order("created_at", { ascending: false });

      if (recipientsError) {
        setError(recipientsError.message);
        setLoading(false);
        return;
      }

      const recipient = recipients?.[0];
      if (!recipient) {
        window.location.assign("/onboarding");
        return;
      }

      const [
        tasks,
        medications,
        visits,
        reminders,
        contacts,
        documents,
        notes,
        videos
      ] = await Promise.all([
        supabase.from("tasks").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }),
        supabase.from("medications").select("*").eq("care_recipient_id", recipient.id).eq("active", true).order("name"),
        supabase.from("visits").select("*").eq("care_recipient_id", recipient.id).order("starts_at", { ascending: true }).limit(8),
        supabase.from("reminders").select("*").eq("care_recipient_id", recipient.id).is("completed_at", null).order("remind_at", { ascending: true }).limit(12),
        supabase.from("contacts").select("*").eq("care_recipient_id", recipient.id).order("role"),
        supabase.from("documents").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(8),
        supabase.from("care_notes").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false }).limit(8),
        supabase.from("caregiver_videos").select("*").eq("care_recipient_id", recipient.id).order("created_at", { ascending: false })
      ]);

      const firstError = [tasks, medications, visits, reminders, contacts, documents, notes, videos].find(result => result.error)?.error;
      if (firstError) setError(firstError.message);

      setData({
        userEmail: user.email || "",
        recipient,
        tasks: tasks.data || [],
        medications: medications.data || [],
        visits: visits.data || [],
        reminders: reminders.data || [],
        contacts: contacts.data || [],
        documents: documents.data || [],
        notes: notes.data || [],
        videos: videos.data || []
      });
      setLoading(false);
    }

    void load();
  }, [supabase]);

  async function createTask(formData: FormData) {
    if (!data) return;
    await supabase.from("tasks").insert({
      care_recipient_id: data.recipient.id,
      title: String(formData.get("title") || ""),
      owner_name: String(formData.get("ownerName") || ""),
      due_at: formData.get("dueAt") || null,
      priority: formData.get("priority") || "medium"
    });
    window.location.reload();
  }

  if (loading) {
    return <main className="main app-main"><section className="panel"><h3>Loading your care circle...</h3></section></main>;
  }

  if (!data) {
    return (
      <main className="main app-main">
        <section className="panel">
          <div className="panel-head"><h3>Session not detected</h3></div>
          <div className="rows">
            <div className="row"><strong>HOMEX could not see a signed-in browser session.</strong><span>Please sign in again.</span></div>
            <div className="actions"><Link className="button" href="/sign-in">Sign in</Link><Link className="ghost" href="/sign-out">Clear session</Link></div>
          </div>
        </section>
      </main>
    );
  }

  const openTasks = data.tasks.filter(task => !task.completed_at);
  const title = data.recipient.full_name;

  if (pathname.endsWith("/tasks")) {
    return (
      <main className="main app-main">
        <header className="page-head"><div><p className="eyebrow">Tasks</p><h2>Care checklist</h2><p className="muted">Check items off and see who completed them.</p></div></header>
        <section className="grid-2">
          <article className="panel"><div className="panel-head"><h3>Open and completed tasks</h3></div><div className="rows">{data.tasks.map(task => <div className="row" key={task.id}><strong>{task.title}</strong><span>{task.owner_name || "Unassigned"} / {formatDate(task.due_at)} / {task.priority}</span></div>)}</div></article>
          <article className="panel"><div className="panel-head"><h3>Create task</h3></div><form className="form" action={createTask}><input name="title" placeholder="Call pharmacy about refill" required /><input name="ownerName" placeholder="Owner name" required /><input name="dueAt" type="datetime-local" /><select name="priority" defaultValue="medium"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select><button className="button" type="submit">Create task</button></form></article>
        </section>
      </main>
    );
  }

  const sectionMap: Record<string, { heading: string; items: any[]; empty: string; render: (item: any) => ReactNode }> = {
    "/dashboard/medications": { heading: "Medications", items: data.medications, empty: "No medications yet.", render: item => <div className="row" key={item.id}><strong>{item.name}</strong><span>{item.dosage || "No dosage"} / {item.schedule}</span></div> },
    "/dashboard/visits": { heading: "Appointments", items: data.visits, empty: "No appointments yet.", render: item => <div className="row" key={item.id}><strong>{item.title}</strong><span>{formatDate(item.starts_at)} / {item.location || "No location"}</span></div> },
    "/dashboard/reminders": { heading: "Reminders", items: data.reminders, empty: "No reminders yet.", render: item => <div className="row" key={item.id}><strong>{item.title}</strong><span>{formatDate(item.remind_at)} / {item.channel}</span></div> },
    "/dashboard/family": { heading: "Family & team", items: data.contacts, empty: "No contacts yet.", render: item => <div className="row" key={item.id}><strong>{item.name} / {item.role}</strong><span>{item.phone || "No phone"} / {item.email || "No email"}</span></div> },
    "/dashboard/documents": { heading: "Documents", items: data.documents, empty: "No documents yet.", render: item => <div className="row" key={item.id}><strong>{item.title}</strong><span>{item.category} / {item.notes || "No notes"}</span></div> },
    "/dashboard/notes": { heading: "Care notes", items: data.notes, empty: "No notes yet.", render: item => <div className="row" key={item.id}><strong>{item.author_name}</strong><span>{item.body}</span></div> },
    "/dashboard/videos": { heading: "Care videos", items: data.videos, empty: "No videos yet.", render: item => <div className="row" key={item.id}><strong>{item.title}</strong><span>{item.category} / {item.description || "No description"}</span></div> },
    "/dashboard/activity": { heading: "Activity", items: [], empty: "Activity will appear after updates.", render: item => <div key={item.id} /> },
    "/dashboard/circles": { heading: "Care circles", items: [data.recipient], empty: "No circles yet.", render: item => <div className="row" key={item.id}><strong>{item.full_name}</strong><span>{item.recovery_status || "No status"}</span></div> },
    "/dashboard/ai": { heading: "Smart extraction", items: [], empty: "AI extraction is available after server session is restored.", render: item => <div key={item.id} /> }
  };

  const section = sectionMap[pathname];
  if (section) {
    return (
      <main className="main app-main">
        <header className="page-head"><div><p className="eyebrow">Care circle</p><h2>{section.heading}</h2><p className="muted">{title}</p></div></header>
        {error && <p className="notice"><strong>Supabase notice</strong><span>{error}</span></p>}
        <section className="panel"><div className="rows">{section.items.length === 0 && <div className="row"><strong>{section.empty}</strong><span>{data.userEmail}</span></div>}{section.items.map(section.render)}</div></section>
      </main>
    );
  }

  return (
    <main className="main app-main">
      <header className="page-head"><div><p className="eyebrow">Care circle</p><h2>{title}</h2><p className="muted">{data.recipient.recovery_status}</p></div><div className="actions compact-actions"><Link className="button" href="/dashboard/family">Invite family</Link><Link className="ghost" href="/sign-out">Sign out</Link></div></header>
      {error && <p className="notice"><strong>Supabase notice</strong><span>{error}</span></p>}
      <section className="grid-4">
        <Link className="metric" href="/dashboard/tasks"><span>Open tasks</span><strong>{openTasks.length}</strong></Link>
        <Link className="metric" href="/dashboard/medications"><span>Medications</span><strong>{data.medications.length}</strong></Link>
        <Link className="metric" href="/dashboard/visits"><span>Appointments</span><strong>{data.visits.length}</strong></Link>
        <Link className="metric" href="/dashboard/reminders"><span>Reminders</span><strong>{data.reminders.length}</strong></Link>
      </section>
      <section className="grid-2 app-section">
        <article className="panel"><div className="panel-head"><h3>Daily brief</h3></div><div className="rows"><div className="row"><strong>{openTasks[0]?.title || "No urgent open task"}</strong><span>{data.userEmail}</span></div><div className="row"><strong>Next visit</strong><span>{data.visits[0] ? `${data.visits[0].title} / ${formatDate(data.visits[0].starts_at)}` : "No appointment scheduled."}</span></div></div></article>
        <article className="panel"><div className="panel-head"><h3>Emergency card</h3></div><div className="rows"><div className="row"><strong>Care focus</strong><span>{data.recipient.primary_condition || "General home care"}</span></div><div className="row"><strong>Summary</strong><span>{data.recipient.emergency_summary || "No emergency summary yet."}</span></div></div></article>
      </section>
    </main>
  );
}
