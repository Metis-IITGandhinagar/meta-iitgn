import { api } from '../lib/api';

export const getEvents = async (limit = 20) => {
  const response = await api.get('/collegeinfo/events', { params: { limit } });
  return response.data;
};

export const getMessMenu = async () => {
  const response = await api.get('/collegeinfo/mess-menu');
  return response.data;
};

export const getCampusTransport = async () => {
  const response = await api.get('/collegeinfo/campus-transport');
  return response.data;
};
