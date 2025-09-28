import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
   DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Clock, Users } from "lucide-react";
import { api } from "@/services/api";
import type { EventSummary } from "@/services/api";
import { ApiError } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { logout } from "@/lib/auth";

const Calendar = () => {
   const navigate = useNavigate();
   const [selectedDate, setSelectedDate] = useState(new Date().getDate());
   const [viewMode, setViewMode] = useState<"week" | "month">("week");
   const [events, setEvents] = useState<EventSummary[]>([]);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
   const timeSlots = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);

   const [newEvent, setNewEvent] = useState({
      title: "",
      description: "",
      date: "",
      time: "",
      assignTo: "",
   });

   useEffect(() => {
      const controller = new AbortController();

      const loadEvents = async () => {
         try {
            setLoading(true);
            setError(null);
            const response = await api.events.list({ signal: controller.signal });
            setEvents(response.events);
         } catch (err) {
            if (controller.signal.aborted) return;
            console.error("Failed to load events", err);
            if (err instanceof ApiError && err.status === 401) {
               logout();
               navigate("/login");
            } else {
               setError(
                  err instanceof ApiError
                     ? err.message || "Failed to load events"
                     : "Failed to load events"
               );
            }
         } finally {
            if (!controller.signal.aborted) {
               setLoading(false);
            }
         }
      };

      loadEvents();

      return () => controller.abort();
   }, [navigate]);

   const handleCreateEvent = async () => {
      if (!newEvent.title || !newEvent.date || !newEvent.time) {
         setError("Title, date and time are required");
         return;
      }

      const start = new Date(`${newEvent.date}T${newEvent.time}`);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      try {
         setLoading(true);
         setError(null);
         const response = await api.events.create(
            {
               title: newEvent.title,
               description: newEvent.description,
               start_time: start.toISOString(),
               end_time: end.toISOString(),
               assigned_to_user_id: null,
            },
            {}
         );
         setEvents(response.events);
         setNewEvent({ title: "", description: "", date: "", time: "", assignTo: "" });
      } catch (err) {
         console.error("Failed to create event", err);
         if (err instanceof ApiError && err.status === 401) {
            logout();
            navigate("/login");
         } else {
            setError(
               err instanceof ApiError
                  ? err.message || "Failed to create event"
                  : "Failed to create event"
            );
         }
      } finally {
         setLoading(false);
      }
   };

   const weeklyEvents = useMemo(() => {
      const map = new Map<number, EventSummary[]>();
      events.forEach((event) => {
         const date = new Date(event.start_time);
         const dayIndex = (date.getDay() + 6) % 7;
         const list = map.get(dayIndex) ?? [];
         list.push(event);
         map.set(dayIndex, list);
      });
      return map;
   }, [events]);

   return (
      <AppLayout>
         <div className="flex h-full min-h-0 flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
               <div className="flex flex-wrap items-center gap-3">
                  <div className="flex rounded-lg bg-muted p-1">
                     <button
                        className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === "week"
                           ? "bg-background shadow-sm"
                           : "hover:bg-background/50"
                           }`}
                        onClick={() => setViewMode("week")}
                     >
                        Week
                     </button>
                     <button
                        className={`px-3 py-1 rounded text-sm transition-colors ${viewMode === "month"
                           ? "bg-background shadow-sm"
                           : "hover:bg-background/50"
                           }`}
                        onClick={() => setViewMode("month")}
                     >
                        Month
                     </button>
                  </div>
                  <Dialog>
                     <DialogTrigger asChild>
                        <Button className="bg-primary hover:bg-primary/90">
                           <Plus className="w-4 h-4 mr-2" />
                           New Event
                        </Button>
                     </DialogTrigger>
                     <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                           <DialogTitle>Create New Event</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                           <Input
                              placeholder="Event title"
                              value={newEvent.title}
                              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                           />
                           <Textarea
                              placeholder="Description"
                              value={newEvent.description}
                              onChange={(e) =>
                                 setNewEvent({ ...newEvent, description: e.target.value })
                              }
                           />
                           <div className="grid grid-cols-2 gap-4">
                              <Input
                                 type="date"
                                 value={newEvent.date}
                                 onChange={(e) =>
                                    setNewEvent({ ...newEvent, date: e.target.value })
                                 }
                              />
                              <Input
                                 type="time"
                                 value={newEvent.time}
                                 onChange={(e) =>
                                    setNewEvent({ ...newEvent, time: e.target.value })
                                 }
                              />
                           </div>
                           <Input
                              placeholder="Assign to user or team"
                              value={newEvent.assignTo}
                              onChange={(e) =>
                                 setNewEvent({ ...newEvent, assignTo: e.target.value })
                              }
                           />
                           <Button
                              onClick={handleCreateEvent}
                              className="w-full bg-primary hover:bg-primary/90"
                           >
                              Create Event
                           </Button>
                        </div>
                     </DialogContent>
                  </Dialog>
               </div>
            </div>

            {/* Calendar Grid */}
            <Card className="flex flex-1 flex-col overflow-hidden shadow-card">
               <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                     <CalendarIcon className="w-5 h-5 text-primary" />
                     {viewMode === "week" ? "Week View" : "Month View"}
                  </CardTitle>
               </CardHeader>
               <CardContent className="flex-1 overflow-x-auto pr-14">
                  <div className="min-w-[960px]">
                     {viewMode === "week" ? (
                        <div className="grid grid-cols-8 gap-2">
                           {/* Time column */}
                           <div className="grid space-y-12 place-items-center">
                              <div className="h-5" />
                              {timeSlots.map((time) => (
                                 <div
                                    key={time}
                                    className="h-12 text-xs text-muted-foreground"
                                 >
                                    {time}
                                 </div>
                              ))}
                           </div>

                           {/* Day columns */}
                           {weekDays.map((day, dayIndex) => (
                              <div
                                 key={day}
                                 className="space-y-1"
                              >
                                 <div className="h-8 pb-12 text-center">
                                    <div className="text-sm font-medium text-foreground">{day}</div>
                                    <div
                                       className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs ${dayIndex === 2
                                          ? "bg-primary text-primary-foreground"
                                          : "text-muted-foreground"
                                          }`}
                                    >
                                       {18 + dayIndex}
                                    </div>
                                 </div>

                                 {/* Events for this day */}
                                 <div className="space-y-12">
                                    {timeSlots.map((time, timeIndex) => {
                                       const currentHour = 8 + timeIndex;
                                       const eventsForDay = weeklyEvents.get(dayIndex) ?? [];
                                       const matchingEvents = eventsForDay.filter((event) => {
                                          const eventStart = new Date(event.start_time);
                                          return eventStart.getHours() === currentHour;
                                       });

                                       return (
                                          <div
                                             key={time}
                                             className="relative h-12 rounded border border-border"
                                          >
                                             {matchingEvents.map((event) => (
                                                <div
                                                   key={event.event_id}
                                                   className="absolute inset-x-1 top-1 rounded bg-primary p-1 text-xs text-primary-foreground"
                                                >
                                                   <div className="font-medium">{event.title}</div>
                                                   <div className="text-[10px] opacity-80">
                                                      {new Date(
                                                         event.start_time
                                                      ).toLocaleTimeString([], {
                                                         hour: "2-digit",
                                                         minute: "2-digit",
                                                      })}
                                                   </div>
                                                </div>
                                             ))}
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="grid grid-cols-7 gap-1">
                           {/* Month view - simplified */}
                           {weekDays.map((day) => (
                              <div
                                 key={day}
                                 className="border-b p-2 text-center font-medium text-foreground"
                              >
                                 {day}
                              </div>
                           ))}
                           {Array.from({ length: 35 }, (_, i) => (
                              <div
                                 key={i}
                                 className="h-24 cursor-pointer border border-border p-1 hover:bg-muted/50"
                              >
                                 <div className="text-sm text-foreground">{(i % 31) + 1}</div>
                                 {i === 18 && (
                                    <div className="mt-1 rounded bg-primary px-1 text-xs text-primary-foreground">
                                       Standup
                                    </div>
                                 )}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </div>
      </AppLayout>
   );
};

export default Calendar;
