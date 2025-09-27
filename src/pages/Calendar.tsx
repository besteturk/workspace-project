import { useState } from "react";
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

const Calendar = () => {
   const [selectedDate, setSelectedDate] = useState(new Date().getDate());
   const [viewMode, setViewMode] = useState<"week" | "month">("week");

   const events = [
      {
         id: 1,
         title: "Team Standup",
         time: "09:00",
         duration: 30,
         type: "assigned",
         color: "bg-primary",
      },
      {
         id: 2,
         title: "Design Review",
         time: "14:00",
         duration: 60,
         type: "default",
         color: "bg-secondary",
      },
      {
         id: 3,
         title: "Project Planning",
         time: "16:00",
         duration: 90,
         type: "highlighted",
         color: "bg-accent",
      },
   ];

   const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
   const timeSlots = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);

   const [newEvent, setNewEvent] = useState({
      title: "",
      description: "",
      date: "",
      time: "",
      assignTo: "",
   });

   const handleCreateEvent = () => {
      console.log("Creating event:", newEvent);
      setNewEvent({ title: "", description: "", date: "", time: "", assignTo: "" });
   };

   return (
      <AppLayout>
         <div className="flex h-full min-h-0 flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
               <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
               <div className="flex flex-wrap items-center gap-3">
                  <div className="flex rounded-lg bg-muted p-1">
                     <button
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                           viewMode === "week"
                              ? "bg-background shadow-sm"
                              : "hover:bg-background/50"
                        }`}
                        onClick={() => setViewMode("week")}
                     >
                        Week
                     </button>
                     <button
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                           viewMode === "month"
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
               <CardContent className="flex-1 overflow-x-auto">
                  <div className="min-w-[960px]">
                     {viewMode === "week" ? (
                        <div className="grid grid-cols-8 gap-2">
                           {/* Time column */}
                           <div className="space-y-12 pl-4">
                              <div className="h-5" />
                              {timeSlots.map((time) => (
                                 <div
                                    key={time}
                                    className="ml-4 h-12 text-xs text-muted-foreground"
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
                                       className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                                          dayIndex === 2
                                             ? "bg-primary text-primary-foreground"
                                             : "text-muted-foreground"
                                       }`}
                                    >
                                       {18 + dayIndex}
                                    </div>
                                 </div>

                                 {/* Events for this day */}
                                 <div className="space-y-12">
                                    {timeSlots.map((time, timeIndex) => (
                                       <div
                                          key={time}
                                          className="relative h-12 rounded border border-border"
                                       >
                                          {dayIndex === 2 && timeIndex === 1 && (
                                             <div className="absolute inset-x-1 top-1 rounded bg-primary p-1 text-xs text-primary-foreground">
                                                Team Standup
                                             </div>
                                          )}
                                          {dayIndex === 2 && timeIndex === 6 && (
                                             <div className="absolute inset-x-1 top-1 rounded bg-secondary p-1 text-xs text-secondary-foreground">
                                                Design Review
                                             </div>
                                          )}
                                          {dayIndex === 4 && timeIndex === 8 && (
                                             <div className="absolute inset-x-1 top-1 rounded bg-accent p-1 text-xs text-accent-foreground">
                                                Project Planning
                                             </div>
                                          )}
                                       </div>
                                    ))}
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
