"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

const fadingBorderStyle = `
  relative before:absolute before:inset-0 before:border before:border-gray-700 before:rounded-lg
  before:bg-gradient-to-b before:from-gray-700 before:to-transparent before:opacity-50
  before:pointer-events-none
`;

export function PricingPageComponent() {
  const [logEntries, setLogEntries] = useState(1000000);
  const [isApplicationLogs, setIsApplicationLogs] = useState(true);

  const calculatePrice = (entries: number) => {
    return Math.round(entries / 10000);
  };

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex justify-center space-x-4">
          <Switch
            checked={isApplicationLogs}
            onCheckedChange={() => setIsApplicationLogs(true)}
          />
          <span className={isApplicationLogs ? "font-bold" : ""}>
            Application Logs
          </span>
          <Switch
            checked={!isApplicationLogs}
            onCheckedChange={() => setIsApplicationLogs(false)}
          />
          <span className={!isApplicationLogs ? "font-bold" : ""}>
            Infrastructure Logs
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Free Tier */}
          <div className={`flex flex-col p-6 ${fadingBorderStyle}`}>
            <h2 className="mb-4 text-2xl font-bold">Free</h2>
            <div className="mb-6 text-4xl font-bold">$0 / mo</div>
            <div className="mb-6">
              <div>Up to 50,000 log entries / mo</div>
              <div className="text-sm text-gray-400">
                1,000 log entries / day
              </div>
            </div>
            <div className="flex-grow space-y-2">
              <Feature included>Basic Log Search</Feature>
              <Feature included>1 Team Member</Feature>
              <Feature included>1-day Log Retention</Feature>
              <Feature included>Email Alerts</Feature>
              <Feature>Advanced Analytics</Feature>
              <Feature>Custom Dashboards</Feature>
              <Feature>24/7 Support</Feature>
            </div>
            <Button className="mt-6 w-full">Get started</Button>
          </div>

          {/* Pro Tier */}
          <div className={`flex flex-col p-6 ${fadingBorderStyle}`}>
            <h2 className="mb-4 text-2xl font-bold">Pro</h2>
            <div className="mb-6 text-4xl font-bold">
              ${calculatePrice(logEntries)} / mo
            </div>
            <div className="mb-6">
              <Slider
                min={100000}
                max={5000000}
                step={100000}
                value={[logEntries]}
                onValueChange={(value) => value[0] && setLogEntries(value[0])}
              />
              <div>{logEntries.toLocaleString()} log entries / mo</div>
              <div className="text-sm text-gray-400">
                No daily sending limit
              </div>
            </div>
            <div className="flex-grow space-y-2">
              <Feature included>Advanced Log Search</Feature>
              <Feature included>Unlimited Team Members</Feature>
              <Feature included>30-day Log Retention</Feature>
              <Feature included>Email & Slack Alerts</Feature>
              <Feature included>Advanced Analytics</Feature>
              <Feature included>Custom Dashboards</Feature>
              <Feature>24/7 Support</Feature>
            </div>
            <Button className="mt-6 w-full">Get started</Button>
          </div>

          {/* Enterprise Tier */}
          <div className={`flex flex-col p-6 ${fadingBorderStyle}`}>
            <h2 className="mb-4 text-2xl font-bold">Enterprise</h2>
            <div className="mb-6 text-4xl font-bold">Custom</div>
            <div className="mb-6">
              <div>A plan based on your specific needs</div>
              <div className="text-sm text-gray-400">No log entry limits</div>
            </div>
            <div className="flex-grow space-y-2">
              <Feature included>Advanced Log Search</Feature>
              <Feature included>Unlimited Team Members</Feature>
              <Feature included>Customizable Log Retention</Feature>
              <Feature included>Custom Alert Integrations</Feature>
              <Feature included>Advanced Analytics</Feature>
              <Feature included>Custom Dashboards</Feature>
              <Feature included>24/7 Priority Support</Feature>
            </div>
            <Button className="mt-6 w-full">Contact us</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ children, included = false }) {
  return (
    <div className="flex items-center space-x-2">
      {included ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-gray-500" />
      )}
      <span className={included ? "" : "text-gray-500"}>{children}</span>
    </div>
  );
}
