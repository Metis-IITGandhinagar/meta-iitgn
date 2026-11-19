"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { getPrepMatResources, PrepMatItem } from "@/api/prepmat";
import {
  Search,
  ExternalLink,
  Lock,
  ShieldAlert,
  FileText,
  Filter,
  RotateCcw,
  Building2,
  Calendar,
  Copy,
  Check,
  ArrowRight,
  BookmarkCheck,
  Briefcase,
  X,
} from "lucide-react";

export default function PrepMatPage() {
  const { user, loading: authLoading } = useAuth();

  const [resources, setResources] = useState<PrepMatItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedSubType, setSelectedSubType] = useState<string>("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Load resources from API service (bundled JSON for now, ready for backend API)
  useEffect(() => {
    async function loadResources() {
      try {
        setLoadingData(true);
        const data = await getPrepMatResources();
        setResources(data);
      } catch (err) {
        console.error("Failed to load prepmat data:", err);
        toast.error("Failed to load preparation materials");
      } finally {
        setLoadingData(false);
      }
    }
    loadResources();
  }, []);

  // Compute unique filter options dynamically from data
  const years = useMemo(() => {
    const list = Array.from(
      new Set(resources.map((r) => r.year).filter(Boolean))
    );
    return list.sort((a, b) => b.localeCompare(a));
  }, [resources]);

  const types = useMemo(() => {
    const list = Array.from(
      new Set(resources.map((r) => r.type).filter(Boolean))
    );
    return list.sort();
  }, [resources]);

  const subTypes = useMemo(() => {
    const list = Array.from(
      new Set(resources.map((r) => r.subType).filter(Boolean))
    ) as string[];
    return list.sort();
  }, [resources]);

  const domains = useMemo(() => {
    const list = Array.from(
      new Set(resources.map((r) => r.domain).filter(Boolean))
    ) as string[];
    return list.sort();
  }, [resources]);

  // Dynamic filtering
  const filteredResources = useMemo(() => {
    const query = search.toLowerCase().trim();

    return resources.filter((item) => {
      // Year filter
      if (selectedYear !== "all" && item.year !== selectedYear) {
        return false;
      }
      // Type filter
      if (selectedType !== "all" && item.type !== selectedType) {
        return false;
      }
      // SubType filter
      if (selectedSubType !== "all" && item.subType !== selectedSubType) {
        return false;
      }
      // Domain filter
      if (selectedDomain !== "all" && item.domain !== selectedDomain) {
        return false;
      }
      // Search query filter
      if (query) {
        const companyMatch = item.company.toLowerCase().includes(query);
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = (item.description || "")
          .toLowerCase()
          .includes(query);
        const domainMatch = (item.domain || "").toLowerCase().includes(query);
        const subTypeMatch = (item.subType || "").toLowerCase().includes(query);
        const yearMatch = item.year.toLowerCase().includes(query);

        if (
          !companyMatch &&
          !titleMatch &&
          !descMatch &&
          !domainMatch &&
          !subTypeMatch &&
          !yearMatch
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    resources,
    search,
    selectedYear,
    selectedType,
    selectedSubType,
    selectedDomain,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedYear, selectedType, selectedSubType, selectedDomain]);

  // Pagination calculation
  const totalPages =
    pageSize === -1 ? 1 : Math.ceil(filteredResources.length / pageSize) || 1;
  const paginatedResources = useMemo(() => {
    if (pageSize === -1) return filteredResources;
    const start = (currentPage - 1) * pageSize;
    return filteredResources.slice(start, start + pageSize);
  }, [filteredResources, currentPage, pageSize]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedYear("all");
    setSelectedType("all");
    setSelectedSubType("all");
    setSelectedDomain("all");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedYear !== "all" ||
    selectedType !== "all" ||
    selectedSubType !== "all" ||
    selectedDomain !== "all";

  // Copy link handler
  const handleCopyLink = (item: PrepMatItem) => {
    if (!item.url) return;
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    toast.success(`Copied link for ${item.company}!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for type badges
  const getTypeBadgeClass = (type: string) => {
    switch (type.toLowerCase()) {
      case "internship":
        return "badge-primary";
      case "placement":
        return "badge-secondary";
      case "research":
        return "badge-accent";
      case "general guidance":
        return "badge-info";
      default:
        return "badge-neutral";
    }
  };

  // 1. Loading state
  if (authLoading || loadingData) {
    return (
      <div className="h-full w-full overflow-y-auto bg-base-200/30 pt-16 pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 space-y-6 animate-pulse">
          <div className="h-8 w-64 bg-base-300 rounded-lg" />
          <div className="h-4 w-96 bg-base-300/60 rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 bg-base-100 rounded-2xl border border-base-200 p-4"
              />
            ))}
          </div>
          <div className="h-16 bg-base-100 rounded-2xl border border-base-200 p-4" />
          <div className="h-96 bg-base-100 rounded-2xl border border-base-200" />
        </div>
      </div>
    );
  }

  // 2. Sensitive Information - Sign In Gate for Guest Users
  if (!user) {
    return (
      <div className="h-full w-full overflow-y-auto bg-base-100 pt-16 pb-20 px-5 flex items-center justify-center">
        <div className="max-w-lg w-full mx-auto my-auto">
          <p className="inline-flex items-center gap-2 rounded-full border border-base-300 px-3 py-1 text-[12px] text-base-content/75">
            <Lock className="h-3.5 w-3.5" aria-hidden /> IITGN students only
          </p>
          <h1 className="t-display text-balance text-4xl sm:text-5xl mt-5">
            Placement prep, <em className="italic text-primary">unlocked</em> with your account.
          </h1>
          <p className="mt-4 text-[16px] text-base-content/75 leading-relaxed">
            Sign in to open PrepMat. It stays inside the student community.
          </p>

          <ul className="mt-6 space-y-3 text-[14px]">
            {[
              "Year-wise internship and placement preparation documents",
              "Verified interview experiences and guidance sessions",
              "Direct links to Google Drive and Docs preparation sheets",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <BookmarkCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/login"
              className="h-12 px-7 inline-flex items-center gap-2 rounded-full bg-primary text-primary-content text-[15px] font-medium hover:opacity-90 transition-opacity"
            >
              Sign in to continue <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/"
              className="h-12 px-6 inline-flex items-center rounded-full border border-base-300 text-[15px] font-medium hover:border-base-content transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated View: Full Dynamic Filterable PrepMat Resource Table
  return (
    <div className="h-full w-full overflow-y-auto bg-base-100 pt-16 pb-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-8 space-y-6">
        {/* Top Header Banner */}
        <div className="p-4 sm:p-8  relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <h1 className="t-display text-4xl md:text-5xl text-base-content flex items-center gap-3">
                IITGN Placement & Internship PrepMat
              </h1>
              <p className="text-xs sm:text-sm text-base-content/70 max-w-2xl leading-relaxed hidden md:flex">
                Comprehensive archives from 2020-21 through 2026-27 covering
                company interview tests, industrial internships, placements, and
                foreign research programs. Documents open directly in Google
                Docs or Google Drive.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="md:flex flex-wrap items-center gap-2.5 shrink-0 hidden">
              <a
                href="https://docs.google.com/spreadsheets/d/1hYLePWpD1F1TyNg5cWxRAAZ4jaLvtYwkcHcAq3PTonk/preview"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm gap-2 shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Master Sheet
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-base-content/60 font-medium">
                Resources
              </div>
              <div className="text-lg sm:text-xl font-black text-base-content">
                {filteredResources.length}{" "}
                <span className="text-xs font-normal text-base-content/50">
                  / {resources.length}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-base-content/60 font-medium">
                Companies
              </div>
              <div className="text-lg sm:text-xl font-black text-base-content">
                {new Set(resources.map((r) => r.company)).size}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm md:flex hidden items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-base-content/60 font-medium ">
                Academic Years
              </div>
              <div className="text-lg sm:text-xl font-black text-base-content">
                {years.length}
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="rounded-3xl border border-base-200 bg-base-100 p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by company, document name, role or domain (e.g. Google, Zomato, Hardware, Barclays)..."
                className="input input-bordered input-sm sm:input-md w-full pl-10 pr-9 rounded-2xl bg-base-200/50 border-base-300 focus:bg-base-100 transition-all text-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 inline-flex items-center justify-center rounded-lg text-base-content/60 hover:text-base-content hover:bg-base-200"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            {/* Quick Reset Filter Button */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="btn btn-ghost btn-sm gap-1.5 text-error hover:bg-error/10 shrink-0 self-end lg:self-center"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Filters
              </button>
            )}
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-base-200">
            {/* Year Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="select select-bordered select-sm w-full rounded-xl bg-base-200 text-xs font-medium px-2"
              >
                <option value="all">All Academic Years ({years.length})</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
                <Filter className="h-3 w-3" /> Category Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="select select-bordered select-sm w-full rounded-xl bg-base-200 text-xs font-medium px-2"
              >
                <option value="all">All Category Types</option>
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* SubType Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> Program Type
              </label>
              <select
                value={selectedSubType}
                onChange={(e) => setSelectedSubType(e.target.value)}
                className="select select-bordered select-sm w-full rounded-xl bg-base-200 text-xs font-medium px-2"
              >
                <option value="all">All Program Types</option>
                {subTypes.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Domain Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Domain / Industry
              </label>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="select select-bordered select-sm w-full rounded-xl bg-base-200 text-xs font-medium px-2"
              >
                <option value="all">All Domains</option>
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Info & Count */}
        <div className="flex items-center justify-between px-1 text-xs text-base-content/70">
          <div>
            Showing{" "}
            <span className="font-bold text-base-content">
              {paginatedResources.length}
            </span>{" "}
            of{" "}
            <span className="font-bold text-base-content">
              {filteredResources.length}
            </span>{" "}
            material
            {filteredResources.length === 1 ? "" : "s"}
            {hasActiveFilters && (
              <span className="ml-1 text-primary font-medium">
                (filtered from {resources.length})
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-primary hover:underline font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block rounded-3xl border border-base-200 bg-base-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-sm">
              <thead className="bg-base-200/60 text-xs uppercase text-base-content/70 border-b border-base-200">
                <tr>
                  <th className="w-12 text-center">#</th>
                  <th>Company / Organization</th>
                  <th>Year</th>
                  <th>Type & Program</th>
                  <th>Domain</th>
                  {/* <th>Preparation Document</th> */}
                  <th className="text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200/60">
                {paginatedResources.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center justify-center gap-3 text-base-content/50">
                        <FileText className="h-10 w-10 stroke-[1.5]" />
                        <div className="text-base font-bold text-base-content">
                          No materials found
                        </div>
                        <p className="text-xs text-base-content/60 max-w-sm">
                          No preparation materials match your current search and
                          filters. Try clearing filters or searching with
                          different keywords.
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={handleResetFilters}
                            className="btn btn-outline btn-sm rounded-xl mt-2"
                          >
                            Reset All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedResources.map((item, index) => {
                    const isCopied = copiedId === item.id;
                    const globalIdx =
                      pageSize === -1
                        ? index + 1
                        : (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-base-200/40 transition-colors"
                      >
                        {/* Index */}
                        <td className="text-center font-mono text-xs text-base-content/50">
                          {globalIdx}
                        </td>

                        {/* Company */}
                        <td>
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-bold text-base-content">
                                {item.company}
                              </div>
                              {item.description && (
                                <p className="text-[11px] text-base-content/60 line-clamp-1 max-w-xs">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Year */}
                        <td>
                          <span className="font-mono text-[11px]">
                            {item.year}
                          </span>
                        </td>

                        {/* Type & SubType */}
                        <td>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`badge ${getTypeBadgeClass(
                                item.type
                              )} text-[11px] font-semibold`}
                            >
                              {item.type}
                            </span>
                            {item.subType && (
                              <span className="badge badge-outline text-[11px] text-base-content/70">
                                {item.subType}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Domain */}
                        <td>
                          <span className="text-xs text-base-content/75 font-medium">
                            {item.domain || "General"}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.url && (
                              <>
                                <button
                                  onClick={() => handleCopyLink(item)}
                                  className="btn btn-ghost btn-xs rounded-lg text-base-content/60 hover:text-base-content"
                                  title="Copy document URL"
                                >
                                  {isCopied ? (
                                    <Check className="h-3.5 w-3.5 text-success" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-primary btn-outline btn-xs rounded-lg gap-1 font-semibold"
                                >
                                  Open
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Desktop Pagination Bar */}
          {filteredResources.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-base-200 bg-base-100">
              <div className="flex items-center  gap-2 text-xs text-base-content/70">
                <span className="whitespace-nowrap">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="select select-auto select-xs rounded-lg bg-base-200 "
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={-1}>All ({filteredResources.length})</option>
                </select>
                <span className="whitespace-nowrap">
                  Showing{" "}
                  {pageSize === -1 ? 1 : (currentPage - 1) * pageSize + 1}–
                  {pageSize === -1
                    ? filteredResources.length
                    : Math.min(
                        currentPage * pageSize,
                        filteredResources.length
                      )}{" "}
                  of {filteredResources.length}
                </span>
              </div>

              {totalPages > 1 && (
                <div className="join">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="join-item btn btn-xs btn-outline"
                  >
                    « Prev
                  </button>
                  <button className="join-item btn btn-xs btn-outline pointer-events-none">
                    Page {currentPage} of {totalPages}
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="join-item btn btn-xs btn-outline"
                  >
                    Next »
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Responsive Cards View */}
        <div className="block md:hidden space-y-3">
          {paginatedResources.length === 0 ? (
            <div className="rounded-3xl border border-base-200 bg-base-100 p-8 text-center space-y-3">
              <FileText className="h-10 w-10 mx-auto text-base-content/40 stroke-[1.5]" />
              <div className="text-base font-bold text-base-content">
                No materials found
              </div>
              <p className="text-xs text-base-content/60">
                No preparation materials match your current search and filters.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="btn btn-outline btn-sm rounded-xl mt-2"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          ) : (
            paginatedResources.map((item) => {
              const isCopied = copiedId === item.id;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-base-200 bg-base-100 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase border border-primary/20">
                        {item.company.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-base-content text-sm leading-tight">
                          {item.company}
                        </div>
                        <div className="text-[11px] text-base-content/60 font-mono mt-0.5">
                          {item.year}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <span
                        className={`badge ${getTypeBadgeClass(
                          item.type
                        )} md:text-[10px] text-[9px] truncate font-semibold py-1 px-2`}
                      >
                        {item.type}
                      </span>
                    </div>
                  </div>

                  {item.subType && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="badge badge-outline text-[11px] text-base-content/70">
                        {item.subType}
                      </span>
                      {item.domain && (
                        <span className="badge badge-ghost text-[11px] text-base-content/60">
                          {item.domain}
                        </span>
                      )}
                    </div>
                  )}

                  {item.description && (
                    <p className="text-xs text-base-content/70 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  <div className="pt-2 border-t border-base-200 flex items-center justify-between gap-2">
                    {item.url ? (
                      <>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-primary hover:underline truncate flex items-center gap-1"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </a>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleCopyLink(item)}
                            className="btn btn-ghost btn-xs p-1 text-base-content/60"
                            title="Copy Link"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-success" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-xs gap-1"
                          >
                            Open
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-base-content/40 italic">
                        Link pending
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Mobile Pagination */}
          {filteredResources.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-xs btn-outline rounded-lg"
              >
                « Prev
              </button>
              <span className="text-xs text-base-content/70">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="btn btn-xs btn-outline rounded-lg"
              >
                Next »
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
