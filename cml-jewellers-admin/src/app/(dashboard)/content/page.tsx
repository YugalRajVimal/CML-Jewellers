"use client";

import { useEffect, useState } from "react";
import { GripVertical, Image as ImageIcon, Layout, Plus } from "lucide-react";
import * as api from "@/lib/api";
import { Banner, HomepageSection } from "@/lib/types";
import { PageHeader, Panel, StatusPill, Button } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

const SECTION_LABEL: Record<HomepageSection["type"], string> = {
  hero: "Hero",
  category_strip: "Category strip",
  promo_grid: "Promo grid",
  testimonials: "Testimonials",
  newsletter: "Newsletter",
};

function ContentInner() {
  const { can } = useAuth();
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [sections, setSections] = useState<HomepageSection[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ title: "", ctaText: "", ctaUrl: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [b, s] = await Promise.all([api.listBanners(), api.listHomepageSections()]);
    setBanners(b.data);
    setSections(s.data);
  }
  useEffect(() => { load(); }, []);

  async function toggleBanner(id: string) {
    await api.toggleBanner(id);
    await load();
  }

  async function toggleSection(id: string) {
    await api.toggleHomepageSection(id);
    await load();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) { setFormError("Banner title is required."); return; }
    setSaving(true);
    try {
      await api.createBanner(form);
      setDrawerOpen(false);
      setForm({ title: "", ctaText: "", ctaUrl: "" });
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not create banner.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Storefront"
        title="Homepage & banners"
        description="Order and publish the sections and promo banners shown on the customer homepage."
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-ink-900 mb-2 flex items-center gap-2"><Layout size={14} /> Homepage sections</p>
          <Panel className="divide-y divide-line">
            {!sections && <p className="p-6 text-sm text-ink-500 text-center">Loading…</p>}
            {sections?.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-3.5">
                <GripVertical size={15} className="text-ink-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-ink-400">{SECTION_LABEL[s.type]}</p>
                  <p className="text-sm text-ink-900 truncate">{s.title}</p>
                </div>
                <button onClick={() => can("content.write") && toggleSection(s.id)}>
                  <StatusPill status={s.isActive ? "active" : "archived"} />
                </button>
              </div>
            ))}
          </Panel>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-ink-900 flex items-center gap-2"><ImageIcon size={14} /> Promo banners</p>
            {can("content.write") && <Button size="sm" variant="primary" onClick={() => setDrawerOpen(true)}><Plus size={13} /> New banner</Button>}
          </div>
          <Panel className="divide-y divide-line">
            {!banners && <p className="p-6 text-sm text-ink-500 text-center">Loading…</p>}
            {banners?.map((b) => (
              <div key={b.id} className="flex items-center gap-4 p-4">
                <GripVertical size={16} className="text-ink-300 shrink-0" />
                <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-gold-100 text-maroon-700 shrink-0"><ImageIcon size={16} /></span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-900 truncate">{b.title}</p>
                  <p className="text-xs text-ink-500">{b.ctaText} → {b.ctaUrl}</p>
                </div>
                <button onClick={() => can("content.write") && toggleBanner(b.id)}>
                  <StatusPill status={b.isActive ? "active" : "archived"} />
                </button>
              </div>
            ))}
          </Panel>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="New banner" description="New banners are appended to the end of the homepage order and published immediately.">
        <form onSubmit={submit}>
          <Field label="Title"><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Diwali gold, ready to ship" /></Field>
          <Field label="CTA text"><TextInput value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop the edit" /></Field>
          <Field label="CTA link"><TextInput value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="/collections/diwali" /></Field>
          {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Creating…" : "Create banner"}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function ContentPage() {
  return <PermissionGate perm="content.view"><ContentInner /></PermissionGate>;
}
