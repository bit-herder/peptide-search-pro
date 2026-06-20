"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { GuestToolGate } from "@/components/auth/GuestToolGate";

interface ToolsLayoutProps {
  title: string;
  description: string;
  toolSlug: string;
  children: React.ReactNode;
}

export function ToolsLayout({ title, description, toolSlug, children }: ToolsLayoutProps) {
  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/tools"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-accent mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> All tools
        </Link>
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-muted mb-8">{description}</p>
        <div className="glass rounded-2xl p-6">
          <GuestToolGate toolSlug={toolSlug}>{children}</GuestToolGate>
        </div>
        <p className="text-xs text-muted mt-6 leading-relaxed">
          For laboratory research calculations only. Not medical advice. Always verify
          concentrations independently before use in any research protocol.
        </p>
      </main>
    </>
  );
}
