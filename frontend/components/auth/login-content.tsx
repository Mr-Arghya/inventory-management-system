"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, ArrowLeft, Mail, Shield, Lock, EyeOff, Eye } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/context/auth-context";
import { Spinner } from "@/components/ui/spinner";
import type { LoginFormData } from "@/lib/validations";
import { loginSchema } from "@/lib/validations";

export function LoginContent() {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    error,
    authStep,
    pendingEmail,
    initiateLogin,
    resetAuthFlow,
    clearError,
  } = useAuth();

  const [resendCooldown, setResendCooldown] = useState(0);

  // React Hook Form for email step
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
    getValues,
  } = useForm<Pick<LoginFormData, "email" | "password">>({
    resolver: zodResolver(loginSchema.pick({ email: true, password: true })),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const onEmailSubmit = async (
    data: Pick<LoginFormData, "email" | "password">
  ) => {
    await initiateLogin(data.email, data.password);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Package className="h-10 w-10" />
            <span className="text-2xl font-bold text-foreground">
              InventoryHub
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            Enterprise Inventory Management
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-card-foreground">
              {authStep === "email" ? "Welcome back" : "Verify your email"}
            </CardTitle>
            <CardDescription>
              {authStep === "email"
                ? "Enter your email to sign in to your account"
                : `We sent a verification code to ${pendingEmail}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleEmailSubmit(onEmailSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    {...registerEmail("email")}
                    onChange={(e) => {
                      registerEmail("email").onChange(e);
                      clearError();
                    }}
                    className={`pl-10 ${emailErrors.email ? "border-destructive" : ""}`}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                {emailErrors.email && (
                  <p className="text-sm text-destructive">
                    {emailErrors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...registerEmail("password")}
                    onChange={(e) => {
                      registerEmail("password").onChange(e);
                      clearError();
                    }}
                    className={`pl-10 ${emailErrors.password ? "border-destructive" : ""}`}
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-black"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {emailErrors.password && (
                  <p className="text-sm text-destructive">
                    {emailErrors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isLoading || !getValues("email") || !getValues("password")
                }
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <span>Want to register your business? </span>
          <Link
            href="/register"
            className="text-primary hover:underline font-medium"
          >
            Create an account
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Only account owners can register. Managers and staff are added by the
          owner.
        </p>
      </div>
    </div>
  );
}
