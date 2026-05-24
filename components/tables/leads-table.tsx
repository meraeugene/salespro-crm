"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, BriefcaseBusiness, Filter, MoreHorizontal, Pencil, RotateCcw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { shortDate } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import type { Lead } from "@/types/crm";

export function LeadsTable({ leads, isLoading = false, onEdit, onDelete, onConvert }: { leads?: Lead[]; isLoading?: boolean; onEdit?: (lead: Lead) => void; onDelete?: (lead: Lead) => void; onConvert?: (lead: Lead) => void }) {
  const globalSearch = useUiStore((state) => state.search);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortAsc, setSortAsc] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const pageSize = 5;

  const statuses = useMemo(() => Array.from(new Set((leads ?? []).map((lead) => lead.status))).sort(), [leads]);
  const sources = useMemo(() => Array.from(new Set((leads ?? []).map((lead) => lead.lead_source))).sort(), [leads]);
  const activeFilterCount = Number(Boolean(statusFilter)) + Number(Boolean(sourceFilter));
  const hasFilters = activeFilterCount > 0;
  const showActions = Boolean(onEdit || onDelete || onConvert);

  const filtered = useMemo(() => {
    const source = leads ?? [];
    const terms = `${globalSearch} ${query}`.toLowerCase().split(/\s+/).filter(Boolean);
    return source
      .filter((lead) => {
        const haystack = `${lead.full_name} ${lead.company} ${lead.email} ${lead.phone} ${lead.lead_source} ${lead.assigned_user ?? ""}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .filter((lead) => (statusFilter ? lead.status === statusFilter : true))
      .filter((lead) => (sourceFilter ? lead.lead_source === sourceFilter : true))
      .sort((a, b) => (sortAsc ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name)));
  }, [globalSearch, leads, query, sortAsc, sourceFilter, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <Card className="overflow-visible">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
        <h2 className="text-lg font-semibold">Leads & Contacts Table</h2>
        <div className="relative md:ml-auto md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input placeholder="Search leads" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" />
        </div>
        <Button variant="secondary" size="sm" onClick={() => setSortAsc((value) => !value)}>
          <ArrowDownUp className="h-4 w-4" />
          Sort
        </Button>
        <div className="relative">
        <Button variant={hasFilters ? "primary" : "secondary"} size="sm" onClick={() => setFiltersOpen((value) => !value)}>
          <Filter className="h-4 w-4" />
          {hasFilters ? `${activeFilterCount} filters` : "Filter"}
        </Button>
        {filtersOpen ? (
          <div className="absolute right-0 top-12 z-30 w-80 rounded-lg border border-border bg-white p-4 shadow-[0_18px_40px_rgba(17,24,39,0.10)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Filter leads</h3>
                <p className="mt-1 text-xs text-muted">Narrow the table by status or source.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" className="bg-blue-50 text-primary hover:bg-primary hover:text-white" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium">
                <span className="mb-2 block">Status</span>
                <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15">
                  <option value="" className="text-muted">Any status</option>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">
                <span className="mb-2 block">Lead source</span>
                <select value={sourceFilter} onChange={(event) => { setSourceFilter(event.target.value); setPage(1); }} className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15">
                  <option value="" className="text-muted">Any source</option>
                  {sources.map((source) => <option key={source}>{source}</option>)}
                </select>
              </label>
              {hasFilters ? (
                <div className="flex flex-wrap gap-2 text-xs">
                  {statusFilter ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-primary">Status: {statusFilter}</span> : null}
                  {sourceFilter ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-primary">Source: {sourceFilter}</span> : null}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => { setStatusFilter(""); setSourceFilter(""); setPage(1); }}>
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
                <Button type="button" size="sm" onClick={() => setFiltersOpen(false)}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        </div>
      </div>
      {isLoading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="p-4">
          <EmptyState title="No leads found" description="Create a lead or adjust the current filters to see matching records." />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-muted">
              <tr>
                <th className="px-5 py-4 font-medium">Lead Name</th>
                <th className="px-5 py-4 font-medium">Company</th>
                <th className="px-5 py-4 font-medium">Email Address</th>
                <th className="px-5 py-4 font-medium">Phone Number</th>
                <th className="px-5 py-4 font-medium">Lead Source</th>
                <th className="px-5 py-4 font-medium">Last Contacted</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 font-medium">Assigned Sales Rep</th>
                {showActions ? <th className="px-5 py-4 font-medium">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((lead, index) => (
                <tr key={lead.id} className="border-t border-border hover:bg-slate-50/70">
                  <td className="px-5 py-4 font-medium">{lead.full_name}</td>
                  <td className="px-5 py-4 text-muted">{lead.company}</td>
                  <td className="px-5 py-4 text-muted">{lead.email}</td>
                  <td className="px-5 py-4 text-muted">{lead.phone}</td>
                  <td className="px-5 py-4 text-muted">{lead.lead_source}</td>
                  <td className="px-5 py-4 text-muted">{shortDate(lead.last_contacted)}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-5 py-4 text-muted">{lead.assigned_user ?? "Unassigned"}</td>
                  {showActions ? (
                    <td className="px-5 py-4">
                      <LeadActions lead={lead} onEdit={onEdit} onDelete={onDelete} onConvert={onConvert} />
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={pageCount} onPageChange={setPage} />
    </Card>
  );
}

function LeadActions({ lead, onEdit, onDelete, onConvert }: { lead: Lead; onEdit?: (lead: Lead) => void; onDelete?: (lead: Lead) => void; onConvert?: (lead: Lead) => void }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const canConvert = Boolean(onConvert && lead.status === "Qualified");

  useEffect(() => {
    if (!open) return;
    function placeMenu() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 176;
      const height = canConvert ? 116 : 80;
      const left = Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12));
      const hasSpaceBelow = rect.bottom + height + 12 < window.innerHeight;
      const top = hasSpaceBelow ? rect.bottom + 8 : Math.max(12, rect.top - height - 8);
      setMenuPosition({ left, top });
    }
    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);
    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [canConvert, open]);

  if (!onEdit && !onDelete && !canConvert) return null;

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="secondary"
        size="icon"
        onClick={() => setOpen((value) => !value)}
        aria-label={`${lead.full_name} actions`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div
          className="fixed z-50 w-44 overflow-hidden rounded-lg border border-border bg-white p-1 shadow-[0_16px_35px_rgba(17,24,39,0.14)]"
          style={{ left: menuPosition.left, top: menuPosition.top }}
        >
          {canConvert ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onConvert?.(lead);
              }}
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-blue-50 hover:text-primary"
            >
              <BriefcaseBusiness className="h-4 w-4" />
              Convert to Deal
            </button>
          ) : null}
          {onEdit ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onEdit(lead);
              }}
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-blue-50 hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete(lead);
              }}
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
