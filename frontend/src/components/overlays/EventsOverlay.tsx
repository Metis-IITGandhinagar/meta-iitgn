"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Plus, Pencil, Trash2, Calendar, MapPin, Clock, Save } from "lucide-react";
import { apiService } from "@/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import GenericOverlayModal from "./GenericOverlayModal";

interface EventsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface EventItem {
  event_id: number;
  title: string;
  description: string;
  location: string;
  event_date: string;
  is_recurring: boolean;
  recur_day: string | null;
  recur_time: string | null;
}

export default function EventsOverlay({ isOpen, onClose, onSaved }: EventsOverlayProps) {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "moderator";

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("IIT Gandhinagar");
  const [eventDate, setEventDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurDay, setRecurDay] = useState("");
  const [recurTime, setRecurTime] = useState("");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await apiService.getEvents(100);
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      toast.error("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("IIT Gandhinagar");
    setEventDate("");
    setIsRecurring(false);
    setRecurDay("");
    setRecurTime("");
    setEditingEvent(null);
  };

  const handleOpenAddForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (ev: EventItem) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDescription(ev.description);
    setLocation(ev.location);
    // Format date string to YYYY-MM-DDTHH:MM for datetime-local input
    if (ev.event_date) {
      const d = new Date(ev.event_date);
      const pad = (n: number) => String(n).padStart(2, "0");
      const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setEventDate(formatted);
    }
    setIsRecurring(ev.is_recurring);
    setRecurDay(ev.recur_day || "");
    setRecurTime(ev.recur_time || "");
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !eventDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        description,
        location,
        event_date: new Date(eventDate).toISOString(),
        is_recurring: isRecurring,
        recur_day: isRecurring ? recurDay || null : null,
        recur_time: isRecurring ? recurTime || null : null,
      };

      if (editingEvent) {
        await apiService.updateEvent(editingEvent.event_id, payload);
        toast.success("Event updated successfully!");
      } else {
        await apiService.createEvent(payload);
        toast.success("Event created successfully!");
      }

      setIsFormOpen(false);
      resetForm();
      fetchEvents();
      if (onSaved) onSaved();
    } catch (err: any) {
      console.error("Failed to save event:", err);
      toast.error(err?.response?.data?.error?.message || "Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      await apiService.deleteEvent(eventId);
      toast.success("Event deleted successfully!");
      fetchEvents();
      if (onSaved) onSaved();
    } catch (err) {
      console.error("Failed to delete event:", err);
      toast.error("Failed to delete event.");
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <GenericOverlayModal isOpen={isOpen} onClose={onClose} title="College Events Manager" maxWidthClass="max-w-4xl">
        <div className="flex flex-col h-full min-h-[50vh] max-h-[80vh] overflow-hidden select-none font-sans">
          <div className="flex items-center justify-between shrink-0 mb-4 pb-2 border-b border-base-200">
            <div>
              <h3 className="text-lg font-black text-base-content leading-snug">Upcoming Events</h3>
              <p className="text-xs text-base-content/50 mt-0.5">Manage schedules, talks, and recurring campus events</p>
            </div>
            {isStaff && (
              <button onClick={handleOpenAddForm} className="btn btn-sm btn-primary rounded-xl gap-1.5 cursor-pointer">
                <Plus className="h-4 w-4" /> Add Event
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-base-300 rounded-3xl">
                <Calendar className="h-10 w-10 mx-auto text-base-content/30 mb-3" />
                <p className="text-sm font-bold text-base-content/60">No events found</p>
                <p className="text-xs text-base-content/40 mt-1">Add campus events to show them on the dashboard.</p>
              </div>
            ) : (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
                {events.map((ev) => (
                  <div key={ev.event_id} className="relative flex flex-col p-4 rounded-2xl border border-base-200 bg-base-100/50 hover:border-primary/30 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-2 pr-12">
                      <h4 className="text-sm font-black text-base-content truncate group-hover:text-primary transition-colors">
                        {ev.title}
                      </h4>
                      {ev.is_recurring && (
                        <span className="badge badge-xs badge-info font-bold text-[9px] uppercase px-1.5 py-1">
                          Recurring
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-base-content/60 line-clamp-2 leading-relaxed mb-3">
                      {ev.description}
                    </p>

                    <div className="mt-auto space-y-1.5 text-[11px] font-semibold text-base-content/50 border-t border-base-200/50 pt-2.5">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-primary/75" />
                        <span>{new Date(ev.event_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-secondary/75" />
                        <span>
                          {new Date(ev.event_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          {ev.is_recurring && ev.recur_day ? ` · Every ${ev.recur_day}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-success/75" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    </div>

                    {isStaff && (
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenEditForm(ev)} className="btn btn-ghost btn-xs btn-circle text-primary hover:bg-primary/10" aria-label="Edit event">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(ev.event_id)} className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10" aria-label="Delete event">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </GenericOverlayModal>

      {/* Add / Edit Event Form Modal */}
      {isFormOpen && (
        <GenericOverlayModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingEvent ? "Edit Event" : "Create Event"} maxWidthClass="max-w-lg">
          <form onSubmit={handleSave} className="space-y-4 font-sans select-none">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-base-content/75 uppercase tracking-wider">Event Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. ACM ICPC Regionals Orientation"
                className="input input-bordered w-full bg-base-100 border-base-300 focus:border-primary rounded-xl text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-base-content/75 uppercase tracking-wider">Description *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about the event..."
                className="textarea textarea-bordered w-full bg-base-100 border-base-300 focus:border-primary rounded-xl text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-base-content/75 uppercase tracking-wider">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. AB 1/102"
                  className="input input-bordered w-full bg-base-100 border-base-300 focus:border-primary rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-base-content/75 uppercase tracking-wider">Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="input input-bordered w-full bg-base-100 border-base-300 focus:border-primary rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="isRecurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="checkbox checkbox-primary checkbox-sm rounded"
              />
              <label htmlFor="isRecurring" className="text-xs font-bold text-base-content/75 uppercase tracking-wider cursor-pointer">
                Recurring weekly event?
              </label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-4 border-l-2 border-primary/30 pl-4 py-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-base-content/75 uppercase tracking-wider">Recur Day</label>
                  <select
                    value={recurDay}
                    onChange={(e) => setRecurDay(e.target.value)}
                    className="select select-bordered w-full bg-base-100 border-base-300 focus:border-primary rounded-xl text-sm"
                  >
                    <option value="">Select weekday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-base-content/75 uppercase tracking-wider">Recur Time</label>
                  <input
                    type="text"
                    value={recurTime}
                    onChange={(e) => setRecurTime(e.target.value)}
                    placeholder="e.g. 6:30 PM"
                    className="input input-bordered w-full bg-base-100 border-base-300 focus:border-primary rounded-xl text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-base-200">
              <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-ghost btn-sm rounded-xl cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-sm btn-primary rounded-xl gap-1.5 cursor-pointer">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingEvent ? "Save Changes" : "Create Event"}
              </button>
            </div>
          </form>
        </GenericOverlayModal>
      )}
    </>
  );
}
