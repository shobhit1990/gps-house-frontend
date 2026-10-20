import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useLoginMutation } from "@/store/services/api";
import { useDispatch, useSelector } from "@/store/hooks";
import { setCredentials, selectIsAuthenticated } from "@/store/slices/authSlice";
import { Eye, EyeOff, Loader2, MapPin, Lock, User } from "lucide-react";
import { ENV } from "@/config/env";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [loginMutation, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.username.trim()) {
      setError("Username is required");
      return;
    }
    if (!formData.password) {
      setError("Password is required");
      return;
    }

    try {
      const result = await loginMutation({
        username: formData.username.trim(),
        password: formData.password,
      }).unwrap();

      const {
        accessToken,
        refreshToken,
        menus,
        userId,
        staffId,
        username,
        name,
        roleCode,
        roleName,
      } = result;

      const trimmedStaffId = String(staffId || "").trim();
      const trimmedUserId = String(userId || "").trim();
      const rawPartyId = String(trimmedStaffId || trimmedUserId || "").trim();

      dispatch(
        setCredentials({
          user: {
            id: Number(trimmedUserId) || 1,
            authUserId: rawPartyId || undefined,
            staffId: trimmedStaffId || undefined,
            username: username || formData.username,
            name: name || username,
            role: roleCode,
            roleName: roleName || roleCode,
          },
          token: accessToken,
          refreshToken,
          menus: (menus as never[]) || [],
        })
      );

      toast({
        title: "Login Successful",
        description: `Welcome back, ${name || formData.username}!`,
        duration: 3000,
      });

      setTimeout(() => navigate("/dashboard", { replace: true }), 500);
    } catch (err: unknown) {
      const e = err as {
        status?: number | string;
        data?: { message?: string };
        message?: string;
      };
      let errorMessage = "Invalid username or password. Please try again.";
      if (e?.status === 401) {
        errorMessage = "Invalid credentials. Please check your username and password.";
      } else if (e?.status === 403) {
        errorMessage = "Access denied. Your account may be disabled.";
      } else if (e?.status === "FETCH_ERROR") {
        errorMessage = "Cannot connect to server. Please check your internet connection.";
      } else if (e?.data?.message) {
        errorMessage = e.data.message;
      } else if (e?.message) {
        errorMessage = e.message;
      }
      setError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-elegant">
            <MapPin className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{ENV.APP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to continue</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-elegant">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="username"
                  className="pl-10"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, username: e.target.value }))
                  }
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="pl-10 pr-10"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
