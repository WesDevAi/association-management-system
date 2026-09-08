"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDocumentAction } from "@/server/services/document-actions";

interface CreateDocumentFormProps {
  branches: { id: string; name: string }[];
}

export function CreateDocumentForm({ branches }: CreateDocumentFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createDocumentAction(null, formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        router.push("/documents");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload Document</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Document title"
                minLength={2}
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Brief description of the document"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="fileUrl">File URL *</Label>
              <Input
                id="fileUrl"
                name="fileUrl"
                required
                placeholder="https://example.com/document.pdf"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL where the document is stored. File upload integration coming soon.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fileType">File Type</Label>
              <Input
                id="fileType"
                name="fileType"
                placeholder="e.g. application/pdf"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fileSizeBytes">File Size (bytes)</Label>
              <Input
                id="fileSizeBytes"
                name="fileSizeBytes"
                type="number"
                min={0}
                placeholder="Optional"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                required
                defaultValue="OTHER"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="CONSTITUTION">Constitution</option>
                <option value="MINUTES">Minutes</option>
                <option value="FINANCIAL_REPORT">Financial Report</option>
                <option value="POLICY">Policy</option>
                <option value="CERTIFICATE">Certificate</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="visibility">Visibility *</Label>
              <select
                id="visibility"
                name="visibility"
                required
                defaultValue="MEMBERS_ONLY"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="PUBLIC">Public</option>
                <option value="MEMBERS_ONLY">Members Only</option>
                <option value="EXECUTIVES_ONLY">Executives Only</option>
                <option value="ADMIN_ONLY">Admin Only</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branchId">Branch</Label>
              <select
                id="branchId"
                name="branchId"
                defaultValue=""
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Association-wide</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              <Upload className="mr-1.5 size-4" />
              {isPending ? "Uploading..." : "Upload Document"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/documents")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
