"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ApiError } from "@/services/http/api-error";
import { loginAdmin } from "@/features/auth/services/auth.api";

type FormState = {
  email: string;
  password: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function validateForm(values: FormState) {
  const errors: FormErrors = {};

  if (!values.email.trim()) {
    errors.email = "Email is required.";
  }

  if (!values.password.trim()) {
    errors.password = "Password is required.";
  }

  return errors;
}

export function AdminLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<FormState>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function updateValue(field: keyof FormState, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function mapApiErrors(error: ApiError) {
    return {
      email: error.errors?.Email?.[0] ?? error.errors?.email?.[0],
      password: error.errors?.Password?.[0] ?? error.errors?.password?.[0],
    } satisfies FormErrors;
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    setFormError(null);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    startTransition(async () => {
      try {
        await loginAdmin(values);
        router.replace("/admin");
        router.refresh();
      } catch (error) {
        if (error instanceof ApiError) {
          setErrors(mapApiErrors(error));
          setFormError(error.message);
          return;
        }

        setFormError("Unexpected error. Please try again.");
      }
    });
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground))]">
            Admin access
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm leading-7 text-[hsl(var(--foreground-soft))]">
            Use your administrator credentials to access the internal panel.
          </p>
        </div>
      </CardHeader>

      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => updateValue("email", event.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 text-sm outline-none transition-colors focus:border-[hsl(var(--accent))]"
            />
            {errors.email ? (
              <p id="email-error" className="text-sm text-[hsl(var(--destructive))]">{errors.email}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(event) => updateValue("password", event.target.value)}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              className="h-11 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 text-sm outline-none transition-colors focus:border-[hsl(var(--accent))]"
            />
            {errors.password ? (
              <p id="password-error" className="text-sm text-[hsl(var(--destructive))]">
                {errors.password}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="rounded-xl border border-[hsl(var(--destructive))] bg-[hsla(var(--destructive),0.08)] px-4 py-3 text-sm text-[hsl(var(--destructive))]">
              {formError}
            </p>
          ) : null}

          <Button className="w-full" disabled={isPending} type="submit">
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-start">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Session is stored in a secure HTTP-only cookie.
        </p>
      </CardFooter>
    </Card>
  );
}
