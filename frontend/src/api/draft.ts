import { api } from '../lib/api';

export interface DraftSubmitInput {
  page_id?: number | null;
  title: string;
  content: string;
  metadata?: any;
  video_url?: string | null;
  editor_id: number;
  base_version?: number | null;
}

export interface ReviewDraftInput {
  reviewer_id: number;
  action: 'approve' | 'reject';
  rejection_reason?: string | null;
}

export const submitDraft = async (data: DraftSubmitInput) => {
  const response = await api.post('/drafts', data);
  return response.data;
};

export const getPendingDrafts = async (pageId?: number, limit = 4, page = 1) => {
  const response = await api.get('/drafts/pending', { params: { page_id: pageId, limit, page } });
  return response.data;
};

export const reviewDraft = async (pendingId: number, data: ReviewDraftInput) => {
  const response = await api.post(`/drafts/${pendingId}/review`, data);
  return response.data;
};
