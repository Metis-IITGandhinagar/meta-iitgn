import axios from "axios";
import toast from "react-hot-toast";
import type { Dispatch, SetStateAction } from "react";
import { api } from "@/lib/api";
import type { Paper } from "@/lib/types";

interface GetPapersParams {
  search?: string;
  department?: string;
  year?: string;
  page?: number;
  limit?: number;
}

interface PapersResponse {
  success: boolean;
  data: {
    papers: Paper[];
    total: number;
    totalPages: number;
    page: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

interface DownloadResponse {
  success: boolean;
  data: {
    downloads: number;
  };
}

export async function getPapers(params: GetPapersParams): Promise<PapersResponse> {
  const response = await api.get<PapersResponse>("/paper", {
    params: {
      ...params,
      sortby: "createdAt",
      order: "desc",
    },
  });

  return response.data;
}

export async function downloadPaper(paperId: number): Promise<DownloadResponse> {
  const response = await api.patch<DownloadResponse>(`/paper/${paperId}/download`);
  return response.data;
}

export async function uploadPaper(
  formData: FormData,
  setUploading: Dispatch<SetStateAction<boolean>>
) {
  try {
    const response = await api.post("/paper", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (response.data.success) {
      toast.success("Paper uploaded successfully!");
    }
  } catch (err: unknown) {
    console.error(err);

    if (axios.isAxiosError(err)) {
      const message =
        err.response?.data?.error?.message ?? "Something went wrong while uploading.";
      toast.error(message);
    } else {
      toast.error("Unexpected error occurred.");
    }
  } finally {
    setUploading(false);
  }
}

export async function getUserPapers(): Promise<{ success: boolean; data: { papers: Paper[] } }> {
  const response = await api.get<{ success: boolean; data: { papers: Paper[] } }>("/paper/my");
  return response.data;
}

export async function deletePaper(paperId: number): Promise<{ success: boolean; data: { message: string } }> {
  const response = await api.delete<{ success: boolean; data: { message: string } }>(`/paper/${paperId}`);
  return response.data;
}

