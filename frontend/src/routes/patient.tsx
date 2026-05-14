import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Upload, 
  Pill, 
  FileText, 
  Bot, 
  History, 
  User,
  Search
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/DashboardShell";
import { getSession, setSession as setPersistedSession } from "@/lib/session";

const NAV: NavItem[] = [
  { to: "/patient", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patient/upload", label: "Upload Prescription", icon: Upload },
  { to: "/patient/medicines", label: "My Medicines", icon: Pill },
  { to: "/patient/reports", label: "Health Reports", icon: FileText },
  { to: "/patient/ai-assistant", label: "AI Assistant", icon: Bot },
  { to: "/patient/prices", label: "Medicine Prices", icon: Search },
  { to: "/patient/history", label: "History", icon: History },
  { to: "/patient/profile", label: "My Profile", icon: User },
];


export const Route = createFileRoute("/patient")({
  component: PatientLayout,
});

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000"

function PatientLayout() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const currentSession = getSession();
    if (!currentSession) {
      navigate({ to: "/auth" });
      return;
    }
    setSession(currentSession);
    setIsMounted(true);

    // Sync full profile data globally
    async function syncProfile() {
      if (!currentSession?.id) return;
      try {
        const res = await fetch(`${BACKEND}/auth/profile/${currentSession.id}`);
        if (res.ok) {
          const userData = await res.json();
          const updatedSession = { ...currentSession, ...userData, phone: userData.phone_number };
          setPersistedSession(updatedSession);
          setSession(updatedSession);
        }
      } catch (err) {
        console.error("Layout sync error:", err);
      }
    }
    syncProfile();
  }, []);

  if (!isMounted) return null;

  const displayRole = (session?.role || "Patient");

  return (
    <DashboardShell role={displayRole} items={NAV}>
      <div className="mb-0">
         <Outlet />
      </div>
    </DashboardShell>
  );
}
