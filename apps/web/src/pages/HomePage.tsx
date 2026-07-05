import CameraCapture from "../components/camera/CameraCapture";
import { Card } from "../components/ui/Card";
import { IssueIcon } from "../components/ui/IssueIcon";
import floodingIcon from "../assets/icons/flooding.svg";
import roadIcon from "../assets/icons/road-damage.svg";
import accidentIcon from "../assets/icons/accident.svg";
import streetlightIcon from "../assets/icons/streetlight.svg";
import dumpingIcon from "../assets/icons/dumping.svg";
import constructionIcon from "../assets/icons/construction.svg";

const issueTypes = [
  { icon: floodingIcon, label: "Flooding" },
  { icon: roadIcon, label: "Road damage" },
  { icon: accidentIcon, label: "Accidents" },
  { icon: streetlightIcon, label: "Broken lights" },
  { icon: dumpingIcon, label: "Illegal dumping" },
  { icon: constructionIcon, label: "Delayed projects" },
];

export default function HomePage() {
  return (
    <div className="space-y-6 pb-2">
      <CameraCapture />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-500">
          Issues we route
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {issueTypes.map((item) => (
            <Card key={item.label} padding="sm" className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <IssueIcon src={item.icon} label={item.label} className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-brand-700">{item.label}</span>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
