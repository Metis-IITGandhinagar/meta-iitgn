"use client";

import React, { createContext, useContext, useState } from "react";

export interface ProfileData {
  user: any;
  stats: any;
  readme: string | null;
  activity: any[];
  bookmarks: any[];
}

interface ProfileContextType {
  profileCache: Record<number | string, ProfileData>;
  setProfileData: (userId: number | string, data: ProfileData) => void;
  clearProfileCache: () => void;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profileCache, setProfileCache] = useState<Record<number | string, ProfileData>>({});

  const setProfileData = (userId: number | string, data: ProfileData) => {
    setProfileCache((prev) => ({
      ...prev,
      [userId]: data,
    }));
  };

  const clearProfileCache = () => {
    setProfileCache({});
  };

  return (
    <ProfileContext.Provider value={{ profileCache, setProfileData, clearProfileCache }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
