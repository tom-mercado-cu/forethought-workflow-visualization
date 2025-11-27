import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const { workflowId } = await params
  const token = request.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 401 })
  }

  try {
    const response = await fetch(
      `https://dashboard-api.forethought.ai/dashboard-controls/solve/v2/workflow-builder/${workflowId}`,
      {
        headers: {
          accept: "*/*",
          authorization: `Bearer ${token}`,
          "x-access-token": token,
          "content-type": "application/json",
        },
      },
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch workflow: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error fetching workflow:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch workflow" },
      { status: 500 },
    )
  }
}
