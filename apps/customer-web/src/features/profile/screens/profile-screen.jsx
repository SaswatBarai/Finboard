"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, UserRound } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { AppLayout } from "@/features/layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ThemeSelector } from "@/components/theme-selector";
import { api, getApiError } from "@/lib/api";
import { formatDate, maskEmail, maskPan, maskPhone } from "@/lib/format";
import { useAuth } from "../../auth/context/auth-context";

const blankProfile = {
  fullName: "",
  dateOfBirth: "",
  pan: "",
  mobileNumber: "",
  emailAddress: "",
  maritalStatus: "",
  gender: "",
  incomeRange: "",
  occupation: "",
  fatherName: "",
  motherName: "",
  address: {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India"
  }
};

function resolveTab(searchParams) {
  const tab = searchParams.get("tab");
  if (tab === "security") return "security";

  const section = searchParams.get("section");
  if (section === "Change Password" || section === "Change Security PIN") return "security";
  if (section === "Bank Details") return "personal";

  return "personal";
}

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState(blankProfile);
  const [activeTab, setActiveTab] = useState(() => resolveTab(searchParams));
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const changePassword = useMutation({
    mutationFn: (payload) => api.patch("/auth/change-password", payload),
    onSuccess() {
      toast.success("Password updated successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  useEffect(() => {
    const section = searchParams.get("section");
    if (section === "Bank Details") {
      router.replace("/banking");
      return;
    }
    setActiveTab(resolveTab(searchParams));
  }, [searchParams, router]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await api.get("/profile/me");
        setProfile({ ...blankProfile, ...response.data.profile });
      } catch (error) {
        toast.error(getApiError(error));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const displayRows = useMemo(
    () => [
      ["Full name", profile.fullName || "Not added", false],
      ["Date of birth", formatDate(profile.dateOfBirth), false],
      ["Mobile number", maskPhone(profile.mobileNumber), true],
      ["Email address", maskEmail(profile.emailAddress), true],
      ["Marital status", profile.maritalStatus || "Not added", true],
      ["Gender", profile.gender || "Not added", false],
      ["Income range", profile.incomeRange || "Not added", true],
      ["Occupation", profile.occupation || "Not added", false],
      ["Father's name", profile.fatherName || "Not added", true],
      [
        "Address",
        [profile.address?.line1, profile.address?.line2, profile.address?.city, profile.address?.state, profile.address?.postalCode]
          .filter(Boolean)
          .join(", ") || "Not added",
        false
      ]
    ],
    [profile]
  );

  function updateField(path, value) {
    setProfile((current) => {
      if (!path.includes(".")) {
        return { ...current, [path]: value };
      }

      const [parent, child] = path.split(".");
      return {
        ...current,
        [parent]: {
          ...current[parent],
          [child]: value
        }
      };
    });
  }

  async function saveProfile(event) {
    event.preventDefault();
    try {
      const response = await api.put("/profile/me", profile);
      setProfile({ ...blankProfile, ...response.data.profile });
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile-me"] });
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  function submitPasswordChange(event) {
    event.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    changePassword.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  }

  function switchTab(value) {
    setActiveTab(value);
    router.replace(value === "security" ? "/profile?tab=security" : "/profile", { scroll: false });
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-4 sm:space-y-6">
        <Card className="overflow-hidden border-border/80">
          <CardContent className="flex flex-col items-center gap-4 px-4 pt-5 pb-0 text-center sm:flex-row sm:items-center sm:px-6 sm:pt-6 sm:text-left">
            <Avatar className="size-16 shrink-0 text-lg ring-2 ring-border/60 sm:size-16">
              <AvatarFallback className="bg-primary/15 font-semibold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 w-full sm:w-auto">
              <Badge variant="secondary" className="mb-2 rounded-full text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
                Your account
              </Badge>
              <h1 className="text-lg font-bold tracking-tight sm:text-2xl">
                {profile.fullName || user?.name || "Your profile"}
              </h1>
              <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>

          <Tabs value={activeTab} onValueChange={switchTab}>
            <div className="border-t border-border/60 px-3 py-3 sm:px-6 sm:py-4">
              <ToggleGroup
                className="mx-auto w-full max-w-lg"
                spacing={0}
                value={[activeTab]}
                variant="outline"
                onValueChange={(values) => {
                  if (values[0]) switchTab(values[0]);
                }}
              >
                <ToggleGroupItem className="h-11 flex-1 gap-1.5 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm" value="personal">
                  <UserRound className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                  <span className="truncate">Personal</span>
                </ToggleGroupItem>
                <ToggleGroupItem className="h-11 flex-1 gap-1.5 px-2 text-xs sm:gap-2 sm:px-3 sm:text-sm" value="security">
                  <KeyRound className="size-3.5 shrink-0 sm:size-4" aria-hidden />
                  <span className="truncate">Security</span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

          <TabsContent value="personal" className="mt-0 border-t border-border/60 px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-lg font-semibold">Personal details</h2>
                  <p className="text-sm text-muted-foreground">PAN — {maskPan(profile.pan)}</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="h-10 w-full gap-1.5 sm:w-auto" onClick={() => setEditing((value) => !value)}>
                  <Pencil className="size-4" aria-hidden />
                  {editing ? "Cancel" : "Edit"}
                </Button>
              </div>
              <div>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-5 w-full max-w-md" />
                      </div>
                    ))}
                  </div>
                ) : editing ? (
                  <form className="space-y-6" onSubmit={saveProfile}>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field className="gap-1.5">
                        <FieldLabel>Full name</FieldLabel>
                        <Input value={profile.fullName || ""} onChange={(event) => updateField("fullName", event.target.value)} />
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>Date of birth</FieldLabel>
                        <Input
                          type="date"
                          value={profile.dateOfBirth?.slice?.(0, 10) || ""}
                          onChange={(event) => updateField("dateOfBirth", event.target.value)}
                        />
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>PAN</FieldLabel>
                        <Input
                          value={profile.pan || ""}
                          onChange={(event) => updateField("pan", event.target.value.toUpperCase())}
                          placeholder="ABCDE1234F"
                        />
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>Mobile number</FieldLabel>
                        <Input value={profile.mobileNumber || ""} onChange={(event) => updateField("mobileNumber", event.target.value)} />
                      </Field>
                      <Field className="gap-1.5 sm:col-span-2">
                        <FieldLabel>Email</FieldLabel>
                        <Input value={profile.emailAddress || ""} onChange={(event) => updateField("emailAddress", event.target.value)} />
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>Marital status</FieldLabel>
                        <Select value={profile.maritalStatus || ""} onValueChange={(value) => updateField("maritalStatus", value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Single">Single</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>Gender</FieldLabel>
                        <Select value={profile.gender || ""} onValueChange={(value) => updateField("gender", value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>Income range</FieldLabel>
                        <Select value={profile.incomeRange || ""} onValueChange={(value) => updateField("incomeRange", value)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Below 1 Lac">Below 1 Lac</SelectItem>
                            <SelectItem value="1 Lac - 5 Lac">1 Lac - 5 Lac</SelectItem>
                            <SelectItem value="5 Lac - 10 Lac">5 Lac - 10 Lac</SelectItem>
                            <SelectItem value="10 Lac - 25 Lac">10 Lac - 25 Lac</SelectItem>
                            <SelectItem value="Above 25 Lac">Above 25 Lac</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>Occupation</FieldLabel>
                        <Input value={profile.occupation || ""} onChange={(event) => updateField("occupation", event.target.value)} />
                      </Field>
                      <Field className="gap-1.5 sm:col-span-2">
                        <FieldLabel>Father&apos;s name</FieldLabel>
                        <Input value={profile.fatherName || ""} onChange={(event) => updateField("fatherName", event.target.value)} />
                      </Field>
                      <Field className="gap-1.5 sm:col-span-2">
                        <FieldLabel>Address line 1</FieldLabel>
                        <Input value={profile.address?.line1 || ""} onChange={(event) => updateField("address.line1", event.target.value)} />
                      </Field>
                      <Field className="gap-1.5 sm:col-span-2">
                        <FieldLabel>Address line 2</FieldLabel>
                        <Input value={profile.address?.line2 || ""} onChange={(event) => updateField("address.line2", event.target.value)} />
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>City</FieldLabel>
                        <Input value={profile.address?.city || ""} onChange={(event) => updateField("address.city", event.target.value)} />
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>State</FieldLabel>
                        <Input value={profile.address?.state || ""} onChange={(event) => updateField("address.state", event.target.value)} />
                      </Field>
                      <Field className="gap-1.5">
                        <FieldLabel>Postal code</FieldLabel>
                        <Input value={profile.address?.postalCode || ""} onChange={(event) => updateField("address.postalCode", event.target.value)} />
                      </Field>
                    </div>
                    <Button type="submit" className="h-11 w-full sm:w-auto">Save changes</Button>
                  </form>
                ) : (
                  <div className="divide-y">
                    {displayRows.map(([label, value, editable]) => (
                      <div key={label} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">{label}</p>
                          <p className="font-medium">{value}</p>
                        </div>
                        {editable ? <Pencil className="size-4 shrink-0 text-muted-foreground" aria-hidden /> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </TabsContent>

          <TabsContent value="security" className="mt-0 border-t border-border/60 px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-5 space-y-1">
                <h2 className="text-lg font-semibold">Change password</h2>
                <p className="text-sm text-muted-foreground">Update the password you use to sign in to Finboard.</p>
              </div>
              <form className="max-w-md space-y-4" onSubmit={submitPasswordChange}>
                  <Field className="gap-1.5">
                    <FieldLabel>Current password</FieldLabel>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })}
                    />
                  </Field>
                  <Field className="gap-1.5">
                    <FieldLabel>New password</FieldLabel>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                    />
                    <FieldDescription>At least 8 characters.</FieldDescription>
                  </Field>
                  <Field className="gap-1.5">
                    <FieldLabel>Confirm new password</FieldLabel>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                    />
                  </Field>
                  <Button type="submit" className="h-11 w-full sm:w-auto" disabled={changePassword.isPending}>
                    {changePassword.isPending ? "Updating…" : "Update password"}
                  </Button>
                </form>

              <div className="mt-10 max-w-md border-t border-border/60 pt-8">
                <div className="mb-4 space-y-1">
                  <h2 className="text-lg font-semibold">Appearance</h2>
                  <p className="text-sm text-muted-foreground">
                    Finboard opens in dark mode by default. Choose light, dark, or follow your device setting.
                  </p>
                </div>
                <ThemeSelector variant="toggle" />
              </div>
          </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AppLayout>
  );
}
