import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <main className="hero">
      <div className="floating-tools">
        <ThemeToggle />
      </div>
      <section className="hero-content">
        <img className="hero-logo" src="/homex-logo.png" alt="HOMEX" />
        <p className="eyebrow">Private home-care coordination</p>
        <h1>Care becomes clearer when everyone has one plan.</h1>
        <p>
          One private care circle for the daily details: tasks, medication, appointments,
          documents, updates, and the people who need to know.
        </p>
        <div className="actions">
          <Link className="button" href="/sign-in">Create a care circle <ArrowRight size={18} /></Link>
          <Link className="ghost" href="/sign-in">Sign in</Link>
        </div>
        <p className="hero-note"><ShieldCheck size={17} /> Family members join only through a secure link from the circle lead.</p>
      </section>
    </main>
  );
}
