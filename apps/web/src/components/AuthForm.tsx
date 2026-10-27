"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(isSignup ? { agencyName } : {}),
        }),
      });
      let data: { error?: string } = {};
      try {
        data = (await response.json()) as { error?: string };
      } catch {
        data = {};
      }
      if (!response.ok) {
        setMessage(data.error ?? "Could not sign you in. Try again.");
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {isSignup && (
        <label className="field">
          <span>Agency or studio name</span>
          <input
            className="input"
            value={agencyName}
            onChange={(event) => setAgencyName(event.target.value)}
            placeholder="Northstar Studio"
            autoComplete="organization"
            maxLength={80}
            required
          />
        </label>
      )}
      <label className="field">
        <span>Email</span>
        <input
          className="input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@agency.com"
          autoComplete="email"
          required
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={isSignup ? "At least 10 characters" : "Your password"}
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={isSignup ? 10 : undefined}
          required
        />
      </label>

      {message && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}

      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? "Working..." : isSignup ? "Create your account" : "Sign in"}
      </button>

      <p className="auth-switch">
        {isSignup ? "Already have an account?" : "New to HandoffKit?"}{" "}
        <a href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Sign in" : "Start free"}
        </a>
      </p>
      <p className="microcopy">
        Passwords are hashed with scrypt. Email verification and password reset are not available
        yet.
      </p>
    </form>
  );
}
