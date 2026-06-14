"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { IconShieldLock } from "@tabler/icons-react";

export default function SetupAdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to setup admin");
      }

      setSuccess(true);
      setTimeout(() => {
        // Redirect to admin dashboard after successful promotion
        router.push("/admin/dashboard");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-brand-light/50">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-600">
            <IconShieldLock size={32} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-brand-dark text-center mb-2">Admin Setup</h1>
        <p className="text-text-secondary text-center mb-8">
          Enter the secret setup password to securely promote an account to administrator.
        </p>

        {error && (
          <div className="p-3 mb-6 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-4 mb-6 bg-green-50 text-green-700 text-center rounded-lg border border-green-200">
            <p className="font-semibold">Success!</p>
            <p className="text-sm">Account promoted. Redirecting to admin panel...</p>
          </div>
        ) : (
          <form onSubmit={handleSetup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Account Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="your-email@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-brand-dark mb-1">Setup Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field w-full"
                placeholder="Secret Environment Password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-6"
            >
              {loading ? "Promoting..." : "Promote to Admin"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
