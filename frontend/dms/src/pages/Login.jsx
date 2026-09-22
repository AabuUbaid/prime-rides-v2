import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);

      toast.success("Login successful. Welcome to Prime Rides!");

      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err?.message || err?.cause?.detail || "Invalid email or password.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-stretch bg-[#f5f6fa]">
      <div className="hidden w-[42%] flex-col justify-between bg-[#070a12] p-10 text-white lg:flex xl:p-14">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-lg font-extrabold text-slate-950">
              P
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Prime Rides
            </span>
          </div>

          <div className="mt-24 max-w-md">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">
              Dealer operations, simplified
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
              Keep every part of your dealership moving.
            </h1>
            <p className="mt-6 max-w-sm text-sm leading-7 text-slate-400">
              A focused workspace for inventory, customers, deals, finance, and
              the team behind every Prime Rides delivery.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Prime Rides Dealer Management System
        </p>
      </div>

      <div className="flex w-full items-center justify-center px-4 py-10 sm:px-6 lg:w-[58%] lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-lg font-extrabold text-slate-950">
                P
              </span>
              <span className="text-xl font-extrabold tracking-tight text-[#172033]">
                Prime Rides
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Dealer Management System
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-8"
          >
            <div className="mb-7">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
                Welcome back
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#172033]">
                Sign in to Prime Rides
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your credentials to access the dealership dashboard.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.08em] text-slate-500"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/15"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm leading-5 text-rose-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-7 h-11 w-full rounded-xl border border-amber-500 bg-amber-500 px-4 text-sm font-bold text-slate-950 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Secure access for authorized Prime Rides staff
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
