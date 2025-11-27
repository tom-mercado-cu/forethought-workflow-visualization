"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WorkflowFormProps {
  onSubmit: (token: string, workflowId: string) => void
  loading: boolean
}

export function WorkflowForm({ onSubmit, loading }: WorkflowFormProps) {
  const [token, setToken] = useState("")
  const [workflowId, setWorkflowId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (token && workflowId) {
      onSubmit(token, workflowId)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Workflow Visualizer</CardTitle>
        <CardDescription>
          Enter your API token and workflow ID to visualize your chatbot flow as an interactive decision tree
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">API Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="Bearer token..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workflowId">Workflow ID</Label>
            <Input
              id="workflowId"
              placeholder="e.g., 12345678-abcd-1234-abcd-123456789012"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : "Load Workflow"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
