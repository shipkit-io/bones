import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FormMonitorDashboard() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Form Monitor Dashboard</CardTitle>
                    <CardDescription>
                        Monitor your forms like an uptime service. This feature is coming soon.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        The form monitoring dashboard is currently under development.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
