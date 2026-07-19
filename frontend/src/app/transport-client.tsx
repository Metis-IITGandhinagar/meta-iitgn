"use client";

import { useState, useEffect } from "react";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { Edit3 } from "lucide-react";
import BottomNavbar from "@/components/navs/BottomNavbar";
import TransportView from "@/components/article/TransportView";
import TransportOverlay from "@/components/overlays/TransportOverlay";

import { db } from "@/lib/db";

export default function TransportClient({ defaultEditing }: { defaultEditing?: boolean }) {
  const { user } = useAuth();
  const [buses, setBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(defaultEditing || false);

  const fetchTransport = async () => {
    try {
      // 1. Try loading from IndexedDB first for instant render
      const cached = await db.transport.get("campus-transport");
      if (cached && Array.isArray(cached.content)) {
        const items = cached.content.map((item: any) => ({
          name: item.route,
          type: item.type,
          trips: item.schedule || []
        }));
        setBuses(items);
        setLoading(false);
      }

      // 2. Fetch fresh data from network
      const res = await apiService.getCampusTransport();
      const items = res.data?.map((item: any) => ({
        name: item.route,
        type: item.type,
        trips: item.schedule || []
      })) || [];
      setBuses(items);

      // Save to cache
      await db.transport.put({ content: res.data, id: "campus-transport" });
    } catch (err) {
      console.error("Failed to fetch campus transport:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransport();
  }, []);

  const isStaff = user?.role === "admin" || user?.role === "moderator";

  return (
    <>
      <div className="flex flex-1 h-full mt-2 w-full min-w-full lg:min-w-0 overflow-hidden order-1">
        <main className="flex-1 min-w-full lg:min-w-0 px-4 md:px-8 pt-20 pb-28 overflow-y-auto bg-base-100 relative scroll-smooth text-base-content font-sans">
          <article className="w-full max-w-5xl mx-auto space-y-6">
            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-base-content mb-8">
              Campus Transport Timetable
            </h1>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <span className="loading loading-spinner loading-lg text-info"></span>
              </div>
            ) : (
              <TransportView buses={buses} />
            )}
          </article>

          <BottomNavbar
            tabs={[
              isStaff && {
                id: "edit",
                label: "Edit Timetable",
                icon: Edit3,
                onClick: () => setShowEditor(true),
              },
            ].filter(Boolean) as any}
            className="fixed bottom-6 transform -translate-x-1/2 z-[9999] left-1/2"
          />
        </main>
      </div>

      <TransportOverlay
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        transport={buses}
        onSaved={fetchTransport}
      />
    </>
  );
}
