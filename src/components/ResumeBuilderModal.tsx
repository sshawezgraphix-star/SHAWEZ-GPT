import React, { useState, useRef } from "react";
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
  Eye,
  Edit3,
  Award,
  BookOpen,
} from "lucide-react";
import { exportElementToVisualPDF } from "../services/visualPdfExporter";
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
  const [fullName, setFullName] = useState("Shawez Khan");
  const [targetRole, setTargetRole] = useState("Senior Full-Stack AI Engineer");
  const [email, setEmail] = useState("shawez.dev@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [location, setLocation] = useState("New Delhi, India");
  const [summary, setSummary] = useState(
    "Innovative Software Engineer & AI Architect with 4+ years of experience architecting high-scale LLM applications, multimodal vision engines, and distributed microservices. Proven track record in zero-latency streaming and intuitive UI engineering."
  );
  const [skills, setSkills] = useState("React 19, TypeScript, Python, Node.js, Next.js, LLM Orchestration, Docker, Tailwind CSS, PostgreSQL, Git");
  const [experience, setExperience] = useState(
    "Lead AI Developer - ShawezGPT (2024 - Present)\n• Designed and deployed multi-model autonomous LLM superapp with instant zero-delay failover.\n• Engineered high-performance visual document rendering engine exporting 300 DPI vector PDFs.\n• Reduced latency by 65% through client-side stream optimization and dynamic caching.\n\nFull-Stack Engineer - Cloud Matrix Solutions (2022 - 2024)\n• Built responsive web platforms and real-time collaborative workspaces serving 50k+ daily users.\n• Implemented secure JWT & OAuth2 authorization boundaries and robust REST APIs."
  );
  const [education, setEducation] = useState("Bachelor of Technology (B.Tech) in Computer Science & Engineering\nDr. A.P.J. Abdul Kalam Technical University (2018 - 2022)");
  
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("preview");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExportVisualPDF = async () => {
    setIsExporting(true);
    try {
      await exportElementToVisualPDF({
        elementId: "visual-resume-canvas",
        filename: `${fullName.replace(/\s+/g, "_")}_Executive_Resume.pdf`,
        quality: 2,
      });
    } catch (e) {
      console.warn("Visual export fallback to standard PDF:", e);
      generateAndDownloadPDF({
        title: `${fullName} - ${targetRole}`,
        subtitle: `${email} | ${phone} | ${location}`,
        content: `## Professional Summary\n${summary}\n\n## Core Skills\n${skills}\n\n## Professional Experience\n${experience}\n\n## Education\n${education}`,
        theme: "emerald",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendToAI = () => {
    const prompt = `Please act as a World-Class Executive Career Strategist and refine this resume to perfection for top-tier tech roles:

Candidate Name: ${fullName}
Target Role: ${targetRole}
Contact: ${email} | ${phone} | ${location}
Professional Summary: ${summary}
Core Technical Skills: ${skills}
Work Experience:
${experience}
Education:
${education}

Output Requirements:
1. Polish bullet points with high-impact quantifiable metrics and strong action verbs (Architected, Engineered, Optimized, Spearheaded).
2. Ensure strict ATS compatibility and modern executive tone.
3. Provide a complete, structured Markdown deliverable ready for instant PDF download.`;

    onGenerateResume(prompt);
    onClose();
  };

  const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Executive Resume Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold uppercase tracking-wider">
                  Magazine Grade
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Pixel-Perfect 2-Column Designer Layouts with Instant 300 DPI PDF Export
              </p>
            </div>
          </div>

          {/* Mode Switcher & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "edit"
                    ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeTab === "preview"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Live Designer Preview</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 sm:p-6">
          {activeTab === "edit" ? (
            /* Form Fields */
            <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Role / Job Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Executive Summary
                </label>
                <textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Core Skills & Technologies
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Experience & Key Accomplishments
                </label>
                <textarea
                  rows={6}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Education & Qualifications
                </label>
                <textarea
                  rows={2}
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ) : (
            /* Live Designer Resume Canvas (Pixel-Perfect 2-Column Template) */
            <div className="flex justify-center">
              <div
                id="visual-resume-canvas"
                className="w-full max-w-[800px] min-h-[1050px] bg-white text-slate-900 shadow-2xl rounded-sm overflow-hidden p-8 sm:p-10 font-sans border border-slate-200"
                style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
              >
                {/* Header Banner */}
                <div className="border-b-2 border-emerald-600 pb-6 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
                        {fullName}
                      </h1>
                      <p className="text-emerald-700 font-bold text-base mt-1 tracking-wide uppercase">
                        {targetRole}
                      </p>
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                      {fullName.slice(0, 2).toUpperCase()}
                    </div>
                  </div>

                  {/* Contact Badges */}
                  <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      {email}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {phone}
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md">
                      {location}
                    </span>
                  </div>
                </div>

                {/* 2-Column Body */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Left Column (Skills, Education) */}
                  <div className="space-y-6">
                    {/* Skills Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-3 flex items-center gap-2">
                        <Code className="w-4 h-4 text-emerald-600" />
                        Core Competencies
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {skillList.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Education */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-3 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        Education
                      </h3>
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {education}
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Summary & Experience) */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Executive Summary */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-2.5 flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-600" />
                        Executive Profile
                      </h3>
                      <p className="text-xs leading-relaxed text-slate-700 text-justify">
                        {summary}
                      </p>
                    </div>

                    {/* Work Experience */}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-emerald-600" />
                        Professional Experience
                      </h3>
                      <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap space-y-2">
                        {experience}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Watermark */}
                <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Verified Professional Portfolio</span>
                  <span>Generated by ShawezGPT AI Studio</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendToAI}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Polish with Claude/GPT-4o</span>
            </button>

            <button
              onClick={handleExportVisualPDF}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? "Exporting 300 DPI PDF..." : "Download Designer PDF"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
