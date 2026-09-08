"use client";

import { useEffect, useState } from "react";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import * as api from "@/lib/api";
import { Category } from "@/lib/types";
import { PageHeader, Panel, Button, StatusPill, Select } from "@/components/ui";
import { Drawer, Field, TextInput } from "@/components/drawer";
import { PermissionGate } from "@/components/permission-gate";
import { useAuth } from "@/lib/auth";

function CategoriesInner() {
  const { can } = useAuth();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<Record<string, string>>({});
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function load() {
    const res = await api.listCategories();
    setCategories(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setParentId("");
    setFormError(null);
    setDrawerOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setParentId(cat.parentId ?? "");
    setFormError(null);
    setDrawerOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) { setFormError("Category name is required."); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.updateCategory(editing.id, { name: name.trim() });
      } else {
        await api.createCategory({ name: name.trim(), parentId: parentId || null });
      }
      setDrawerOpen(false);
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteError((d) => ({ ...d, [id]: "" }));
    try {
      await api.deleteCategory(id);
      setPendingDelete(null);
      await load();
    } catch (e) {
      setDeleteError((d) => ({ ...d, [id]: e instanceof Error ? e.message : "Could not delete category." }));
    }
  }

  const roots = categories?.filter((c) => !c.parentId) ?? [];
  const childrenOf = (id: string) => categories?.filter((c) => c.parentId === id) ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Top-level categories and their subcategories, with live product counts."
        actions={can("categories.write") && <Button variant="primary" onClick={openCreate}><Plus size={15} /> New category</Button>}
      />
      {!categories ? (
        <Panel className="p-8 text-center text-sm text-ink-500">Loading…</Panel>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {roots.map((cat) => (
            <Panel key={cat.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-100 text-maroon-700"><Layers size={15} /></span>
                  <div>
                    <p className="font-medium text-ink-900">{cat.name}</p>
                    <p className="text-xs text-ink-500 font-mono">/{cat.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusPill status={cat.isActive ? "active" : "archived"} />
                  {can("categories.write") && (
                    <>
                      <button onClick={() => openEdit(cat)} className="rounded-md p-1 hover:bg-ink-100" aria-label="Edit"><Pencil size={13} className="text-ink-500" /></button>
                      <button onClick={() => setPendingDelete(cat.id)} className="rounded-md p-1 hover:bg-ink-100" aria-label="Delete"><Trash2 size={13} className="text-bad" /></button>
                    </>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-500">{cat.productCount} products</p>
              {pendingDelete === cat.id && (
                <div className="mt-3 rounded-lg border border-bad/30 bg-bad/5 p-2.5">
                  <p className="text-xs text-ink-900">Delete &ldquo;{cat.name}&rdquo;?</p>
                  {deleteError[cat.id] && <p className="text-xs text-bad mt-1">{deleteError[cat.id]}</p>}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="danger" onClick={() => handleDelete(cat.id)}>Delete</Button>
                    <Button size="sm" variant="secondary" onClick={() => setPendingDelete(null)}>Cancel</Button>
                  </div>
                </div>
              )}
              {childrenOf(cat.id).length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-line pt-3">
                  {childrenOf(cat.id).map((child) => (
                    <li key={child.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink-700">↳ {child.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-500">{child.productCount} products</span>
                        {can("categories.write") && (
                          <button onClick={() => openEdit(child)} className="rounded-md p-1 hover:bg-ink-100" aria-label="Edit"><Pencil size={12} className="text-ink-400" /></button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>
      )}

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit category" : "New category"}
        description={editing ? undefined : "Top-level categories can hold subcategories underneath them."}
      >
        <form onSubmit={submit}>
          <Field label="Category name"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Pendants" /></Field>
          {!editing && (
            <Field label="Parent category" hint="Leave blank to create a top-level category">
              <Select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full">
                <option value="">None (top-level)</option>
                {roots.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          )}
          {formError && <p className="text-sm text-bad mb-3">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create category"}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}

export default function CategoriesPage() {
  return <PermissionGate perm="categories.view"><CategoriesInner /></PermissionGate>;
}
