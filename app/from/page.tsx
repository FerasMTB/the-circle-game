"use client";

import type React from "react";
import { useState } from "react";

const PRIZES = [
  "20% discount",
  "40% discount",
  "1 hour free ride",
  "Yacht trip",
];

const INTEREST_OPTIONS = [
  "Supercar ride/rental",
  "Luxury yacht",
  "Watersport",
  "Desert safari/buggies",
  "Helicopter tour",
];

const NATIONALITIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Kuwait",
  "Qatar",
  "Bahrain",
  "Oman",
  "United States",
  "United Kingdom",
  "India",
  "Pakistan",
  "Other",
];

const RESIDENCY_OPTIONS = ["Tourist", "Resident"];

type SubmitStatus = "idle" | "submitting" | "success" | "error";

type FormState = {
  fullName: string;
  email: string;
  mobile: string;
  nationality: string;
  residency: string;
  interests: string[];
  winner: "yes" | "no";
  prize: string;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  mobile: "",
  nationality: "",
  residency: "",
  interests: [],
  winner: "no",
  prize: "",
};

export default function FromPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const isWinner = form.winner === "yes";

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200";

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (value: string) => {
    setForm((prev) => {
      const exists = prev.interests.includes(value);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((item) => item !== value)
          : [...prev.interests, value],
      };
    });
  };

  const handleWinnerChange = (value: "yes" | "no") => {
    setForm((prev) => ({
      ...prev,
      winner: value,
      prize: value === "yes" ? prev.prize : "",
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitStatus("submitting");
    setSubmitMessage("");

    if (isWinner && !form.prize) {
      setSubmitStatus("error");
      setSubmitMessage("Select a prize for winners.");
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      mobile: form.mobile.trim(),
      nationality: form.nationality,
      residency: form.residency,
      interests: form.interests,
      winner: isWinner,
      prize: isWinner ? form.prize : null,
    };

    try {
      const response = await fetch("/api/registration", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Submission failed.");
      }

      setSubmitStatus("success");
      setSubmitMessage("Registration submitted.");
      setForm(initialForm);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "Submission failed."
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-amber-50 text-slate-900">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-20 h-80 w-80 rounded-full bg-gradient-to-tr from-amber-200 to-amber-400 opacity-35 blur-3xl animate-blob" />
        <div className="absolute right-[-10%] top-24 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-200 to-indigo-200 opacity-45 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute left-1/3 bottom-0 h-96 w-96 rounded-full bg-gradient-to-tr from-emerald-200 to-teal-200 opacity-30 blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative mx-auto flex w-full max-w-4xl flex-col px-6 py-12 sm:px-10">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500">
            Beno Circle
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 sm:text-4xl">
            Spin To Win Registration
          </h1>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Fill in your details to join the draw. Winner status unlocks a prize
            selection.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5 rounded-3xl bg-white/85 p-6 shadow-lg ring-1 ring-slate-200 backdrop-blur sm:p-8"
        >
          <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
            <label htmlFor="fullName" className="text-sm font-medium text-slate-700">
              First &amp; Last Name:
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={form.fullName}
              onChange={(event) => handleChange("fullName", event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
            <label htmlFor="mobile" className="text-sm font-medium text-slate-700">
              Mobile:
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              required
              value={form.mobile}
              onChange={(event) => handleChange("mobile", event.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
            <label
              htmlFor="nationality"
              className="text-sm font-medium text-slate-700"
            >
              Nationality:
            </label>
            <select
              id="nationality"
              name="nationality"
              required
              value={form.nationality}
              onChange={(event) => handleChange("nationality", event.target.value)}
              className={inputClass}
            >
              <option value="">Select your nationality</option>
              {NATIONALITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
            <label
              htmlFor="residency"
              className="text-sm font-medium text-slate-700"
            >
              Tourist or Resident:
            </label>
            <select
              id="residency"
              name="residency"
              required
              value={form.residency}
              onChange={(event) => handleChange("residency", event.target.value)}
              className={inputClass}
            >
              <option value="">Select Residency Status</option>
              {RESIDENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <fieldset className="grid gap-2 md:grid-cols-[220px_1fr] md:items-start">
            <legend className="text-sm font-medium text-slate-700">
              Interested In:
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {INTEREST_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.interests.includes(option)}
                    onChange={() => toggleInterest(option)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-400"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
            <label htmlFor="winner" className="text-sm font-medium text-slate-700">
              Winner Status:
            </label>
            <select
              id="winner"
              name="winner"
              required
              value={form.winner}
              onChange={(event) =>
                handleWinnerChange(event.target.value as "yes" | "no")
              }
              className={inputClass}
            >
              <option value="no">Not a winner</option>
              <option value="yes">Winner</option>
            </select>
          </div>

          {isWinner && (
            <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
              <label htmlFor="prize" className="text-sm font-medium text-slate-700">
                Prize:
              </label>
              <select
                id="prize"
                name="prize"
                required={isWinner}
                value={form.prize}
                onChange={(event) => handleChange("prize", event.target.value)}
                className={inputClass}
              >
                <option value="">Select prize</option>
                {PRIZES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="submit"
              disabled={submitStatus === "submitting"}
              className="inline-flex items-center justify-center rounded-lg bg-[#0f4c5c] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b3f4d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitStatus === "submitting" ? "Submitting..." : "Submit"}
            </button>
            {submitStatus !== "idle" && (
              <p
                className={[
                  "text-sm",
                  submitStatus === "success" ? "text-emerald-600" : "",
                  submitStatus === "error" ? "text-rose-600" : "",
                ].join(" ")}
              >
                {submitMessage}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
