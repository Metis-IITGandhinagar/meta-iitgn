import { Request, Response } from "express";
import { Prisma, exam_type } from "@prisma/client";
import { prisma } from "../lib/prisma.js"; // adjust path to wherever your singleton lives
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/upload.js";

// Extend Express types locally so req.user / req.file are typed.
// Move this to a shared types.d.ts if you already augment Express elsewhere.
interface AuthenticatedRequest extends Request {
    user: {
        user_id: number;
        email: string;
        name: string;
    };
    file?: Express.Multer.File;
}

// Maps the camelCase query params the frontend sends to actual Prisma columns
const SORT_FIELD_MAP: Record<string, string> = {
    courseCode: "course_code",
    courseName: "course_name",
    department: "department",
    year: "year",
    downloads: "downloads",
    createdAt: "created_at",
};

// Maps the @map display values the frontend sends (e.g. "Midsem", "Quiz-1")
// to the Prisma enum keys (e.g. exam_type.midsem, exam_type.quiz_1).
// Prisma requires the enum KEY in TypeScript — never the @map string.
const EXAM_TYPE_MAP: Record<string, exam_type> = {
    "Quiz-1":       exam_type.quiz_1,
    "Quiz-2":       exam_type.quiz_2,
    "Midsem":       exam_type.midsem,
    "Endsem":       exam_type.endsem,
    "Assignment-1": exam_type.assignment_1,
    "Assignment-2": exam_type.assignment_2,
};

/** Convert an incoming exam type string to the Prisma enum key. */
function toExamType(value: string): exam_type {
    const mapped = EXAM_TYPE_MAP[value];
    if (!mapped) {
        throw new Error(`Invalid exam_type value: "${value}"`);
    }
    return mapped;
}

export async function handlePapersGet(req: Request, res: Response) {
    try {
        const {
            search,
            department,
            year,
            examType,
            page = "1",
            limit = "10",
            sortby = "courseCode",
            order = "asc",
        } = req.query as Record<string, string>;

        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;

        const where: Prisma.papersWhereInput = {};

        if (search) {
            where.OR = [
                { course_code: { startsWith: search, mode: "insensitive" } },
                { course_name: { contains: search, mode: "insensitive" } },
            ];
        }

        if (department) {
            where.department = department;
        }

        if (year) {
            where.year = Number(year);
        }

        if (examType) {
            try {
                where.exam_type = toExamType(examType);
            } catch {
                // If an invalid examType is passed, we can ignore it or leave it unfused.
            }
        }

        const sortField = SORT_FIELD_MAP[sortby] ?? "course_code";
        const sortOrder: Prisma.SortOrder = order === "desc" ? "desc" : "asc";

        const [papers, total] = await Promise.all([
            prisma.papers.findMany({
                where,
                orderBy: { [sortField]: sortOrder },
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
            }),
            prisma.papers.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limitNum);

        return res.json({
            success: true,
            data: {
                papers,
                total,
                page: pageNum,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        });
    } catch (error) {
        console.error("Error in handlePapersGet:", error);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
        });
    }
}

export async function handlePaperGet(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const paper = await prisma.papers.findUnique({
            where: { paper_id: Number(id) },
        });

        if (!paper) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Paper not found" },
            });
        }

        return res.json({
            success: true,
            data: { paper },
        });
    } catch (error) {
        console.error("Error in handlePaperGet:", error);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
        });
    }
}

export async function handlePaperDelete(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    try {
        const paper = await prisma.papers.findFirst({
            where: {
                paper_id: Number(req.params.id),
                owner_id: authReq.user.user_id,
            },
        });

        if (!paper) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Paper not found" },
            });
        }

        // Use the shared helper which handles both Cloudinary and local fallback
        await deleteFromCloudinary(paper.cloudinary_id);

        await prisma.papers.delete({ where: { paper_id: paper.paper_id } });

        return res.json({
            success: true,
            data: { message: "Paper deleted successfully" },
        });
    } catch (error) {
        console.error("Error in handlePaperDelete:", error);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
        });
    }
}

export async function handleAdminDelete(req: Request, res: Response) {
    try {
        const paper = await prisma.papers.findUnique({
            where: { paper_id: Number(req.params.id) },
        });

        if (!paper) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Paper not found" },
            });
        }

        // Use the shared helper which handles both Cloudinary and local fallback
        await deleteFromCloudinary(paper.cloudinary_id);

        await prisma.papers.delete({ where: { paper_id: paper.paper_id } });

        return res.json({
            success: true,
            data: { message: "Paper deleted successfully" },
        });
    } catch (error) {
        console.error("Error in handleAdminDelete:", error);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
        });
    }
}

export async function handleDownloadCount(req: Request, res: Response) {
    try {
        const { id } = req.params;

        const paper = await prisma.papers.update({
            where: { paper_id: Number(id) },
            data: { downloads: { increment: 1 } },
        });

        return res.json({
            success: true,
            data: { downloads: paper.downloads },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"
        ) {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Paper not found" },
            });
        }
        console.error("Error in handleDownloadCount:", error);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
        });
    }
}

export async function handleUserPapersGet(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    try {
        const papers = await prisma.papers.findMany({
            where: { owner_id: authReq.user.user_id },
            orderBy: { created_at: "desc" },
        });

        return res.json({
            success: true,
            data: { papers },
        });
    } catch (error) {
        console.error("Error in handleUserPapersGet:", error);
        return res.status(500).json({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Internal Server Error" },
        });
    }
}

export async function handlePaperUpload(req: Request, res: Response) {
    const authReq = req as AuthenticatedRequest;
    try {
        const {
            courseCode,
            courseName,
            semester,
            year,
            department,
            examType,
        } = req.body as Record<string, string>;

        const formattedCourseCode = courseCode.trim().toUpperCase();

        // Convert the incoming display string (e.g. "Midsem") to the Prisma
        // enum key (e.g. exam_type.midsem). A raw cast would silently pass an
        // invalid value and cause a PrismaClientValidationError at runtime.
        let parsedExamType: exam_type;
        try {
            parsedExamType = toExamType(examType);
        } catch {
            return res.status(400).json({
                success: false,
                error: { code: "BAD_REQUEST", message: `Invalid exam type: "${examType}"` },
            });
        }

        const existingPaper = await prisma.papers.findFirst({
            where: {
                course_code: formattedCourseCode,
                semester: Number(semester),
                year: Number(year),
                exam_type: parsedExamType,
            },
        });

        if (existingPaper) {
            return res.status(409).json({
                success: false,
                error: { code: "CONFLICT", message: "A paper for this course, semester, year, and exam type already exists" },
            });
        }

        if (!authReq.file) {
            return res.status(400).json({
                success: false,
                error: { code: "BAD_REQUEST", message: "PDF file is required" },
            });
        }

        // uploadToCloudinary always resolves (it falls back to a local path
        // on failure/unconfigured Cloudinary) rather than returning null, so
        // there's no "upload failed" branch to check here.
        const response = await uploadToCloudinary(authReq.file.path);

        const paper = await prisma.papers.create({
            data: {
                course_code: formattedCourseCode,
                course_name: courseName.trim(),
                semester: Number(semester),
                year: Number(year),
                department,
                exam_type: parsedExamType,
                owner_id: authReq.user.user_id,
                uploaded_by: authReq.user.email,
                uploaded_by_name: authReq.user.name,
                pdf_url: response.url,
                cloudinary_id: response.publicId,
                // authReq.file.size is bytes on disk pre-upload; uploadToCloudinary
                // doesn't return a size, and it may delete the local file.
                file_size: (authReq.file.size / (1024 * 1024)).toFixed(2) + " MB",
                file_name: authReq.file.originalname,
            },
        });

        return res.status(201).json({
            success: true,
            data: { paper },
        });
    } catch (error) {
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2002"
        ) {
            return res.status(409).json({
                success: false,
                error: { code: "CONFLICT", message: "A paper for this course, semester, year, and exam type already exists" },
            });
        }
        console.error("Paper Upload Error:", error);
        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message:
                    process.env.NODE_ENV === "development"
                        ? (error as Error).message
                        : "Internal Server Error",
            },
        });
    }
}