import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create account",
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <div>
      <div className="label-xs mb-3">Create account</div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Start saving places.
      </h1>
      <p className="text-sm text-muted mt-2">
        One minute. Free forever. Your email never leaves Supabase.
      </p>

      <div className="mt-8">
        <RegisterForm next={searchParams.next} />
      </div>

      <p className="mt-6 text-xs text-muted">
        Already have an account?{" "}
        <Link
          href={`/login${searchParams.next ? `?next=${searchParams.next}` : ""}`}
          className="text-text hover:underline"
        >
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
