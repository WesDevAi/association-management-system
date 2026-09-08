"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDocumentAction } from "@/server/services/document-actions";
import type { DocumentDetail } from "@/server/services/document-service";

interface DocumentDetailClientProps {
  document: DocumentDetail;
}

export function DocumentDetailClient({ document: doc }: DocumentDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this document?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("documentId", doc.id);
      const result = await deleteDocumentAction(formData);
      if (result && "error" in result) {
        setError(result.error);
      } else if (result && "success" in result) {
        router.push("/documents");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="sm" className="w-full">
          Open Document
        </Button>
      </a>
      <a href={doc.fileUrl} download className="w-full">
        <Button variant="outline" size="sm" className="w-full">
          Download
        </Button>
      </a>
      <Button
        variant="destructive"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
      >
        <Trash2 className="mr-1.5 size-4" />
        Delete
      </Button>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          {success}
        </p>
      )}
    </div>
  );
}
