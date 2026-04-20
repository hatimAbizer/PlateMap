import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <div>
      <div className="label-xs mb-3">Sign in</div>
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Welcome back.
      </h1>
      <p className="text-sm text-muted mt-2">
        Save favourites, write reviews, set dietary preferences.
      </p>

      <div className="mt-8">
        <LoginForm next={searchParams.next} />
      </div>

      <p className="mt-6 text-xs text-muted">
        No account?{" "}
        <Link href={`/register${searchParams.next ? `?next=${searchParams.next}` : ""}`} className="text-text hover:underline">
          Create one
        </Link>
        .
      </p>
    </div>
  );
}
