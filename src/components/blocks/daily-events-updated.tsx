"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Clock, ChevronRight, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Event {
  id: string;
  title: string;
  date: Date;
  type: "reminder" | "todo" | "calendar";
  description?: string;
}

// Current date for demo purposes
const currentDate = new Date(2023, 5, 15, 12, 0);

const allEvents: Event[] = [
  {
    id: "1",
    title: "Team Meeting",
    date: new Date(2023, 5, 15, 14, 0),
    type: "calendar",
    description: "Discuss project progress and next steps",
  },
  {
    id: "2",
    title: "Buy groceries",
    date: new Date(2023, 5, 15, 16, 0),
    type: "todo",
  },
  {
    id: "3",
    title: "Dentist Appointment",
    date: new Date(2023, 5, 15, 17, 30),
    type: "calendar",
    description: "Regular checkup",
  },
  {
    id: "4",
    title: "Call Mom",
    date: new Date(2023, 5, 15, 19, 0),
    type: "reminder",
  },
  {
    id: "5",
    title: "Gym Session",
    date: new Date(2023, 5, 15, 20, 0),
    type: "calendar",
    description: "Leg day",
  },
  {
    id: "6",
    title: "Submit Report",
    date: new Date(2023, 5, 14, 17, 0),
    type: "todo",
    description: "Finish and submit quarterly report",
  },
  {
    id: "7",
    title: "Pay Bills",
    date: new Date(2023, 5, 13, 10, 0),
    type: "reminder",
    description: "Pay electricity and water bills",
  },
  {
    id: "8",
    title: "Book Flight",
    date: new Date(2023, 5, 12, 9, 0),
    type: "todo",
    description: "Book flight for next month's conference",
  },
];

const suggestedTask: Event = {
  id: "suggested",
  title: "Review Project Proposal",
  date: new Date(2023, 5, 15, 15, 0),
  type: "todo",
  description:
    "Go through the project proposal and prepare feedback for the team meeting",
};

function getOverdueStatus(date: Date): string {
  const diffInHours =
    (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60);
  if (diffInHours < 24) return "text-yellow-600 bg-yellow-50";
  if (diffInHours < 48) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

export function DailyEventsUpdated() {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [completedEvents, setCompletedEvents] = useState<string[]>([]);
  const [overdueVisible, setOverdueVisible] = useState(true);

  const toggleExpand = (id: string) => {
    setExpandedEvent(expandedEvent === id ? null : id);
  };

  const completeEvent = (id: string) => {
    setCompletedEvents([...completedEvents, id]);
  };

  const snoozeEvent = (id: string) => {
    console.log(`Snoozed event ${id}`);
  };

  const todayEvents = allEvents
    .filter((event) => event.date >= currentDate)
    .slice(0, 4);
  const overdueEvents = allEvents
    .filter((event) => event.date < currentDate)
    .slice(0, 3);

  return (
    <div className="relative h-[1280px] w-[720px] overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 p-6 font-sans">
      <h1 className="mb-6 text-3xl font-semibold text-gray-800">
        Today's Events
      </h1>

      {/* Featured Suggested Task */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center text-lg font-semibold text-blue-800">
            <Star className="mr-2 h-5 w-5 text-blue-500" />
            Suggested Task
          </h2>
          <span className="text-sm text-blue-600">
            {suggestedTask.date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <p className="mb-2 text-blue-700">{suggestedTask.title}</p>
        <p className="text-sm text-blue-600">{suggestedTask.description}</p>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => completeEvent(suggestedTask.id)}
            className="flex items-center justify-center rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors duration-300 hover:bg-blue-200"
          >
            <Check className="mr-1 h-4 w-4" />
            Complete
          </button>
          <button
            onClick={() => snoozeEvent(suggestedTask.id)}
            className="flex items-center justify-center rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700 transition-colors duration-300 hover:bg-blue-200"
          >
            <Clock className="mr-1 h-4 w-4" />
            Snooze
          </button>
        </div>
      </div>

      {/* Today's Events */}
      <div className="mb-6 space-y-4">
        {todayEvents.map((event) => (
          <div
            key={event.id}
            className={`overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out ${
              expandedEvent === event.id ? "h-32" : "h-16"
            } ${completedEvents.includes(event.id) ? "opacity-50" : ""}`}
          >
            <div
              className="flex h-16 cursor-pointer items-center justify-between px-4"
              onClick={() => toggleExpand(event.id)}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`h-2 w-2 rounded-full ${
                    event.type === "reminder"
                      ? "bg-blue-400"
                      : event.type === "todo"
                        ? "bg-green-400"
                        : "bg-purple-400"
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">
                  {event.date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-base text-gray-900">{event.title}</span>
              </div>
              <ChevronRight
                className={`h-5 w-5 text-gray-400 transition-transform duration-300 ${
                  expandedEvent === event.id ? "rotate-90 transform" : ""
                }`}
              />
            </div>
            {expandedEvent === event.id && (
              <div className="px-4 pb-4">
                <p className="mb-2 text-sm text-gray-600">
                  {event.description || "No additional details"}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => completeEvent(event.id)}
                    className="flex items-center justify-center rounded-md bg-green-50 px-3 py-1 text-sm text-green-700 transition-colors duration-300 hover:bg-green-100"
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Complete
                  </button>
                  <button
                    onClick={() => snoozeEvent(event.id)}
                    className="flex items-center justify-center rounded-md bg-blue-50 px-3 py-1 text-sm text-blue-700 transition-colors duration-300 hover:bg-blue-100"
                  >
                    <Clock className="mr-1 h-4 w-4" />
                    Snooze
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overdue Events */}
      <AnimatePresence>
        {overdueVisible && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-6 right-6 z-50"
          >
            <div className="space-y-4 rounded-lg bg-white p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Overdue Tasks
                </h2>
                <button
                  onClick={() => setOverdueVisible(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {overdueEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`${getOverdueStatus(event.date)} rounded-lg p-4 ${
                    index === 0 ? "" : "mt-2"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{event.title}</span>
                    <span className="text-sm">
                      {event.date.toLocaleDateString()}{" "}
                      {event.date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm">
                    {event.description || "No additional details"}
                  </p>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => completeEvent(event.id)}
                      className="flex items-center justify-center rounded-md bg-white bg-opacity-50 px-3 py-1 text-sm transition-colors duration-300 hover:bg-opacity-75"
                    >
                      <Check className="mr-1 h-4 w-4" />
                      Complete
                    </button>
                    <button
                      onClick={() => snoozeEvent(event.id)}
                      className="flex items-center justify-center rounded-md bg-white bg-opacity-50 px-3 py-1 text-sm transition-colors duration-300 hover:bg-opacity-75"
                    >
                      <Clock className="mr-1 h-4 w-4" />
                      Snooze
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
