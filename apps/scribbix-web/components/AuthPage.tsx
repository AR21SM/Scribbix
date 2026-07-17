"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HTTP_BACKEND } from "@/config";
import axios from "axios";
import Link from "next/link";
import { ArrowRight, Github, LoaderCircle } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { saveAuthSession } from "@/lib/auth-session";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<
    "google" | "github" | null
  >(null);

  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get(
      "oauth_error",
    );
    if (oauthError) setError(oauthError);
  }, []);

  const startSocialLogin = (provider: "google" | "github") => {
    setError("");
    setSocialLoading(provider);
    window.location.assign(`${HTTP_BACKEND}/api/oauth/${provider}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignin ? "/api/signin" : "/api/signup";
      const payload = isSignin
        ? { username: email, password }
        : { username: email, password, name };
      const response = await axios.post(`${HTTP_BACKEND}${endpoint}`, payload);

      if (response.data.token) {
        saveAuthSession({
          token: response.data.token,
          userId: response.data.userId,
          userName: response.data.name,
        });
        router.push("/dashboard");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } catch (err) {
      const axiosError = err as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ path: string[]; message: string }>;
          };
        };
      };
      
      const validationErrors = axiosError.response?.data?.errors;
      if (validationErrors && validationErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          username: "Email address",
          password: "Password",
          name: "Full name",
        };
        const errorDetails = validationErrors.map((e) => {
          const field = e.path[0];
          const label = field ? fieldLabels[field] || field : "Field";
          if (field === "password" && e.message.includes("at least 8")) {
            return "Password must be at least 8 characters long.";
          }
          if (field === "username") {
            return "Please enter a valid email address.";
          }
          return `${label}: ${e.message}`;
        });
        setError(errorDetails.join(" "));
      } else {
        setError(
          axiosError.response?.data?.message ||
            "An error occurred. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fafafb] font-sans text-slate-900 antialiased selection:bg-violet-100 selection:text-violet-950 flex items-center justify-center p-4 md:p-6">
      {/* Unified Card Container */}
      <div className="w-full max-w-5xl rounded-[12px] border border-slate-200/60 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col">
        {/* Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] flex-grow">
          {/* Left Column (App Brand & Info Showcase) */}
          <section className="hidden overflow-hidden border-r border-slate-200/50 bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9]/30 to-[#f8fafc] px-10 py-8 lg:flex lg:flex-col justify-between">
            {/* Brand Logo */}
            <BrandLogo />

            <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center my-4">
              <h1 className="max-w-xs text-2xl font-black leading-[1.12] tracking-tight text-[#0a1128] xl:text-3xl">
                Turn every idea into something your team can see.
              </h1>
              <p className="mt-3 max-w-xs text-xs font-medium leading-relaxed text-slate-500">
                Brainstorm, plan, and build together on one playful visual
                workspace.
              </p>

              <img
                src="/images/auth-collaboration-wide.png"
                alt="A team collaborating around a Scribbix whiteboard"
                className="mx-auto mt-6 max-h-[310px] w-full object-contain xl:max-h-[350px]"
              />
            </div>
          </section>

          {/* Right Column (Form Panel) */}
          <section className="flex items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-12">
            <div className="w-full max-w-sm">
              <BrandLogo className="mb-8 text-xl lg:hidden" />

              <div className="mb-6">
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-600">
                  {isSignin ? "Welcome back" : "Start creating"}
                </p>
                <h2 className="text-3xl font-black tracking-tight text-[#0a1128]">
                  {isSignin ? "Sign in to Scribbix" : "Create your account"}
                </h2>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  {isSignin ? (
                    <>
                      New to Scribbix?{" "}
                      <Link
                        href="/signup"
                        className="font-extrabold text-violet-600 hover:text-violet-700"
                      >
                        Create a free account
                      </Link>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <Link
                        href="/signin"
                        className="font-extrabold text-violet-600 hover:text-violet-700"
                      >
                        Sign in
                      </Link>
                    </>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={socialLoading !== null}
                  onClick={() => startSocialLogin("google")}
                  className="flex h-11 items-center justify-center gap-2.5 rounded-[12px] border border-slate-200 bg-white px-4 text-xs font-extrabold text-[#0a1128] shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {socialLoading === "google" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <img src="/icons/google.svg" alt="" className="size-4" />
                  )}
                  Google
                </button>
                <button
                  type="button"
                  disabled={socialLoading !== null}
                  onClick={() => startSocialLogin("github")}
                  className="flex h-11 items-center justify-center gap-2.5 rounded-[12px] border border-slate-200 bg-white px-4 text-xs font-extrabold text-[#0a1128] shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {socialLoading === "github" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Github aria-hidden="true" className="size-4" />
                  )}
                  GitHub
                </button>
              </div>

              <div className="my-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                or continue with email
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-3.5">
                  {!isSignin && (
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-1.5 block text-xs font-extrabold text-slate-700"
                      >
                        Full name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required={!isSignin}
                        className="h-11 w-full rounded-[12px] border border-slate-200 bg-[#f8fafc] hover:border-slate-300 px-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400/80 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-xs font-extrabold text-slate-700"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="h-11 w-full rounded-[12px] border border-slate-200 bg-[#f8fafc] hover:border-slate-300 px-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400/80 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-1.5 block text-xs font-extrabold text-slate-700"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={
                        isSignin ? "current-password" : "new-password"
                      }
                      required
                      className="h-11 w-full rounded-[12px] border border-slate-200 bg-[#f8fafc] hover:border-slate-300 px-4 text-sm font-semibold text-slate-900 outline-none transition-all placeholder:text-slate-400/80 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-100"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-[12px] border border-rose-100 bg-rose-50 p-4 text-xs font-semibold leading-normal text-rose-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-slate-900 px-5 text-sm font-extrabold text-white shadow-lg shadow-slate-900/15 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isSignin ? "Sign in" : "Create account"}
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-xs font-medium leading-relaxed text-slate-400">
                By continuing, you agree to Scribbix&apos;s Terms of Service and
                Privacy Policy.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
