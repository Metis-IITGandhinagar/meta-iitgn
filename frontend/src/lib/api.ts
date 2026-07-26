import axios from 'axios';

const apiBase = process.env.NEXT_PUBLIC_API_URL !== undefined
  ? (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : '/api')
  : 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Allow cookies to be sent with requests
});
