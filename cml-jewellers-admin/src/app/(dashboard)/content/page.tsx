"use client";

import { useEffect, useState } from "react";
import { GripVertical, Image as ImageIcon, Layout, Plus } from "lucide-react";
import * as api from "@/lib/api";
import { Banner, HomepageSection } from "@/lib/types";
import { PageHeader, Panel, StatusPill, Button } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

// These types can be extended if backend adds new types
const SECTION_LABEL: Record<string, string> = {
  hero: "Hero",
  category_strip: "Category strip",
  promo_grid: "Promo grid",
  testimonials: "Testimonials",
  newsletter: "Newsletter",
};

function getBannerId(b: any): string {
  return b.id || b._id || "";
}

function getSectionId(s: any): string {
  return s.id || s._id || "";
}

function getSectionType(s: any): string {
  // Accept 'type' or fallback to 'section' for legacy/variant data
  return s.type || s.section || "section";
}

function getSectionIsActive(s: any): boolean {
  return typeof s.isActive === "boolean" ? s.isActive : false;
}

function getBannerIsActive(b: any): boolean {
  return typeof b.isActive === "boolean" ? b.isActive : false;
}

function ContentInner() {
  const { can } = useAuth();
  const [banners, setBanners] = useState<any[] | null>(null);
  const [sections, setSections] = useState<any[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ title: "", ctaText: "", ctaUrl: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const [bRes, sRes] = await Promise.all([api.listBanners(), api.listHomepageSections()]);

    // Defensive: handle {banners: [...]}, {sections: [...]}, and possible direct arrays
    let bannersArr: any[] =
      Array.isArray(bRes.data)
        ? bRes.data
        : (Array.isArray(bRes.data?.banners) ? bRes.data.banners : []);
    let sectionsArr: any[] =
      Array.isArray(sRes.data)
        ? sRes.data
        : (Array.isArray(sRes.data?.sections) ? sRes.data.sections : []);

    console.log("Banners loaded:", bannersArr);
    console.log("Homepage sections loaded:", sectionsArr);

    setBanners(bannersArr);
    setSections(sectionsArr);
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
              <div key={getSectionId(s)} className="flex items-center gap-3 p-3.5">
                <GripVertical size={15} className="text-ink-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-ink-400">{SECTION_LABEL[getSectionType(s)] || getSectionType(s)}</p>
                  <p className="text-sm text-ink-900 truncate">{s.title}</p>
                </div>
                <button onClick={() => can("content:manage") && toggleSection(getSectionId(s))}>
                  <StatusPill status={getSectionIsActive(s) ? "active" : "archived"} />
                </button>
              </div>
            ))}
          </Panel>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-ink-900 flex items-center gap-2"><ImageIcon size={14} /> Promo banners</p>
            {can("content:manage") && <Button size="sm" variant="primary" onClick={() => setDrawerOpen(true)}><Plus size={13} /> New banner</Button>}
          </div>
          <Panel className="divide-y divide-line">
            {!banners && <p className="p-6 text-sm text-ink-500 text-center">Loading…</p>}
            {banners?.map((b) => (
              <div key={getBannerId(b)} className="flex items-center gap-4 p-4">
                <GripVertical size={16} className="text-ink-300 shrink-0" />
                <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-gold-100 text-maroon-700 shrink-0"><ImageIcon size={16} /></span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-900 truncate">{b.title}</p>
                  <p className="text-xs text-ink-500">{b.ctaText} → {b.ctaUrl}</p>
                </div>
                <button onClick={() => can("content:manage") && toggleBanner(getBannerId(b))}>
                  <StatusPill status={getBannerIsActive(b) ? "active" : "archived"} />
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
  return <PermissionGate perm="content:manage"><ContentInner /></PermissionGate>;
}
