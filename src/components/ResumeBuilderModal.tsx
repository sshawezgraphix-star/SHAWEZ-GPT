import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  Download,
  X,
  Briefcase,
  User,
  Mail,
  Phone,
  Code,
  CheckCircle,
  Loader2,
  Copy,
} from "lucide-react";
import { generateAndDownloadPDF } from "../services/pdfGenerator";

interface ResumeBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateResume: (prompt: string) => void;
}

export const ResumeBuilderModal: React.FC<ResumeBuilderModalProps> = ({
  isOpen,
  onClose,
  onGenerateResume,
}) => {
  const [fullName, setFullName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [resumeType, setResumeType] = useState<"ats_resume" | "cover_letter" | "executive_cv">("ats_resume");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleBuildPrompt = () => {
    let prompt = "";

    if (resumeType === "ats_resume") {
      prompt = `Please act as a Top Executive Career Coach and Resume Strategist. Create a modern, high-impact, ATS-optimized Professional Resume for the following candidate:

Name: ${fullName || "Shawez Khan"}
Target Job Title: ${targetRole || "Senior Full-Stack AI Engineer"}
Contact: ${email || "shawez@example.com"} | ${phone || "+91 9876543210"}
Core Technical & Professional Skills: ${skills || "React, TypeScript, Python, Node.js, AI Agents, Prompt Engineering, Docker"}
Key Work Experience & Achievements: ${experience || "Led full-stack architecture of AI chatbot superapp with multi-model routing, PDF generation, and mobile APK deployment."}
Education: ${education || "Bachelor of Technology in Computer Science"}

Formatting Guidelines:
1. Include a Compelling Professional Summary with quantifiable achievements.
2. Structured Sections: Professional Summary, Core Competencies, Professional Experience (with bullet points starting with strong action verbs), Education & Certifications, and Key Projects.
3. Clean markdown format with bold highlights.`;
    } else if (resumeType === "cover_letter") {
      prompt = `Please write a persuasive, high-converting, and tailored Professional Cover Letter for:
Name: ${fullName || "Shawez Khan"}
Target Position: ${targetRole || "Full Stack AI Developer"}
Candidate Background & Skills: ${skills || "React, Node.js, AI Models, System Architecture"}
Experience Highlights: ${experience || "Built production AI applications serving real-time streaming LLM endpoints."}

Tone: Confident, professional, modern, demonstrating strong value proposition and immediate impact.`;
    } else {
      prompt = `Create a comprehensive Executive CV for:
Name: ${fullName || "Shawez Khan"}
Executive Role: ${targetRole || "Chief Technology Officer / AI Architect"}
Executive Competencies: ${skills || "AI Strategy, Large Language Models, Distributed Systems, Team Leadership"}
Career Milestones: ${experience || "Architected enterprise AI pipelines, scaled infrastructure, led cross-functional engineering teams."}
Education: ${education || "Master / Bachelor in Computer Science & Information Technology"}`;
    }

    onGenerateResume(prompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Professional Resume & CV Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wider">
                  AI Powered
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate ATS-compliant Resumes, Cover Letters, and Export to PDF in 1-Click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
          {/* Document Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Document Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "ats_resume", label: "ATS Resume" },
                { id: "cover_letter", label: "Cover Letter" },
                { id: "executive_cv", label: "Executive CV" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setResumeType(t.id as any)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                    resumeType === t.id
                      ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Inputs: Name & Target Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Shawez Khan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Target Role / Job Title
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Grid Inputs: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  placeholder="e.g. yourname@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-xs sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Key Skills & Technologies (comma separated)
            </label>
            <div className="relative">
              <Code className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. React, TypeScript, Python, Node.js, AI Models, AWS, Docker"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Work Experience / Career Highlights
            </label>
            <textarea
              rows={3}
              placeholder="Paste brief points of your experience or previous companies (e.g. 2 years as Frontend Dev at Tech Corp, built responsive web apps...)"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-xs sm:text-sm resize-none"
            />
          </div>

          {/* Education */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Education / Degree
            </label>
            <input
              type="text"
              placeholder="e.g. B.Tech in Computer Science, University of Delhi (2020 - 2024)"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleBuildPrompt}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate ATS Resume Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
