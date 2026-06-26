"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Landmark, Pencil, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/features/layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api, getApiError } from "@/lib/api";
import { bankingApi } from "../../banking/api/banking-api";
import { formatDate, maskEmail, maskPan, maskPhone } from "@/lib/format";
import { useAuth } from "../../auth/context/auth-context";

const menuItems = [
  "Basic Details",
  "Bank Details",
  "Reports",
  "Change Password",
  "Change Security PIN",
  "Trading controls",
  "Trading APIs",
  "Sell authorisation mode",
  "Trading Details",
  "Account Related Forms",
  "Nominee Details",
  "Active Devices",
  "Report suspicious activity"
];

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
  },
  bank: {
    accountHolderName: "",
    accountNumberMasked: "",
    ifsc: "",
    bankName: ""
  }
};

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState(blankProfile);
  const [activeSection, setActiveSection] = useState(searchParams.get("section") || "Basic Details");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bankForm, setBankForm] = useState({ accountHolderName: "", accountNumber: "", ifsc: "DEMO0000001" });

  const linkedAccounts = useQuery({
    queryKey: ["linked-bank-accounts"],
    queryFn: bankingApi.linkedAccounts,
    enabled: activeSection === "Bank Details"
  });

  const verifyBank = useMutation({
    mutationFn: bankingApi.verifyBank,
    onSuccess() {
      toast.success("Bank account added. Rs. 2 debit will be refunded soon.");
      setBankForm({ accountHolderName: "", accountNumber: "", ifsc: "DEMO0000001" });
      queryClient.invalidateQueries({ queryKey: ["linked-bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["banking-summary"] });
      queryClient.invalidateQueries({ queryKey: ["navbar-bank-notifications"] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  const removeBank = useMutation({
    mutationFn: bankingApi.removeAccount,
    onSuccess() {
      toast.success("Bank account removed from profile");
      queryClient.invalidateQueries({ queryKey: ["linked-bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["banking-summary"] });
    },
    onError(error) {
      toast.error(getApiError(error));
    }
  });

  useEffect(() => {
    const section = searchParams.get("section");
    if (section && menuItems.includes(section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

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
      ["Full Name", profile.fullName || "Not added", false],
      ["Date of Birth", formatDate(profile.dateOfBirth), false],
      ["Mobile Number", maskPhone(profile.mobileNumber), true],
      ["Email Address", maskEmail(profile.emailAddress), true],
      ["Marital Status", profile.maritalStatus || "Not added", true],
      ["Gender", profile.gender || "Not added", false],
      ["Income Range", profile.incomeRange || "Not added", true],
      ["Occupation", profile.occupation || "Not added", false],
      ["Father's Name", profile.fatherName || "Not added", true],
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
      toast.success("Profile updated");
    } catch (error) {
      toast.error(getApiError(error));
    }
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-72">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <Avatar size="lg" className="size-16 text-lg">
                  <AvatarFallback>{user?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold">{profile.fullName || user?.name || "Your Name"}</h2>
              </div>
              <Separator />
              <ScrollArea className="h-[min(60vh,480px)]">
                <nav className="flex flex-col gap-0.5 pr-3">
                  {menuItems.map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant={activeSection === item ? "secondary" : "ghost"}
                      className="h-auto w-full justify-between px-3 py-2.5 text-left font-normal"
                      onClick={() => setActiveSection(item)}
                    >
                      <span className="text-sm">{item}</span>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Button>
                  ))}
                </nav>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        <Card className="min-w-0 flex-1">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-xl">
                {activeSection === "Bank Details" ? "Bank Details" : "Personal Details"}
              </CardTitle>
              <CardDescription>
                {activeSection === "Bank Details"
                  ? "Add or remove verified dummy bank accounts"
                  : `PAN - ${maskPan(profile.pan)}`}
              </CardDescription>
            </div>
            {activeSection === "Basic Details" ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing((value) => !value)}>
                <Pencil className="size-4" />
                {editing ? "View" : "Edit details"}
              </Button>
            ) : null}
          </CardHeader>

          <CardContent>
            {activeSection === "Bank Details" ? (
              <div className="space-y-6">
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    verifyBank.mutate(bankForm);
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Account holder name</Label>
                      <Input
                        value={bankForm.accountHolderName}
                        onChange={(event) => setBankForm({ ...bankForm, accountHolderName: event.target.value })}
                        placeholder="Rahul Sharma"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account number</Label>
                      <Input
                        value={bankForm.accountNumber}
                        onChange={(event) => setBankForm({ ...bankForm, accountNumber: event.target.value })}
                        placeholder="100000000002"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC</Label>
                      <Input
                        value={bankForm.ifsc}
                        onChange={(event) => setBankForm({ ...bankForm, ifsc: event.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={verifyBank.isPending}>
                    {verifyBank.isPending ? "Adding..." : "Add bank and debit Rs. 2"}
                  </Button>
                </form>

                <Separator />

                <div className="space-y-3">
                  {(linkedAccounts.data || []).map((account) => (
                    <div
                      key={account.id}
                      className="flex items-start gap-4 rounded-lg border bg-muted/30 p-4"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Landmark className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-medium">{account.holderName}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.bankName || "Finboard Demo Bank"} / {account.accountNumber} / {account.ifsc}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Balance: Rs. {Number(account.balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => removeBank.mutate(account.id)}
                        disabled={removeBank.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                  {!linkedAccounts.data?.length ? (
                    <p className="text-sm text-muted-foreground">
                      No linked bank account yet. Add one using seeded dummy bank details.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : loading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-5 w-full max-w-md" />
                  </div>
                ))}
              </div>
            ) : editing ? (
              <form className="space-y-6" onSubmit={saveProfile}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Full name</Label>
                    <Input value={profile.fullName || ""} onChange={(event) => updateField("fullName", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of birth</Label>
                    <Input
                      type="date"
                      value={profile.dateOfBirth?.slice?.(0, 10) || ""}
                      onChange={(event) => updateField("dateOfBirth", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN</Label>
                    <Input
                      value={profile.pan || ""}
                      onChange={(event) => updateField("pan", event.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile number</Label>
                    <Input value={profile.mobileNumber || ""} onChange={(event) => updateField("mobileNumber", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile.emailAddress || ""} onChange={(event) => updateField("emailAddress", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Marital status</Label>
                    <Select value={profile.maritalStatus || ""} onValueChange={(value) => updateField("maritalStatus", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select</SelectItem>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={profile.gender || ""} onValueChange={(value) => updateField("gender", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Income range</Label>
                    <Select value={profile.incomeRange || ""} onValueChange={(value) => updateField("incomeRange", value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Select</SelectItem>
                        <SelectItem value="Below 1 Lac">Below 1 Lac</SelectItem>
                        <SelectItem value="1 Lac - 5 Lac">1 Lac - 5 Lac</SelectItem>
                        <SelectItem value="5 Lac - 10 Lac">5 Lac - 10 Lac</SelectItem>
                        <SelectItem value="10 Lac - 25 Lac">10 Lac - 25 Lac</SelectItem>
                        <SelectItem value="Above 25 Lac">Above 25 Lac</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Occupation</Label>
                    <Input value={profile.occupation || ""} onChange={(event) => updateField("occupation", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Father&apos;s name</Label>
                    <Input value={profile.fatherName || ""} onChange={(event) => updateField("fatherName", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address line 1</Label>
                    <Input value={profile.address?.line1 || ""} onChange={(event) => updateField("address.line1", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Address line 2</Label>
                    <Input value={profile.address?.line2 || ""} onChange={(event) => updateField("address.line2", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={profile.address?.city || ""} onChange={(event) => updateField("address.city", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input value={profile.address?.state || ""} onChange={(event) => updateField("address.state", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal code</Label>
                    <Input value={profile.address?.postalCode || ""} onChange={(event) => updateField("address.postalCode", event.target.value)} />
                  </div>
                </div>
                <Button type="submit">Save profile</Button>
              </form>
            ) : (
              <div className="divide-y">
                {displayRows.map(([label, value, editable]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="font-medium">{value}</p>
                    </div>
                    {editable ? <Pencil className="size-4 shrink-0 text-muted-foreground" /> : null}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
