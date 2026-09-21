"use client";

import { useEffect, useState } from "react";
import { GripVertical, Image as ImageIcon, Layout, Plus } from "lucide-react";
import * as api from "@/lib/api";
import { BannerType } from "@/lib/types";
import { PageHeader, Panel, StatusPill, Button, Select } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { ImageUploader } from "@/components/image-uploader";
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

// Banner types accepted by the backend (createBannerSchema).
const BANNER_TYPE_OPTIONS: { value: BannerType; label: string }[] = [
  { value: "hero", label: "Hero" },
  { value: "promo", label: "Promo" },
  { value: "category", label: "Category" },
  { value: "strip", label: "Strip" },
];

const emptyForm = { type: "promo" as BannerType, title: "", ctaText: "", ctaUrl: "" };

function getBannerId(b: any): string {
  return b.id || b._id || "";
}

function getSectionId(s: any): string {
  return s.id || s._id || "";
}

// Homepage sections are addressed by their `section` key (not the Mongo id) by
// the backend's /content/homepage/:section routes.
function getSectionKey(s: any): string {
  return typeof s.section === "string" ? s.section : "";
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
  const [form, setForm] = useState(emptyForm);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Surfaces load / toggle failures, which previously failed silently.
  const [pageError, setPageError] = useState<string | null>(null);

  async function load() {
    try {
      const [bRes, sRes] = await Promise.all([api.listBanners(), api.listHomepageSections()]);

      // Defensive: handle both {banners:[...]} | [ ... ] | {data:{}}
      let bannersArr: any[] = [];
      if (Array.isArray(bRes.data)) {
        bannersArr = bRes.data;
      } else if (
        bRes.data &&
        typeof bRes.data === "object" &&
        "banners" in bRes.data &&
        Array.isArray((bRes.data as any).banners)
      ) {
        bannersArr = (bRes.data as any).banners;
      }

      let sectionsArr: any[] = [];
      if (Array.isArray(sRes.data)) {
        sectionsArr = sRes.data;
      } else if (
        sRes.data &&
        typeof sRes.data === "object" &&
        "sections" in sRes.data &&
        Array.isArray((sRes.data as any).sections)
      ) {
        sectionsArr = (sRes.data as any).sections;
      }

      setBanners(bannersArr);
      setSections(sectionsArr);
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Could not load homepage content.");
      setBanners((prev) => prev ?? []);
      setSections((prev) => prev ?? []);
    }
  }

  useEffect(() => { load(); }, []);

  // The current isActive value comes from the row itself — the backend has no
  // GET-by-id for banners or GET-by-key for homepage sections to re-read it from,
  // and the old client-side lookup always came back undefined, so these could
  // only ever switch ON (BUG-03).
  async function toggleBanner(b: any) {
    setPageError(null);
    try {
      await api.toggleBanner(getBannerId(b), getBannerIsActive(b));
      await load();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Could not update banner.");
    }
  }

  async function toggleSection(s: any) {
    setPageError(null);
    const key = getSectionKey(s);
    if (!key) {
      setPageError("This section has no key, so it can't be toggled.");
      return;
    }
    try {
      await api.toggleHomepageSection(key, getSectionIsActive(s));
      await load();
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Could not update section.");
    }
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setImageUrl(null);
    setFormError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!form.title.trim()) { setFormError("Banner title is required."); return; }
    // The backend requires an image for every banner (BUG-06).
    if (!imageUrl) { setFormError("Banner image is required."); return; }
    setSaving(true);
    try {
      // Append to the end of the banners of the same type (matches the drawer text).
      const nextOrder =
        (banners ?? [])
          .filter((b) => b.type === form.type)
          .reduce((max, b) => Math.max(max, typeof b.order === "number" ? b.order : 0), 0) + 1;

      await api.createBanner({
        type: form.type,
        imageUrl,
        title: form.title.trim(),
        ctaText: form.ctaText.trim() || undefined,
        ctaUrl: form.ctaUrl.trim() || undefined,
        order: nextOrder,
      });
      setDrawerOpen(false);
      setForm(emptyForm);
      setImageUrl(null);
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

      {pageError && <p className="mb-3 text-sm text-bad">{pageError}</p>}

      <div className="grid lg:grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-ink-900 mb-2 flex items-center gap-2"><Layout size={14} /> Homepage sections</p>
          <Panel className="divide-y divide-line">
            {!sections && <p className="p-6 text-sm text-ink-500 text-center">Loading…</p>}
            {sections?.map((s) => (
              <div key={getSectionId(s) || getSectionKey(s)} className="flex items-center gap-3 p-3.5">
                <GripVertical size={15} className="text-ink-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-ink-400">{SECTION_LABEL[getSectionType(s)] || getSectionType(s)}</p>
                  <p className="text-sm text-ink-900 truncate">{s.title}</p>
                </div>
                <button onClick={() => can("content:manage") && toggleSection(s)}>
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
                {b.imageUrl ? (
                  <div className="flex h-10 w-14 items-center justify-center overflow-hidden rounded-lg bg-gold-100 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.imageUrl} alt={b.title || ""} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-gold-100 text-maroon-700 shrink-0"><ImageIcon size={16} /></span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-900 truncate">{b.title}</p>
                  <p className="text-xs text-ink-500 truncate">
                    {b.type && <span className="uppercase tracking-wide text-ink-400 mr-1.5">{b.type}</span>}
                    {b.ctaText || b.ctaUrl ? `${b.ctaText ?? ""} → ${b.ctaUrl ?? ""}` : "No call to action"}
                  </p>
                </div>
                <button onClick={() => can("content:manage") && toggleBanner(b)}>
                  <StatusPill status={getBannerIsActive(b) ? "active" : "archived"} />
                </button>
              </div>
            ))}
          </Panel>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={closeDrawer} title="New banner" description="New banners are appended to the end of their type's order and published immediately.">
        <form onSubmit={submit}>
          <div className="mb-4">
            <ImageUploader value={imageUrl} onChange={setImageUrl} folder="banners" label="Banner image" />
          </div>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as BannerType })} className="w-full">
              {BANNER_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Title"><TextInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Diwali gold, ready to ship" /></Field>
          <Field label="CTA text"><TextInput value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop the edit" /></Field>
          <Field label="CTA link"><TextInput value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="/collections/diwali" /></Field>
          {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeDrawer}>Cancel</Button>
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