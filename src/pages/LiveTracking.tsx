import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const LiveTracking = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900">Live Tracking</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5 text-primary" />
            Map placeholder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[480px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
            Leaflet / live socket map will go here
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTracking;
