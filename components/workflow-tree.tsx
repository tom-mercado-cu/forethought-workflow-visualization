"use client";

import type React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Step, StepType, Transition, WorkflowData } from "@/lib/types";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface WorkflowTreeProps {
  workflow: WorkflowData;
}

interface TreeNode {
  id: string;
  step: Step;
  label: string;
  description: string;
  children: TreeNode[];
  level: number;
  x: number;
  y: number;
  edgeLabel?: string;
}

export function WorkflowTree({ workflow }: WorkflowTreeProps) {
  const [treeData, setTreeData] = useState<TreeNode | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [treeBounds, setTreeBounds] = useState({
    minX: 0,
    maxX: 5000,
    minY: 0,
    maxY: 5000,
  });

  useEffect(() => {
    const { canvas } = workflow;
    const { entry_step_id, step_map } = canvas;

    const buildTree = (
      stepId: string,
      level = 0,
      visited = new Set<string>(),
      edgeLabel?: string
    ): TreeNode | null => {
      if (visited.has(stepId) || !step_map[stepId]) return null;
      visited.add(stepId);

      const step = step_map[stepId];

      let label = stepId.substring(0, 8);
      let description = "";

      if (step.step_fields.condition_name) {
        label = step.step_fields.condition_name;
      } else if (step.step_fields.message) {
        const msg = step.step_fields.message;
        label = msg.length > 50 ? msg.substring(0, 50) + "..." : msg;
      } else if (step.step_fields.prompt) {
        label = step.step_fields.prompt.substring(0, 50);
      } else if (step.step_fields.url) {
        try {
          const url = new URL(step.step_fields.url);
          label = url.pathname.split("/").pop() || "API Call";
          description = step.step_fields.method || "GET";
        } catch {
          label = "API Call";
        }
      } else if (step.step_fields.intent_workflow_id) {
        label = "Trigger Workflow";
        description = step.step_fields.intent_workflow_id.substring(0, 12);
      }

      const children: TreeNode[] = [];
      step.transitions.forEach((transition, idx) => {
        const childEdgeLabel = transition.condition_expression
          ? getConditionLabel(transition.condition_expression)
          : idx === step.transitions.length - 1
          ? "else"
          : "";

        const child = buildTree(
          transition.step_id,
          level + 1,
          new Set(visited),
          childEdgeLabel
        );
        if (child) {
          children.push(child);
        }
      });

      return {
        id: stepId,
        step,
        label,
        description,
        children,
        level,
        x: 0,
        y: 0,
        edgeLabel,
      };
    };

    const calculatePositions = (
      node: TreeNode,
      x = 0,
      y = 0
    ): { node: TreeNode; width: number } => {
      const nodeWidth = 280;
      const nodeHeight = 120;
      const horizontalSpacing = 40;
      const verticalSpacing = 60;

      node.y = y;

      if (node.children.length === 0) {
        node.x = x;
        return { node, width: nodeWidth };
      }

      let currentX = x;
      let totalWidth = 0;

      const updatedChildren = node.children.map((child) => {
        const result = calculatePositions(
          child,
          currentX,
          y + nodeHeight + verticalSpacing
        );
        currentX += result.width + horizontalSpacing;
        totalWidth += result.width + horizontalSpacing;
        return result.node;
      });

      totalWidth -= horizontalSpacing;

      node.children = updatedChildren;
      node.x = x + totalWidth / 2 - nodeWidth / 2;

      return { node, width: Math.max(totalWidth, nodeWidth) };
    };

    const getTreeBounds = (
      node: TreeNode,
      bounds = {
        minX: Number.POSITIVE_INFINITY,
        maxX: Number.NEGATIVE_INFINITY,
        minY: Number.POSITIVE_INFINITY,
        maxY: Number.NEGATIVE_INFINITY,
      }
    ) => {
      bounds.minX = Math.min(bounds.minX, node.x);
      bounds.maxX = Math.max(bounds.maxX, node.x + 280);
      bounds.minY = Math.min(bounds.minY, node.y);
      bounds.maxY = Math.max(bounds.maxY, node.y + 120);

      node.children.forEach((child) => getTreeBounds(child, bounds));
      return bounds;
    };

    const tree = buildTree(entry_step_id);

    if (tree) {
      const { node } = calculatePositions(tree);
      const bounds = getTreeBounds(node);
      setTreeBounds(bounds);
      setTreeData(node);

      setTimeout(() => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth;

          const newOffset = {
            x: containerWidth / 2 - (node.x + 140),
            y: 50,
          };

          setOffset(newOffset);
        }
      }, 100);
    }
  }, [workflow]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY * -0.001;
    const newScale = Math.min(Math.max(scale + delta, 0.3), 2);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const worldX = (mouseX - offset.x) / scale;
      const worldY = (mouseY - offset.y) / scale;

      const newOffset = {
        x: mouseX - worldX * newScale,
        y: mouseY - worldY * newScale,
      };

      setScale(newScale);
      setOffset(newOffset);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.3));
  };

  const handleReset = () => {
    setScale(1);
    if (containerRef.current && treeData) {
      const containerWidth = containerRef.current.clientWidth;

      setOffset({
        x: containerWidth / 2 - (treeData.x + 140),
        y: 50,
      });
    }
  };

  const renderConnections = (node: TreeNode): React.ReactNode[] => {
    const connections: React.ReactNode[] = [];

    node.children.forEach((child) => {
      const startX = node.x + 140;
      const startY = node.y + 100;

      const endX = child.x + 140;
      const endY = child.y;

      const midY = (startY + endY) / 2;

      connections.push(
        <g key={`${node.id}-${child.id}`}>
          <path
            d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
            fill="none"
            stroke="#64748b"
            strokeWidth="2"
          />
          <polygon
            points={`${endX},${endY} ${endX - 6},${endY - 10} ${endX + 6},${
              endY - 10
            }`}
            fill="#64748b"
          />
          {child.edgeLabel && (
            <text
              x={(startX + endX) / 2}
              y={midY - 5}
              textAnchor="middle"
              className="text-xs font-semibold fill-slate-700"
              style={{ fontSize: "11px" }}
            >
              {child.edgeLabel}
            </text>
          )}
        </g>
      );

      connections.push(...renderConnections(child));
    });

    return connections;
  };

  const renderNodes = (node: TreeNode): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];

    const getStepColor = (type: string) => {
      switch (type) {
        case "condition":
          return "bg-amber-50 border-amber-300 hover:border-amber-400";
        case "message":
          return "bg-blue-50 border-blue-300 hover:border-blue-400";
        case "api_call":
          return "bg-purple-50 border-purple-300 hover:border-purple-400";
        case "trigger_workflow":
          return "bg-green-50 border-green-300 hover:border-green-400";
        case "prompt_button":
          return "bg-pink-50 border-pink-300 hover:border-pink-400";
        case "dynamic_list":
          return "bg-indigo-50 border-indigo-300 hover:border-indigo-400";
        default:
          return "bg-gray-50 border-gray-300 hover:border-gray-400";
      }
    };

    const getStepIcon = (type: StepType) => {
      switch (type) {
        case "condition":
          return "◆";
        case "text_message":
          return "💬";
        case "flamethrower_api_call":
          return "🔌";
        case "go_to_intent":
          return "🔄";
        case "buttons":
          return "🔘";
        case "dynamic_card":
          return "📋";
        case "unknown":
          return "●";
        default:
          return "●";
      }
    };

    nodes.push(
      <div
        key={node.id}
        style={{
          position: "absolute",
          left: node.x,
          top: node.y,
          width: "280px",
        }}
        onClick={() =>
          setSelectedNode(selectedNode === node.id ? null : node.id)
        }
      >
        <Card
          className={`p-4 border-2 transition-all cursor-pointer ${getStepColor(
            node.step.step_type
          )} ${
            selectedNode === node.id ? "ring-2 ring-offset-2 ring-blue-500" : ""
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-2xl">{getStepIcon(node.step.step_type)}</span>
            <div className="flex-1 min-w-0">
              <Badge variant="secondary" className="mb-2 text-xs">
                {node.step.step_type}
              </Badge>
              <div className="text-sm font-semibold break-words mb-1">
                {node.label}
              </div>
              {node.description && (
                <div className="text-xs text-muted-foreground break-words">
                  {node.description}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    );

    node.children.forEach((child) => {
      nodes.push(...renderNodes(child));
    });

    return nodes;
  };

  if (!treeData) {
    return (
      <div className="flex items-center justify-center h-96">
        Loading tree...
      </div>
    );
  }

  const svgWidth = treeBounds.maxX - treeBounds.minX + 500;
  const svgHeight = treeBounds.maxY - treeBounds.minY + 500;

  return (
    <div className="relative w-full h-full border rounded-lg bg-slate-50 overflow-hidden">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button size="sm" variant="secondary" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleReset}>
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            position: "relative",
            width: `${svgWidth}px`,
            height: `${svgHeight}px`,
          }}
        >
          <svg
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: `${svgWidth}px`,
              height: `${svgHeight}px`,
              pointerEvents: "none",
            }}
          >
            {treeData && renderConnections(treeData)}
          </svg>

          {treeData && renderNodes(treeData)}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-slate-600 shadow-sm">
        Drag to pan, use controls to zoom, click nodes for details
      </div>
    </div>
  );
}

function getConditionLabel(
  condition: Transition["condition_expression"]
): string {
  if (!condition) return "";

  if (condition.expressions && condition.expressions.length > 0) {
    const labels = condition.expressions
      .map((exp) => {
        const field = exp.field?.split(".").pop() || "";
        const operator =
          exp.operator === "eq"
            ? "="
            : exp.operator === "contains"
            ? "⊃"
            : exp.operator;
        const value = exp.values?.[0]?.toString() || "";
        return `${field}${operator}${value}`;
      })
      .join(` ${condition.operator === "and" ? "&" : "|"} `);
    return labels.length > 25 ? labels.substring(0, 25) + "..." : labels;
  }

  if (condition.field) {
    const field = condition.field.split(".").pop() || "";
    const operator =
      condition.operator === "eq"
        ? "="
        : condition.operator === "contains"
        ? "⊃"
        : condition.operator;
    const value = condition.values?.[0]?.toString() || "";
    return `${field}${operator}${value}`;
  }

  return "true";
}
