import React from "react";
import {
  BarChart3,
  Bug,
  Code2,
  Cpu,
  FileDown,
  FileSpreadsheet,
  Globe,
  ImageIcon,
  Layout,
  PenTool,
  Search,
  Sparkles,
} from "lucide-react";
import { OrchestratorCapability } from "../../types";

interface CapabilityBadgeProps {
  capability: OrchestratorCapability;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export const CapabilityBadge: React.FC<CapabilityBadgeProps> = ({
  capability,
  size = "sm",
  showLabel = true,
}) => {
  const getInfo = () => {
    switch (capability) {
      case "coding":
        return {
          label: "Coding",
          icon: Code2,
          bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
          text: "text-emerald-700 dark:text-emerald-300",
          border: "border-emerald-500/20",
        };
      case "code_analysis_debugging":
        return {
          label: "Code Analysis & Debugging",
          icon: Bug,
          bg: "bg-rose-500/10 dark:bg-rose-500/15",
          text: "text-rose-700 dark:text-rose-300",
          border: "border-rose-500/20",
        };
      case "research":
        return {
          label: "Research",
          icon: Search,
          bg: "bg-blue-500/10 dark:bg-blue-500/15",
          text: "text-blue-700 dark:text-blue-300",
          border: "border-blue-500/20",
        };
      case "web_search":
        return {
          label: "Web Search",
          icon: Globe,
          bg: "bg-teal-500/10 dark:bg-teal-500/15",
          text: "text-teal-700 dark:text-teal-300",
          border: "border-teal-500/20",
        };
      case "file_analysis":
        return {
          label: "File Analysis",
          icon: FileSpreadsheet,
          bg: "bg-amber-500/10 dark:bg-amber-500/15",
          text: "text-amber-700 dark:text-amber-300",
          border: "border-amber-500/20",
        };
      case "pdf_doc_generation":
        return {
          label: "PDF & Doc Generation",
          icon: FileDown,
          bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
          text: "text-indigo-700 dark:text-indigo-300",
          border: "border-indigo-500/20",
        };
      case "data_analysis":
        return {
          label: "Data Analysis",
          icon: BarChart3,
          bg: "bg-purple-500/10 dark:bg-purple-500/15",
          text: "text-purple-700 dark:text-purple-300",
          border: "border-purple-500/20",
        };
      case "writing":
        return {
          label: "Writing",
          icon: PenTool,
          bg: "bg-sky-500/10 dark:bg-sky-500/15",
          text: "text-sky-700 dark:text-sky-300",
          border: "border-sky-500/20",
        };
      case "ui_website_generation":
        return {
          label: "UI / Website",
          icon: Layout,
          bg: "bg-fuchsia-500/10 dark:bg-fuchsia-500/15",
          text: "text-fuchsia-700 dark:text-fuchsia-300",
          border: "border-fuchsia-500/20",
        };
      case "image_understanding":
        return {
          label: "Image Vision",
          icon: ImageIcon,
          bg: "bg-orange-500/10 dark:bg-orange-500/15",
          text: "text-orange-700 dark:text-orange-300",
          border: "border-orange-500/20",
        };
      default:
        return {
          label: "General AI",
          icon: Sparkles,
          bg: "bg-slate-500/10 dark:bg-slate-500/15",
          text: "text-slate-700 dark:text-slate-300",
          border: "border-slate-500/20",
        };
    }
  };

  const info = getInfo();
  const Icon = info.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-lg border ${info.bg} ${info.text} ${info.border} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
      title={`Specialized Capability: ${info.label}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3 shrink-0" : "w-3.5 h-3.5 shrink-0"} />
      {showLabel && <span className="truncate">{info.label}</span>}
    </span>
  );
};
