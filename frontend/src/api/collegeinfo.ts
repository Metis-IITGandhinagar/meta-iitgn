import { api } from '../lib/api';

export const getEvents = async (limit = 20) => {
  const response = await api.get('/collegeinfo/events', { params: { limit } });
  return response.data;
};

export const createEvent = async (data: any) => {
  const response = await api.post('/collegeinfo/events', data, { withCredentials: true });
  return response.data;
};

export const updateEvent = async (eventId: number, data: any) => {
  const response = await api.put(`/collegeinfo/events/${eventId}`, data, { withCredentials: true });
  return response.data;
};

export const deleteEvent = async (eventId: number) => {
  const response = await api.delete(`/collegeinfo/events/${eventId}`, { withCredentials: true });
  return response.data;
};

export const getMessMenu = async () => {
  const response = await api.get('/collegeinfo/mess-menu');
  return response.data;
};

export const updateMessMenu = async (days: any[]) => {
  const response = await api.put('/collegeinfo/mess-menu', { days }, { withCredentials: true });
  return response.data;
};

export const getCampusTransport = async () => {
  const response = await api.get('/collegeinfo/campus-transport');
  return response.data;
};

export const updateCampusTransport = async (buses: any[]) => {
  const response = await api.put('/collegeinfo/campus-transport', { buses }, { withCredentials: true });
  return response.data;
};
