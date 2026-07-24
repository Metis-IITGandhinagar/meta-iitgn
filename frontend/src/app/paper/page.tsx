"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { apiService } from "@/api";
import { type Paper } from "@/lib/types";
import { departments, years, examTypes } from "@/lib/types";

const examTypeStyles: Record<string, string> = {
  midsem: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  endsem: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  quiz: "bg-sky-500/10 text-sky-600 border-sky-500/20",
};

const getExamTypeStyle = (type: string) =>
  examTypeStyles[type?.toLowerCase()] ??
  "bg-blue-500/10 text-blue-600 border-blue-500/20";

const SkeletonCard = () => (
  <div className="rounded-xl border border-base-300 bg-base-100 p-4 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-5 w-16 bg-base-300/70 rounded-full" />
      <div className="h-3 w-8 bg-base-300/70 rounded" />
    </div>
    <div className="h-3 w-20 bg-base-300/70 rounded mb-2" />
    <div className="h-4 w-3/4 bg-base-300/70 rounded mb-4" />
    <div className="space-y-2 mb-4">
      <div className="h-2.5 w-full bg-base-300/50 rounded" />
      <div className="h-2.5 w-full bg-base-300/50 rounded" />
      <div className="h-2.5 w-2/3 bg-base-300/50 rounded" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      <div className="h-8 bg-base-300/60 rounded-lg" />
      <div className="h-8 bg-base-300/60 rounded-lg" />
    </div>
  </div>
);

const Home = () => {
  const { user } = useAuth();

  const [papers, setPapers] = useState<Paper[]>([]);
  
  // Draft filter states (bound to inputs)
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [examType, setExamType] = useState("");

  // Applied filter states (used for API requests)
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedDepartment, setAppliedDepartment] = useState("");
  const [appliedYear, setAppliedYear] = useState("");
  const [appliedExamType, setAppliedExamType] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPapers, setTotalPapers] = useState(0);
  const limit = 8;

  const { data, isLoading } = useQuery({
    queryKey: ["papers", appliedSearch, appliedDepartment, appliedYear, appliedExamType, page],
    queryFn: () =>
      apiService.getPapers({
        search: appliedSearch,
        department: appliedDepartment,
        year: appliedYear,
        examType: appliedExamType,
        page,
        limit,
      }),
  });

  const loading = isLoading;

  useEffect(() => {
    if (data && data.success) {
      setPapers(data.data.papers);
      setTotalPages(data.data.totalPages);
      setTotalPapers(data.data.total);
    }
  }, [data]);

  const handleGo = () => {
    setAppliedSearch(search);
    setAppliedDepartment(department);
    setAppliedYear(year);
    setAppliedExamType(examType);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleGo();
    }
  };

  const handleDownload = async (paperId: number, pdfUrl: string) => {
    try {
      const response = await apiService.downloadPaper(paperId);

      if (response.success) {
        setPapers((prevPapers) =>
          prevPapers.map((paper) =>
            paper.paper_id === paperId
               ? { ...paper, downloads: response.data.downloads }
              : paper
          )
        );
      }
    } catch (err) {
      console.error("Failed to increment download count:", err);
    } finally {
      window.open(pdfUrl, "_blank");
    }
  };

  const handlePreview = (pdfUrl: string) => {
    window.open(pdfUrl, "_blank");
  };

  const clearFilters = () => {
    setSearch("");
    setDepartment("");
    setYear("");
    setExamType("");
    setAppliedSearch("");
    setAppliedDepartment("");
    setAppliedYear("");
    setAppliedExamType("");
    setPage(1);
  };
  const hasAnyFilter = !!(search || department || year || examType || appliedSearch || appliedDepartment || appliedYear || appliedExamType);

  // Build a compact page-number list with ellipses for pagination
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const windowSize = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= page - windowSize && i <= page + windowSize)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  return (
    <div className="flex-1 overflow-y-auto h-full w-full bg-transparent text-primary font-sans pb-20 mt-16">
      <main className="max-w-7xl mx-auto px-6 pt-10">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-[2.15rem] font-extrabold text-primary tracking-tight leading-tight">
              Find Previous Year Question Papers
            </h1>
            <p className="text-sm text-slate-400 mt-2.5 max-w-2xl mx-auto leading-relaxed">
              A centralized archive where IITGN students search, preview, and
              download exam papers by course, department, year, or exam type.
              Help future students by contributing papers you already have.
            </p>
          </div>

          <Link
            href={user ? "/paper/upload" : "/login"}
            className="group inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30 hover:-translate-y-0.5"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:rotate-90"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <span>Upload a paper</span>
          </Link>

          <p className="text-xs text-amber-500/90 font-medium bg-amber-500/10 border border-amber-500/20 rounded-full px-3.5 py-1.5">
            Can&apos;t find what you need? Upload the paper and help others too.
          </p>
        </div>

        {/* Filter bar */}
        <div className="sticky top-2 z-10 backdrop-blur supports-[backdrop-filter]:bg-base-100/70 bg-base-100/95 border border-base-300 rounded-xl p-3.5 mb-7 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1.2fr_1.2fr_1.2fr_auto] gap-3 items-center">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/40"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search course code or name (e.g. CS101)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-base-300 bg-transparent font-medium text-base-content placeholder-base-content/40 focus:outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 text-sm transition-all"
              />
            </div>

            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-base-300 bg-transparent font-medium text-base-content focus:outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 text-sm cursor-pointer transition-all"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-base-300 bg-transparent font-medium text-base-content focus:outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 text-sm cursor-pointer transition-all"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-base-300 bg-transparent font-medium text-base-content focus:outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 text-sm cursor-pointer transition-all"
            >
              <option value="">All Exam Types</option>
              {examTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 w-full sm:col-span-2 md:col-span-1">
              <button
                onClick={handleGo}
                className="flex-1 md:flex-initial px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30 hover:-translate-y-0.5 active:translate-y-0"
              >
                Go
              </button>
              {hasAnyFilter ? (
                <button
                  onClick={clearFilters}
                  className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-lg border border-base-300 text-xs font-semibold text-base-content/70 hover:text-base-content hover:border-base-content/30 transition-all whitespace-nowrap"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: limit }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-base-300 bg-base-100/40">
            <svg
              className="mx-auto h-10 w-10 text-base-content/25 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
              />
            </svg>
            <p className="text-base-content/70 text-sm font-semibold">
              No exam papers found
            </p>
            <p className="text-base-content/40 text-xs mt-1.5 mb-4">
              Try adjusting your search or filters, or be the first to
              contribute this paper.
            </p>
            <Link
              href={user ? "/paper/upload" : "/login"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Upload a paper
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-xs text-base-content/40 font-medium mb-3">
              {totalPapers} paper{totalPapers !== 1 ? "s" : ""} found
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {papers.map((paper) => (
                <div
                  key={paper.paper_id}
                  className="group rounded-xl border border-base-300 bg-base-100 hover:border-blue-500/40 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${getExamTypeStyle(
                          paper.exam_type
                        )}`}
                      >
                        {paper.exam_type}
                      </span>
                      <span className="text-[10px] font-semibold text-base-content/50 tabular-nums">
                        {paper.year}
                      </span>
                    </div>

                    <div className="font-mono text-[11px] font-bold text-blue-500/80 tracking-wide">
                      {paper.course_code}
                    </div>
                    <h3
                      className="text-sm font-semibold leading-snug mt-1 mb-3.5 line-clamp-2 min-h-10 text-base-content"
                      title={paper.course_name}
                    >
                      {paper.course_name}
                    </h3>

                    <div className="border-t border-base-300 pt-2.5 mb-4 text-[11px] text-base-content/60 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Dept</span>
                        <span className="text-base-content font-semibold">
                          {paper.department}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Semester</span>
                        <span className="text-base-content font-semibold">
                          {paper.semester}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Downloads</span>
                        <span className="text-base-content font-semibold font-mono">
                          {paper.downloads}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handlePreview(paper.pdf_url)}
                        className="text-xs font-semibold py-2 rounded-lg border border-base-300 text-base-content/80 hover:bg-base-200 hover:text-base-content transition-colors"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() =>
                          handleDownload(paper.paper_id, paper.pdf_url)
                        }
                        className="text-xs font-semibold py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm shadow-blue-600/20"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-base-300 pt-5 text-xs">
                <p className="text-base-content/50">
                  Showing{" "}
                  <span className="font-semibold text-base-content">
                    {(page - 1) * limit + 1}
                  </span>{" "}
                  –{" "}
                  <span className="font-semibold text-base-content">
                    {Math.min(page * limit, totalPapers)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-base-content">
                    {totalPapers}
                  </span>{" "}
                  results
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-base-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-base-200 transition-colors"
                    aria-label="Previous page"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 19.5 8.25 12l7.5-7.5"
                      />
                    </svg>
                  </button>

                  {getPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`ellipsis-${i}`}
                        className="h-8 w-8 flex items-center justify-center text-base-content/30"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                          p === page
                            ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                            : "border border-base-300 text-base-content/70 hover:bg-base-200"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={page === totalPages}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-base-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-base-200 transition-colors"
                    aria-label="Next page"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m8.25 4.5 7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;