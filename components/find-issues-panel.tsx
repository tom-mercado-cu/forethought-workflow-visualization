"use client";

import { analyzeWorkflow, WorkflowIssue } from "@/app/api/analyze";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { WorkflowData } from "@/lib/types";
import { AlertTriangle, CheckCircle, Info, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Drawer } from "vaul";

interface FindIssuesPanelProps {
  workflow: WorkflowData;
  onIssuesFound?: (nodeIds: string[]) => void;
}

const severityConfig = {
  error: {
    border: "border-l-red-500",
    badgeClass:
      "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
    Icon: AlertTriangle,
    iconClass: "text-red-500",
    label: "Error",
  },
  warning: {
    border: "border-l-yellow-500",
    badgeClass:
      "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-100",
    Icon: AlertTriangle,
    iconClass: "text-yellow-500",
    label: "Warning",
  },
  info: {
    border: "border-l-blue-500",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100",
    Icon: Info,
    iconClass: "text-blue-500",
    label: "Info",
  },
};

export function FindIssuesPanel({ workflow, onIssuesFound }: FindIssuesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [issues, setIssues] = useState<WorkflowIssue[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFindIssues = async () => {
    setIsOpen(true);
    if (issues !== null) return; // already analyzed, just reopen
    setIsLoading(true);
    try {
      const result = await analyzeWorkflow(workflow);
      setIssues(result);
      const allNodeIds = result.flatMap((i) => i.nodeIds);
      onIssuesFound?.(allNodeIds);
    } catch {
      toast.error("Failed to analyze workflow. Please try again.");
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const errorCount = issues?.filter((i) => i.severity === "error").length ?? 0;
  const warningCount =
    issues?.filter((i) => i.severity === "warning").length ?? 0;

  return (
    <>
      <Button variant="outline" onClick={handleFindIssues}>
        <Search className="mr-2 h-4 w-4" />
        Find Issues
        {issues !== null && errorCount + warningCount > 0 && (
          <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold">
            {errorCount + warningCount}
          </span>
        )}
      </Button>

      <Drawer.Root direction="right" open={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-[420px] bg-white shadow-xl outline-none"
            aria-describedby={undefined}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <div>
                <Drawer.Title className="font-semibold text-slate-900">
                  QA / PROD Issues
                </Drawer.Title>
                {issues !== null && !isLoading && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {issues.length === 0
                      ? "No issues found"
                      : `${issues.length} result${issues.length !== 1 ? "s" : ""}`}
                  </p>
                )}
              </div>
              <Drawer.Close asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </Drawer.Close>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <>
                  <Skeleton className="h-[88px] w-full rounded-lg" />
                  <Skeleton className="h-[88px] w-full rounded-lg" />
                  <Skeleton className="h-[72px] w-full rounded-lg" />
                </>
              ) : issues === null ? null : issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 gap-2">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">All clear</p>
                  <p className="text-xs text-slate-400">
                    No QA/PROD inconsistencies detected
                  </p>
                </div>
              ) : (
                issues.map((issue, i) => {
                  const config = severityConfig[issue.severity];
                  const { Icon } = config;
                  return (
                    <Card
                      key={i}
                      className={`p-4 border-l-4 ${config.border} space-y-2`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`h-4 w-4 shrink-0 ${config.iconClass}`}
                          />
                          <p className="font-semibold text-sm text-slate-900 truncate">
                            {issue.title}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 text-xs ${config.badgeClass}`}
                        >
                          {config.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-slate-600 leading-snug">
                        {issue.description}
                      </p>

                      {issue.splitCondition !== "N/A" && (
                        <p className="text-xs text-slate-400">
                          Split:{" "}
                          <span className="font-medium text-slate-500">
                            {issue.splitCondition}
                          </span>
                        </p>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}
