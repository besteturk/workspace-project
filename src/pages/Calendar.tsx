import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, Clock, Users } from "lucide-react";

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const events = [
    { id: 1, title: "Team Standup", time: "09:00", duration: 30, type: "meeting", color: "bg-primary" },
    { id: 2, title: "Design Review", time: "14:00", duration: 60, type: "review", color: "bg-secondary" },
    { id: 3, title: "Project Planning", time: "16:00", duration: 90, type: "planning", color: "bg-accent" },
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Calendar</h1>
          <div className="flex items-center gap-4">
            <div className="flex bg-muted rounded-lg p-1">
              <button
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "week" ? "bg-background shadow-sm" : "hover:bg-background/50"
                }`}
                onClick={() => setViewMode("week")}
              >
                Week
              </button>
              <button
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === "month" ? "bg-background shadow-sm" : "hover:bg-background/50"
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
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                    <Input
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                  <Input
                    placeholder="Assign to user or team"
                    value={newEvent.assignTo}
                    onChange={(e) => setNewEvent({ ...newEvent, assignTo: e.target.value })}
                  />
                  <Button onClick={handleCreateEvent} className="w-full bg-primary hover:bg-primary/90">
                    Create Event
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {viewMode === "week" ? "Week View" : "Month View"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {viewMode === "week" ? (
              <div className="grid grid-cols-8 gap-1">
                {/* Time column */}
                <div className="space-y-12">
                  <div className="h-8"></div>
                  {timeSlots.map((time) => (
                    <div key={time} className="h-12 text-xs text-muted-foreground">
                      {time}
                    </div>
                  ))}
                </div>
                
                {/* Day columns */}
                {weekDays.map((day, dayIndex) => (
                  <div key={day} className="space-y-1">
                    <div className="h-8 text-center">
                      <div className="text-sm font-medium text-foreground">{day}</div>
                      <div className={`text-xs rounded-full w-6 h-6 mx-auto flex items-center justify-center ${
                        dayIndex === 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}>
                        {18 + dayIndex}
                      </div>
                    </div>
                    
                    {/* Events for this day */}
                    <div className="space-y-12">
                      {timeSlots.map((time, timeIndex) => (
                        <div key={time} className="h-12 border border-border rounded relative">
                          {dayIndex === 2 && timeIndex === 1 && (
                            <div className="absolute inset-x-1 top-1 bg-primary text-primary-foreground rounded text-xs p-1">
                              Team Standup
                            </div>
                          )}
                          {dayIndex === 2 && timeIndex === 6 && (
                            <div className="absolute inset-x-1 top-1 bg-secondary text-secondary-foreground rounded text-xs p-1">
                              Design Review
                            </div>
                          )}
                          {dayIndex === 4 && timeIndex === 8 && (
                            <div className="absolute inset-x-1 top-1 bg-accent text-accent-foreground rounded text-xs p-1">
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
                  <div key={day} className="p-2 text-center font-medium text-foreground border-b">
                    {day}
                  </div>
                ))}
                {Array.from({ length: 35 }, (_, i) => (
                  <div key={i} className="h-24 p-1 border border-border hover:bg-muted/50 cursor-pointer">
                    <div className="text-sm text-foreground">{((i % 31) + 1)}</div>
                    {i === 18 && (
                      <div className="text-xs bg-primary text-primary-foreground rounded px-1 mt-1">
                        Standup
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Today's Events
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${event.color}`}></div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.time} • {event.duration} min
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {event.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Team Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium text-foreground">Alice Johnson</span>
                  <Badge className="bg-success text-success-foreground">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium text-foreground">Bob Smith</span>
                  <Badge className="bg-destructive text-destructive-foreground">In Meeting</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium text-foreground">Carol Davis</span>
                  <Badge className="bg-success text-success-foreground">Available</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="font-medium text-foreground">David Wilson</span>
                  <Badge variant="outline">Away</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Calendar;