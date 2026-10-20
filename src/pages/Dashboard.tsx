import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { MapPin, History, Radio } from "lucide-react";
import { Link } from "react-router-dom";

const quickLinks = [
  {
    title: "Live Tracking",
    description: "Real-time vehicle & device locations",
    href: "/live-tracking",
    icon: Radio,
  },
  {
    title: "History Tracking",
    description: "Playback past routes and trips",
    href: "/history-tracking",
    icon: History,
  },
  {
    title: "Map Overview",
    description: "View all assets on the map",
    href: "/live-tracking",
    icon: MapPin,
  },
];

const Dashboard = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          GPS House dashboard — start tracking from the links below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => (
          <Link key={link.href + link.title} to={link.href}>
            <Card className="h-full transition-shadow hover:shadow-elegant">
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <link.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
