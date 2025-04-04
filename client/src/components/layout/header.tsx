import { useState } from "react";
import { Link } from "wouter";
import { Menu, Bell, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; 
import { usePatient } from "@/context/patient-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./sidebar";

export default function Header() {
  const { currentPatient } = usePatient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-neutral-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center md:hidden">
              <div className="h-8 w-8 flex items-center justify-center">
                <img src="/images/medassist-logo.svg" alt="MedAssist Logo" className="h-8 w-8" />
              </div>
              <span className="ml-2 text-lg font-bold text-neutral-900">MedAssist</span>
            </div>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden px-4 text-neutral-500 focus:outline-none">
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[240px] sm:w-[300px] p-0">
                <Sidebar />
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex items-center">
            <button className="p-2 rounded-full text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none">
              <Bell className="h-6 w-6" />
            </button>
            
            <button className="ml-3 p-2 rounded-full text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 focus:outline-none">
              <Settings className="h-6 w-6" />
            </button>
            
            <div className="ml-3 relative md:hidden">
              <div>
                <button className="flex text-sm rounded-full focus:outline-none" id="user-menu-button">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {currentPatient ? currentPatient.name.substring(0, 2).toUpperCase() : "ME"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
