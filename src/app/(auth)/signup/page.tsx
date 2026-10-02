"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Zap, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { signup } from "@/lib/api/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    workspaceName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email) errs.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.workspaceName.trim()) errs.workspaceName = "Workspace name is required";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
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
      // signup() creates the account, then signs in via NextAuth (session
      // cookie is set automatically), so there is nothing to store here.
      await signup({
        name: form.name,
        email: form.email,
        password: form.password,
        workspaceName: form.workspaceName,
      });
      toast.success("Workspace created! Welcome to LOOP.");
      router.push("/dashboard");
    } catch (err: any) {
      setErrors({ api: err.message || "Signup failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
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
          <h1 className="text-2xl font-bold text-neutral-900">Create your workspace</h1>
          <p className="text-sm text-neutral-500 mt-1">
            You&apos;ll be the Admin of your workspace.
          </p>
        </div>

        {errors.api && (
          <div className="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-sm" role="alert">
            {errors.api}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            label="Full name"
            type="text"
            id="name"
            placeholder="Alex Johnson"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            error={errors.name}
            autoComplete="name"
            autoFocus
          />

          <Input
            label="Work email"
            type="email"
            id="email"
            placeholder="alex@company.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
          />

          <Input
            label="Company / Workspace name"
            type="text"
            id="workspaceName"
            placeholder="Acme Corp"
            value={form.workspaceName}
            onChange={(e) => update("workspaceName", e.target.value)}
            error={errors.workspaceName}
          />

          <div className="space-y-1.5">
            <Input
              label="Password"
              type={showPw ? "text" : "password"}
              id="password"
              placeholder="Create a strong password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              error={errors.password}
              autoComplete="new-password"
              rightAddon={
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            {/* Password requirements */}
            {form.password.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                {PASSWORD_RULES.map((rule) => {
                  const met = rule.test(form.password);
                  return (
                    <span
                      key={rule.label}
                      className={`flex items-center gap-1 text-[11px] font-medium ${
                        met ? "text-success-600" : "text-neutral-400"
                      }`}
                    >
                      <Check className={`h-3 w-3 ${met ? "opacity-100" : "opacity-30"}`} />
                      {rule.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <Input
            label="Confirm password"
            type={showConfirm ? "text" : "password"}
            id="confirmPassword"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            error={errors.confirmPassword}
            autoComplete="new-password"
            rightAddon={
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            Create workspace
          </Button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-neutral-500">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-medium hover:text-brand-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}