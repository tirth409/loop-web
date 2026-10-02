"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string }>({});

  const validate = () => {
    const errs: typeof errors = {};
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const errs = validate();
  if (Object.keys(errs).length) {
    setErrors(errs);
    return;
  }
  setErrors({});
  setLoading(true);
  try {
    await login(form);
    toast.success("Welcome back!");
    router.push("/dashboard");
  } catch (err: any) {
    setErrors({ api: err.message || "Login failed. Please try again." });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="animate-fade-in">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 justify-center">
        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-xl font-bold text-neutral-900 tracking-tight">LOOP</p>
          <p className="text-[11px] text-neutral-400 uppercase tracking-widest -mt-0.5">Intelligence</p>
        </div>
      </div>

      <div className="card p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Welcome back</h1>
          <p className="text-sm text-neutral-500 mt-1">Sign in to your workspace</p>
        </div>

        {errors.api && (
          <div className="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm" role="alert">
            {errors.api}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Work email"
            type="email"
            id="email"
            placeholder="alex@company.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            error={errors.email}
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            error={errors.password}
            autoComplete="current-password"
            rightAddon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            loading={loading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign in
          </Button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-neutral-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-brand-600 font-medium hover:text-brand-700 transition-colors"
            >
              Create workspace
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-neutral-400 mt-5">
        By signing in, you agree to LOOP&apos;s Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
