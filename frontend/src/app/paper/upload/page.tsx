"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { apiService } from "@/api";
import {
  type UploadFormData,
  departments,
  years,
  semesters,
  examTypes,
} from "@/lib/types";
import { courseMasterList } from "@/lib/data";

const fieldClasses =
  "w-full px-3 py-2.5 rounded-lg border border-base-300 bg-transparent font-medium text-base-content placeholder-base-content/40 focus:outline-none focus:border-blue-500/60 focus:ring-4 focus:ring-blue-500/10 text-sm transition-all";

const labelClasses =
  "block text-[11px] font-bold uppercase tracking-wider text-base-content/50 mb-1.5";

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="text-red-400 text-[11px] mt-1.5 font-semibold flex items-center gap-1">
      <svg
        className="h-3 w-3 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
      {message}
    </p>
  ) : null;

const Upload = () => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadFormData>({
    defaultValues: {
      semester: "1",
      examType: "Midsem",
      department: "CS",
      year: new Date().getFullYear().toString(),
    },
  });

  const selectedFile = watch("paper");
  const watchedCourseCode = watch("courseCode");

  const { onChange: onFileChange, ...fileField } = register("paper", {
    required: "PDF file is required",
    validate: {
      isPdf: (files) =>
        files[0]?.type === "application/pdf" || "Only PDF files are allowed",
      lessThan10MB: (files) =>
        files[0]?.size <= 10 * 1024 * 1024 || "Compress the file first",
    },
  });

  useEffect(() => {
    const formattedCode = (watchedCourseCode || "").trim().toUpperCase();
    if (formattedCode && courseMasterList[formattedCode]) {
      setValue("courseName", courseMasterList[formattedCode].title);
    } else {
      setValue("courseName", "");
    }
  }, [watchedCourseCode, setValue]);

  const courseLookedUp =
    !!watchedCourseCode &&
    !!courseMasterList[watchedCourseCode.trim().toUpperCase()];

  const sortedCourseCodes = Object.keys(courseMasterList).sort();

  const onSubmit = async (data: UploadFormData) => {
    setUploading(true);
    const formattedCode = data.courseCode.trim().toUpperCase();
    const lookedUpName = courseMasterList[formattedCode]?.title || "";

    const formData = new FormData();
    formData.append("courseCode", formattedCode);
    formData.append("courseName", lookedUpName);
    formData.append("semester", data.semester);
    formData.append("year", data.year);
    formData.append("department", data.department);
    formData.append("examType", data.examType);
    formData.append("paper", data.paper[0]);

    await apiService.uploadPaper(formData, setUploading);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const dt = new DataTransfer();
      dt.items.add(files[0]);
      const input = document.getElementById(
        "paper-upload-input"
      ) as HTMLInputElement;
      if (input) {
        input.files = dt.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto h-full w-full bg-transparent text-primary font-sans py-12 px-6 mt-16">
      <div className="max-w-3xl mx-auto mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-base-content/60 hover:text-base-content transition-colors"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to Vault
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="mb-7">
          <h2 className="text-2xl font-extrabold text-primary tracking-tight">
            Upload Exam Paper
          </h2>
          <p className="text-sm text-base-content/50 mt-1.5">
            Provide exam metadata below. Make sure the PDF file is readable
            and the correct course is selected.
          </p>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300 text-primary font-sans p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Course identification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Course Code *</label>
                <div className="relative">
                  <input
                    list="course-suggestions"
                    placeholder="Type code (e.g. CS330)..."
                    {...register("courseCode", {
                      required: "Course Code is required",
                      validate: (value) => {
                        const code = (value || "").trim().toUpperCase();
                        return (
                          !!courseMasterList[code] ||
                          "Please select a valid course from the suggestion list"
                        );
                      },
                    })}
                    className={`${fieldClasses} font-mono uppercase pr-8`}
                  />
                  {courseLookedUp && (
                    <svg
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m4.5 12.75 6 6 9-13.5"
                      />
                    </svg>
                  )}
                </div>

                <datalist id="course-suggestions">
                  {sortedCourseCodes.map((code) => (
                    <option key={code} value={code}>
                      {code} - {courseMasterList[code].title}
                    </option>
                  ))}
                </datalist>

                <FieldError message={errors.courseCode?.message} />
              </div>

              <div>
                <label className={labelClasses}>
                  Course Name (Auto-Lookup)
                </label>
                <input
                  type="text"
                  readOnly
                  placeholder="Suggested automatically"
                  {...register("courseName", {
                    required: "Course Name is required",
                  })}
                  className={`${fieldClasses} bg-base-200/40 cursor-not-allowed`}
                />
                <FieldError message={errors.courseName?.message} />
              </div>
            </div>

            <div className="border-t border-base-300" />

            {/* Classification */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Department</label>
                <select
                  {...register("department", {
                    required: "Department is required",
                  })}
                  className={`${fieldClasses} cursor-pointer`}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.department?.message} />
              </div>

              <div>
                <label className={labelClasses}>Semester</label>
                <select
                  {...register("semester", {
                    required: "Semester is required",
                  })}
                  className={`${fieldClasses} cursor-pointer`}
                >
                  {semesters.map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.semester?.message} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>Exam Type</label>
                <select
                  {...register("examType", {
                    required: "Exam type is required",
                  })}
                  className={`${fieldClasses} cursor-pointer`}
                >
                  {examTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.examType?.message} />
              </div>

              <div>
                <label className={labelClasses}>Year</label>
                <select
                  {...register("year", { required: "Year is required" })}
                  className={`${fieldClasses} cursor-pointer`}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.year?.message} />
              </div>
            </div>

            <div className="border-t border-base-300" />

            {/* File upload */}
            <div>
              <label className={labelClasses}>
                Upload Paper (PDF only, max 10MB)
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-7 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-blue-500 bg-blue-500/5"
                    : selectedFile && selectedFile.length > 0
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-base-300 hover:border-blue-500/40 hover:bg-blue-500/3"
                }`}
              >
                <input
                  id="paper-upload-input"
                  type="file"
                  accept="application/pdf"
                  onChange={onFileChange}
                  {...fileField}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {selectedFile && selectedFile.length > 0 ? (
                  <>
                    <svg
                      className="mx-auto h-8 w-8 text-emerald-500 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-sm font-semibold text-base-content">
                      {selectedFile[0].name}
                    </p>
                    <p className="text-[11px] text-base-content/50 mt-1">
                      {(selectedFile[0].size / (1024 * 1024)).toFixed(2)} MB
                      &middot; click or drop to replace
                    </p>
                  </>
                ) : (
                  <>
                    <svg
                      className="mx-auto h-8 w-8 text-base-content/35 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <p className="text-sm font-semibold text-base-content/70">
                      Select a PDF paper
                    </p>
                    <p className="text-[11px] text-base-content/40 mt-1">
                      Click to browse or drop the file here
                    </p>
                  </>
                )}
              </div>
              <FieldError message={errors.paper?.message as string} />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg text-sm transition-all shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
            >
              {uploading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading...
                </>
              ) : (
                "Upload Paper"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Upload;