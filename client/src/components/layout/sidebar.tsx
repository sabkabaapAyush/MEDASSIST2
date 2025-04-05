import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { usePatient } from "@/context/patient-context";
import { 
  Home, 
  User, 
  ClipboardList, 
  BookOpen, 
  Phone,
  VideoIcon,
  Info
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location] = useLocation();
  const { currentPatient } = usePatient();
  
  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <Home className="h-5 w-5 mr-3" />
    },
    {
      name: "Patient Profile",
      path: "/patient-profile",
      icon: <User className="h-5 w-5 mr-3" />
    },
    {
      name: "Medical Records",
      path: "/medical-records",
      icon: <ClipboardList className="h-5 w-5 mr-3" />
    },
    {
      name: "First Aid Guide",
      path: "/first-aid-guide",
      icon: <BookOpen className="h-5 w-5 mr-3" />
    },
    {
      name: "Emergency Contact",
      path: "/emergency-contact",
      icon: <Phone className="h-5 w-5 mr-3" />
    },
    {
      name: "Consultations",
      path: "/consultations",
      icon: <VideoIcon className="h-5 w-5 mr-3" />
    }
  ];

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-neutral-200">
      <div className="p-6">
        <div className="flex items-center">
          <div className="h-10 w-10 flex items-center justify-center">
            <img src="/images/medassist-logo.svg" alt="MedAssist Logo" className="h-10 w-10" />
          </div>
          <span className="ml-3 text-xl font-bold text-neutral-900">MedAssist</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                location === item.path
                  ? "bg-primary text-white"
                  : "text-neutral-700 hover:bg-neutral-100",
                "group flex items-center px-4 py-3 text-sm font-medium rounded-md"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </div>
      </nav>
      
      {currentPatient && (
        <div className="border-t border-neutral-200 p-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{currentPatient.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-neutral-900">{currentPatient.name}</p>
              <p className="text-xs font-medium text-neutral-500">
                {currentPatient.age} years • {currentPatient.gender}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
