"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ArrowLeft,
  Mail,
  Building2,
  User,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { registerSchema, type RegisterFormData } from "@/lib/validations";

export function RegisterContent() {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    error,
    authStep,
    pendingEmail,
    initiateRegister,
    resetAuthFlow,
    clearError,
  } = useAuth();

  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register: registerForm,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: formErrors, isValid },
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      businessName: "",
      password: "",
      confirm_password: "",
    },
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    setValue,
    watch,
    formState: { errors: otpErrors },
  } = useForm<{ otp: string }>({
    resolver: zodResolver(
      z.object({
        otp: z.string().length(6, "Please enter the 6-digit code"),
      })
    ),
    mode: "onChange",
    defaultValues: {
      otp: "",
    },
  });

  const otpValue = watch("otp");

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

  const onRegisterSubmit = async (data: RegisterFormData) => {
    await initiateRegister({
      ...data,
      user_type: "owner",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
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
              {authStep === "email"
                ? "Create your account"
                : "Verify your email"}
            </CardTitle>
            <CardDescription>
              {authStep === "email"
                ? "Register as a business owner to get started"
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
              onSubmit={handleRegisterSubmit(onRegisterSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...registerForm("name")}
                    onChange={(e) => {
                      registerForm("name").onChange(e);
                      clearError();
                    }}
                    className={`pl-10 ${formErrors.name ? "border-destructive" : ""}`}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                {formErrors.name && (
                  <p className="text-sm text-destructive">
                    {formErrors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    {...registerForm("email")}
                    onChange={(e) => {
                      registerForm("email").onChange(e);
                      clearError();
                    }}
                    className={`pl-10 ${formErrors.email ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-destructive">
                    {formErrors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName">Business name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Acme Corp"
                    {...registerForm("businessName")}
                    onChange={(e) => {
                      registerForm("businessName").onChange(e);
                      clearError();
                    }}
                    className={`pl-10 ${formErrors.businessName ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                </div>
                {formErrors.businessName && (
                  <p className="text-sm text-destructive">
                    {formErrors.businessName.message}
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
                    placeholder="********"
                    {...registerForm("password")}
                    onChange={(e) => {
                      registerForm("password").onChange(e);
                      clearError();
                    }}
                    className={`pl-10 pr-10 ${formErrors.password ? "border-destructive" : ""}`}
                    disabled={isLoading}
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
                {formErrors.password && (
                  <p className="text-sm text-destructive">
                    {formErrors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    {...registerForm("confirm_password")}
                    onChange={(e) => {
                      registerForm("confirm_password").onChange(e);
                      clearError();
                    }}
                    className={`pl-10 pr-10 ${formErrors.confirm_password ? "border-destructive" : ""}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {formErrors.confirm_password && (
                  <p className="text-sm text-destructive">
                    {formErrors.confirm_password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isValid}
              >
                {isLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Sending code...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Login link */}
        <div className="text-center text-sm text-muted-foreground">
          <span>Already have an account? </span>
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>

        {/* Info notice */}
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <h4 className="text-sm font-medium text-foreground mb-1">
            Owner registration only
          </h4>
          <p className="text-xs text-muted-foreground">
            This form is for business owners. Once registered, you can add
            managers and staff members from your dashboard settings.
          </p>
        </div>
      </div>
    </div>
  );
}
