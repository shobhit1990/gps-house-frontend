import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Settings</CardTitle>
          <CardDescription>
            Configure GPS House preferences. Settings screens will be added here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No settings yet.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
