import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { PatientProvider } from "@/context/patient-context";

import Layout from "@/components/layout/layout";
import Dashboard from "@/pages/dashboard";
import PatientProfile from "@/pages/patient-profile";
import MedicalRecords from "@/pages/medical-records";
import FirstAidGuide from "@/pages/first-aid-guide";
import EmergencyContact from "@/pages/emergency-contact";
import NotFound from "@/pages/not-found";

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <PatientProvider>
          <Layout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/patient-profile" component={PatientProfile} />
              <Route path="/patient-profile/:id" component={PatientProfile} />
              <Route path="/medical-records" component={MedicalRecords} />
              <Route path="/first-aid-guide" component={FirstAidGuide} />
              <Route path="/emergency-contact" component={EmergencyContact} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
          <Toaster />
        </PatientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
