"use client";

import React, { useRef, useState, useTransition } from "react";
import { updateProfile, uploadAvatar, changePassword } from "@/app/settings/actions";
import {
  IconUser, IconMail, IconBuilding, IconPhone, IconMapPin,
  IconWorld, IconCode, IconCamera, IconLock, IconEye, IconEyeOff,
  IconCheck, IconX, IconAlertCircle, IconCalendar, IconHash,
} from "@tabler/icons-react";

type ProfileData = {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  phone: string | null;
  location: string | null;
  website: string | null;
  skills: string[] | null;
  role: string;
  email: string;
  created_at: string;
};

/* ───────── Toast helper ───────── */
function Toast({ toast, onClose, onUndo }: {
  toast: { message: string; type: "success" | "error" | "info"; onUndo?: () => void } | null;
  onClose: () => void;
  onUndo?: () => void;
}) {
  if (!toast) return null;
  const bg = toast.type === "success" ? "bg-brand-mid" : toast.type === "error" ? "bg-red-600" : "bg-brand-dark";
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-[fadeInDown_0.3s_ease]">
      <div className={`${bg} text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 min-w-[280px] max-w-[420px]`}>
        {toast.type === "success" && <IconCheck size={18} />}
        {toast.type === "error" && <IconAlertCircle size={18} />}
        <span className="text-[13px] flex-1">{toast.message}</span>
        {toast.onUndo && (
          <button onClick={() => { toast.onUndo?.(); onClose(); }} className="text-[12px] font-semibold underline underline-offset-2 hover:no-underline">
            Undo
          </button>
        )}
        <button onClick={onClose} className="opacity-70 hover:opacity-100"><IconX size={16} /></button>
      </div>
    </div>
  );
}

/* ───────── Avatar Section ───────── */
function AvatarSection({ profile, onAvatarChange }: { profile: ProfileData; onAvatarChange: (url: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<any>(null);

  const initials = (profile.full_name || "U").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setShowToast({ message: "File too large (max 2MB)", type: "error" });
      return;
    }
    // Preview
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const result = await uploadAvatar(fd);
      if (result.avatarUrl) onAvatarChange(result.avatarUrl);
      setShowToast({ message: "Avatar updated!", type: "success" });
    } catch (err: any) {
      setShowToast({ message: err.message || "Upload failed", type: "error" });
      setPreview(null);
    }
    setUploading(false);
  };

  const avatarSrc = preview || profile.avatar_url;

  return (
    <div className="flex flex-col items-center gap-4">
      <Toast toast={showToast} onClose={() => setShowToast(null)} />
      <div className="relative group">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-brand-tint shadow-lg bg-brand-surface flex items-center justify-center">
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-brand-mid">{initials}</span>
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
        >
          {uploading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <IconCamera size={24} className="text-white" />
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <button
        onClick={() => fileRef.current?.click()}
        className="text-[12px] text-brand-mid font-medium hover:underline"
      >
        Change photo
      </button>
    </div>
  );
}

/* ───────── Input Field ───────── */
function Field({ icon: Icon, label, name, defaultValue, placeholder, type = "text", multiline = false }: {
  icon: any; label: string; name: string; defaultValue?: string | null; placeholder?: string; type?: string; multiline?: boolean;
}) {
  const base = "w-full bg-brand-surface border border-brand-light rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-brand-dark outline-none focus:border-brand-accent transition-colors";
  return (
    <div>
      <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        {multiline ? (
          <textarea name={name} defaultValue={defaultValue || ""} placeholder={placeholder} rows={3}
            className={`${base} !pl-10 resize-none !pt-3`}
            style={{ paddingLeft: "2.5rem" }}
          />
        ) : (
          <input name={name} type={type} defaultValue={defaultValue || ""} placeholder={placeholder} className={base} />
        )}
      </div>
    </div>
  );
}

/* ───────── Read-Only Info ───────── */
function ReadOnlyField({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-brand-surface/50 rounded-lg border border-brand-light/60">
        <Icon size={16} className="text-text-tertiary shrink-0" />
        <span className="text-[13px] text-brand-dark">{value}</span>
      </div>
    </div>
  );
}

/* ───────── Main Form ───────── */
export default function ProfileSettingsForm({ profile }: { profile: ProfileData }) {
  const [isPending, startTransition] = useTransition();
  const [pwPending, setPwPending] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  };

  const handleSave = (fd: FormData) => {
    startTransition(async () => {
      try {
        await updateProfile(fd);
        showToast("Profile saved successfully!", "success");
      } catch (e: any) {
        showToast(e.message || "Save failed", "error");
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPwPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      await changePassword(fd);
      showToast("Password changed!", "success");
      setShowPw(false);
      setShowPwConfirm(false);
      e.currentTarget.reset();
    } catch (err: any) {
      showToast(err.message || "Failed to change password", "error");
    }
    setPwPending(false);
  };

  const isFreelancer = profile.role === "freelancer";
  const skillsStr = (profile.skills || []).join(", ");

  return (
    <>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="space-y-8">
        {/* ─── Avatar + Quick Info Header ─── */}
        <div className="card bg-white p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <AvatarSection profile={{ ...profile, avatar_url: avatarUrl }} onAvatarChange={setAvatarUrl} />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold text-brand-dark">{profile.full_name || "Your Profile"}</h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary bg-brand-tint px-3 py-1 rounded-full capitalize font-medium">
                  <IconBuilding size={13} /> {profile.role}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-text-secondary">
                  <IconMail size={13} /> {profile.email}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] text-text-tertiary">
                  <IconCalendar size={13} /> Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Profile Information ─── */}
        <div className="card bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
                <IconUser size={20} /> Profile Information
              </h3>
              <p className="text-[12px] text-text-tertiary mt-1">Update your personal details and public profile.</p>
            </div>
          </div>

          <form action={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field icon={IconUser} label="Full Name" name="full_name" defaultValue={profile.full_name} placeholder="Your full name" />
              <Field icon={IconPhone} label="Phone" name="phone" defaultValue={profile.phone} placeholder="+1 (555) 000-0000" type="tel" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field icon={IconMapPin} label="Location" name="location" defaultValue={profile.location} placeholder="City, Country" />
              <Field icon={IconWorld} label="Website" name="website" defaultValue={profile.website} placeholder="https://yoursite.com" type="url" />
            </div>

            {isFreelancer && (
              <div>
                <label className="text-[12px] font-medium text-text-secondary mb-1.5 block">Skills</label>
                <div className="relative">
                  <IconCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    name="skills"
                    defaultValue={skillsStr}
                    placeholder="React, Node.js, Figma, UI/UX..."
                    className="w-full bg-brand-surface border border-brand-light rounded-lg pl-10 pr-4 py-2.5 text-[13px] text-brand-dark outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
                <p className="text-[11px] text-text-tertiary mt-1">Comma-separated list of your skills</p>
              </div>
            )}

            <Field icon={IconUser} label="Bio" name="bio" defaultValue={profile.bio} placeholder="Tell others about yourself..." multiline />

            <div className="flex justify-end pt-2">
              <button type="submit" disabled={isPending} className="pill-btn bg-brand-accent text-white disabled:opacity-50 min-w-[140px]">
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ─── Account Settings ─── */}
        <div className="card bg-white p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
              <IconLock size={20} /> Account Settings
            </h3>
            <p className="text-[12px] text-text-tertiary mt-1">Manage your login credentials and security.</p>
          </div>

          <div className="space-y-4">
            <ReadOnlyField icon={IconMail} label="Email Address" value={profile.email} />
            <ReadOnlyField icon={IconHash} label="Account ID" value={`${profile.id.slice(0, 8)}...${profile.id.slice(-4)}`} />

            <div className="pt-2">
              {!showPw ? (
                <button
                  onClick={() => setShowPw(true)}
                  className="text-[13px] text-brand-mid font-medium hover:underline flex items-center gap-1.5"
                >
                  <IconLock size={15} /> Change Password
                </button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4 p-4 bg-brand-surface rounded-xl border border-brand-light">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-brand-dark">Set New Password</span>
                    <button type="button" onClick={() => setShowPw(false)} className="text-text-tertiary hover:text-text-secondary">
                      <IconX size={16} />
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      name="new_password"
                      type={showPw ? "text" : "password"}
                      placeholder="New password"
                      required
                      minLength={6}
                      className="w-full bg-white border border-brand-light rounded-lg px-4 py-2.5 pr-10 text-[13px] outline-none focus:border-brand-accent"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                      {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      name="confirm_password"
                      type={showPwConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                      className="w-full bg-white border border-brand-light rounded-lg px-4 py-2.5 pr-10 text-[13px] outline-none focus:border-brand-accent"
                    />
                    <button type="button" onClick={() => setShowPwConfirm(!showPwConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary">
                      {showPwConfirm ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={pwPending} className="pill-btn bg-brand-mid text-white disabled:opacity-50 text-[13px]">
                      {pwPending ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
