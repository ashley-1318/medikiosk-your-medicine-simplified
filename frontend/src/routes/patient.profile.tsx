import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from "react"
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Settings, 
  Activity, 
  Pill, 
  FileText,
  MapPin,
  ExternalLink,
  Edit2,
  Save,
  X,
  Dna,
  Scale,
  Ruler,
  Info
} from "lucide-react"
import { getSession, setSession as setLocalSession } from "@/lib/session"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { showNotification } from "@/lib/notifications"

export const Route = createFileRoute('/patient/profile')({
  component: ProfilePage,
})

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000"

function ProfilePage() {
  const [session] = useState(() => getSession())
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [stats, setStats] = useState({
    prescriptions: 0,
    medicines: 0,
    reports: 0
  })

  // Editable fields
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    age: "",
    blood_group: "",
    weight: "",
    height: "",
    gender: "",
    allergies: "",
    conditions: ""
  })

  useEffect(() => {
    async function fetchData() {
      try {
        if (!session?.id) {
          setLoading(false);
          return;
        }
        // 1. Fetch full user profile via Backend (Bypasses RLS)
        const res = await fetch(`${BACKEND}/auth/profile/${session.id}`);
        if (!res.ok) throw new Error("Failed to fetch profile from server");
        
        const user = await res.json();

        if (user) {
          const toStr = (val: any) => {
            if (!val) return "";
            if (Array.isArray(val)) return val.join(", ");
            return val.toString();
          };

          setFormData({
            name: user.name || "",
            phone: user.phone_number || "",
            email: user.email || "",
            address: user.address || "",
            age: (user.age ?? "").toString(),
            blood_group: user.blood_group || "",
            weight: (user.weight ?? "").toString(),
            height: (user.height ?? "").toString(),
            gender: user.gender || "",
            allergies: toStr(user.allergies),
            conditions: toStr(user.conditions)
          })
          
          // Update local session if it's missing fields
          const updatedSession = { ...session, ...user, phone: user.phone_number }
          setLocalSession(updatedSession as any)
        }

        // 2. Fetch Stats
        const prescRes = await fetch(`${BACKEND}/prescriptions/patient/${session.id}`);
        const prescData = prescRes.ok ? await prescRes.json() : [];
        const approvedPresc = prescData.filter((p: any) => p.status === "approved");
        const activeMedsCount = approvedPresc.reduce((acc: number, curr: any) => acc + (curr.extracted_data?.medicines?.length || curr.extracted_data?.length || 0), 0);

        const reportsRes = await fetch(`${BACKEND}/reports/patient/${session.id}`);
        const reportsData = reportsRes.ok ? await reportsRes.json() : [];

        setStats({
          prescriptions: prescData.length,
          medicines: activeMedsCount,
          reports: reportsData.length
        })

      } catch (err) {
        console.error("Error fetching profile data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session?.id])

  const handleSave = async () => {
    if (!session?.id) {
        showNotification("Error", "No active session found");
        return;
    }
    
    console.log("[Profile] Save button clicked. Data:", formData);
    setSaving(true);
    
    try {
      const res = await fetch(`${BACKEND}/auth/save-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: session.id, 
          ...formData,
          phone_number: formData.phone // Map phone to DB phone_number
        })
      });

      console.log("[Profile] Backend response status:", res.status);

      if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${res.status}`);
      }
      
      const updatedUser = await res.json();
      console.log("[Profile] Save successful. Updated user:", updatedUser);

      // Update local session
      const updatedSession = { 
        ...session, 
        ...updatedUser,
        phone: updatedUser.phone_number 
      }
      
      setLocalSession(updatedSession as any);
      setIsEditing(false);
      showNotification("Success", "Profile updated successfully");
      
      // Delay reload slightly to let notification show
      setTimeout(() => {
          window.location.reload();
      }, 1000);

    } catch (err: any) {
      console.error("[Profile] Save failed:", err);
      alert(`Save Failed: ${err.message}`); // Direct feedback for the user
      showNotification("Error", err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-40 rounded-3xl bg-card"></div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-3xl bg-card"></div>)}
        </div>
        <div className="h-64 rounded-3xl bg-card"></div>
      </div>
    )
  }

  const initials = session?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "P"

  return (
    <div className="animate-fade-up space-y-8 pb-12">
      {/* Header Profile Section */}
      <div className="relative overflow-hidden rounded-3xl bg-card shadow-card">
        <div className="absolute inset-0 bg-sidebar opacity-5 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]"></div>
        <div className="relative flex flex-col items-center gap-6 p-8 md:flex-row md:items-end md:p-12">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-sidebar text-3xl font-bold text-white shadow-glow ring-4 ring-white/10 ring-offset-2 ring-offset-background animate-float">
            {initials}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center gap-3 md:justify-start">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="rounded-lg border-none bg-background px-3 py-1 text-2xl font-bold text-surface focus:ring-2 focus:ring-amber"
                />
              ) : (
                <h1 className="text-3xl font-bold text-surface">{session?.name}</h1>
              )}
              <span className="inline-flex items-center rounded-full bg-mint/20 px-2.5 py-0.5 text-xs font-medium text-surface ring-1 ring-mint/30">
                {session?.role || "Patient"}
              </span>
            </div>
            <p className="mt-2 text-muted-foreground">Managing your health at Medikiosk</p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 md:justify-start">
              <div className="flex items-center gap-2 rounded-xl bg-background/50 px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-border">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Verified Account
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-background/50 px-3 py-1.5 text-xs text-muted-foreground ring-1 ring-border">
                <Calendar className="h-3.5 w-3.5 text-amber" />
                Joined March 2024
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-sm font-bold text-surface transition-hover hover:bg-background"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-2xl bg-success px-6 py-3 text-sm font-bold text-white shadow-soft transition-hover hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Changes
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 rounded-2xl bg-amber px-6 py-3 text-sm font-bold text-amber-foreground shadow-soft transition-hover hover:scale-105 active:scale-95"
              >
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { label: "Prescriptions", value: stats.prescriptions, icon: FileText, color: "text-amber bg-amber/10" },
          { label: "Active Medicines", value: stats.medicines, icon: Pill, color: "text-success bg-success/10" },
          { label: "Health Reports", value: stats.reports, icon: Activity, color: "text-sidebar-accent-foreground bg-sidebar-accent/10" },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-5 rounded-3xl bg-card p-6 shadow-card transition-hover">
            <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", s.color)}>
              <s.icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-3xl font-bold text-surface">{s.value}</p>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Contact Information */}
        <div className="lg:col-span-1 rounded-3xl bg-card p-8 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-surface">Contact</h3>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-sm font-medium text-amber hover:underline"
              >
                Manage
              </button>
            )}
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-xl bg-background p-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">Email Address</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 w-full rounded-lg border-none bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber"
                    placeholder="Enter email"
                  />
                ) : (
                  <p className="font-semibold text-surface">{formData.email || "Not set"}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-xl bg-background p-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">Phone Number</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 w-full rounded-lg border-none bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber"
                  />
                ) : (
                  <p className="font-semibold text-surface">{formData.phone}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-xl bg-background p-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground">Location / Address</p>
                {isEditing ? (
                  <textarea
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 w-full rounded-lg border-none bg-background px-3 py-1.5 text-sm focus:ring-2 focus:ring-amber"
                    rows={2}
                    placeholder="Enter address"
                  />
                ) : (
                  <p className="font-semibold text-surface">{formData.address || "Not set"}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Health Profile */}
        <div className="lg:col-span-2 rounded-3xl bg-card p-8 shadow-card">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-surface">Health Profile</h3>
            <Info className="h-5 w-5 text-muted-foreground opacity-30" />
          </div>
          
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 mb-8">
            {[
              { label: "Age", value: formData.age, field: "age", icon: Calendar, suffix: "yrs" },
              { label: "Blood", value: formData.blood_group, field: "blood_group", icon: Dna, placeholder: "O+" },
              { label: "Weight", value: formData.weight, field: "weight", icon: Scale, suffix: "kg" },
              { label: "Height", value: formData.height, field: "height", icon: Ruler, suffix: "cm" },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl bg-background/40 p-4 border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </div>
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={item.value}
                      onChange={e => setFormData({ ...formData, [item.field]: e.target.value })}
                      className="w-full bg-transparent p-0 text-sm font-bold text-surface border-none focus:ring-0"
                      placeholder={item.placeholder || "0"}
                    />
                    <span className="text-xs text-muted-foreground">{item.suffix}</span>
                  </div>
                ) : (
                  <p className="text-lg font-bold text-surface">
                    {item.value || "--"} <span className="text-xs font-normal text-muted-foreground">{item.suffix}</span>
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Known Allergies</p>
              {isEditing ? (
                <textarea
                  value={formData.allergies}
                  onChange={e => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full rounded-2xl border-none bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-amber"
                  rows={2}
                  placeholder="List any allergies (e.g., Penicillin, Peanuts)"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.allergies ? formData.allergies.split(",").map((a, i) => (
                    <span key={i} className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                      {a.trim()}
                    </span>
                  )) : (
                    <p className="text-sm text-muted-foreground italic">No allergies reported</p>
                  )}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-3">Chronic Conditions</p>
              {isEditing ? (
                <textarea
                  value={formData.conditions}
                  onChange={e => setFormData({ ...formData, conditions: e.target.value })}
                  className="w-full rounded-2xl border-none bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-amber"
                  rows={2}
                  placeholder="List any chronic conditions (e.g., Diabetes, Hypertension)"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.conditions ? formData.conditions.split(",").map((c, i) => (
                    <span key={i} className="rounded-full bg-sidebar-accent/10 px-3 py-1 text-xs font-medium text-sidebar-accent-foreground">
                      {c.trim()}
                    </span>
                  )) : (
                    <p className="text-sm text-muted-foreground italic">No chronic conditions reported</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Settings (Simplified) */}
      <div className="rounded-3xl bg-card p-8 shadow-card">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-surface">Security & Privacy</h3>
          <ShieldCheck className="h-5 w-5 text-success" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "Notification Preferences", desc: "Manage how you receive alerts", icon: Activity },
            { label: "Two-Factor Authentication", desc: "Add an extra layer of security", icon: ShieldCheck, status: "Enabled", statusColor: "text-success" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between rounded-2xl border border-border/50 p-4 transition-all hover:bg-background">
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-sidebar/5 p-2.5">
                  <item.icon className="h-4 w-4 text-sidebar" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-surface">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              {item.status && (
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", item.statusColor)}>{item.status}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Loader2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", props.className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
}
