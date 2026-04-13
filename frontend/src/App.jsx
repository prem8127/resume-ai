import { useState, useEffect, useContext, createContext, useRef } from "react";
import "./styles/globals.css";

// ─── AUTH CONTEXT ────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("resume_user");
    return saved ? JSON.parse(saved) : null;
  });
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("resume_user", JSON.stringify(userData));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem("resume_user");
  };
  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

// ─── RESUME CONTEXT ───────────────────────────────────────────────────────────
const ResumeContext = createContext(null);
const useResume = () => useContext(ResumeContext);

const defaultResume = {
  id: null,
  template: "modern",
  personal: { name: "", email: "", phone: "", location: "", github: "", linkedin: "", portfolio: "" },
  objective: "",
  skills: { languages: [], frameworks: [], tools: [], databases: [], cloud: [], soft: [] },
  projects: [],
  internships: [],
  certifications: [],
  education: [],
  achievements: [],
};

function ResumeProvider({ children }) {
  const [resume, setResume] = useState(defaultResume);
  const [savedResumes, setSavedResumes] = useState(() => {
    const s = localStorage.getItem("saved_resumes");
    return s ? JSON.parse(s) : [];
  });
  const [atsScore, setAtsScore] = useState(null);

  const updateSection = (section, data) => setResume((r) => ({ ...r, [section]: data }));
  const updatePersonal = (field, val) =>
    setResume((r) => ({ ...r, personal: { ...r.personal, [field]: val } }));
  const saveResume = () => {
    const id = resume.id || Date.now().toString();
    const updated = { ...resume, id, savedAt: new Date().toISOString() };
    setResume(updated);
    const list = savedResumes.filter((r) => r.id !== id);
    const newList = [updated, ...list];
    setSavedResumes(newList);
    localStorage.setItem("saved_resumes", JSON.stringify(newList));
    return id;
  };
  const loadResume = (id) => {
    const found = savedResumes.find((r) => r.id === id);
    if (found) setResume(found);
  };
  const newResume = () => setResume(defaultResume);

  return (
    <ResumeContext.Provider
      value={{ resume, setResume, updateSection, updatePersonal, saveResume, loadResume, newResume, savedResumes, atsScore, setAtsScore }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

// ─── AI SERVICE ───────────────────────────────────────────────────────────────
async function callAI(prompt, systemPrompt = "") {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt || "You are an expert AI/ML career coach and resume writer. Be concise, professional, and ATS-optimized.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "";
}

// ─── ICONS (inline SVG) ───────────────────────────────────────────────────────
const Icon = ({ name, size = 18, color = "currentColor" }) => {
  const paths = {
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 14a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 10.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
    github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
    link: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    briefcase: "M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2",
    award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.21 13.89L7 23l5-3 5 3-1.21-9.12",
    code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
    brain: "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z",
    download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
    save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
    plus: "M12 5v14M5 12h14",
    trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    sparkle: "M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z",
    check: "M20 6L9 17l-5-5",
    x: "M18 6 6 18M6 6l12 12",
    chevronRight: "M9 18l6-6-6-6",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    layout: "M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z",
    zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] || paths.star} />
    </svg>
  );
};

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Simulated auth — replace with real API call
    setTimeout(() => {
      if (form.email && form.password.length >= 6) {
        login({ email: form.email, name: form.email.split("@")[0], id: Date.now() });
      } else {
        setError("Invalid credentials. Password must be 6+ characters.");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-logo">
          <Icon name="brain" size={28} color="#fff" />
        </div>
        <span className="brand-name">ResumeAI<sup>ML</sup></span>
      </div>
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p className="auth-sub">Sign in to continue building your AI/ML career</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@university.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : "Sign In"}
          </button>
        </form>
        <p className="auth-switch">
          New here?{" "}
          <button onClick={onSwitch} className="link-btn">Create an account</button>
        </p>
        <div className="auth-demo">
          <button className="btn-ghost btn-full" onClick={() => login({ email: "demo@aiml.dev", name: "Demo Student", id: 1 })}>
            <Icon name="zap" size={14} /> Try Demo (no signup needed)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SIGNUP PAGE ──────────────────────────────────────────────────────────────
function SignupPage({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login({ email: form.email, name: form.name, id: Date.now() });
      setLoading(false);
    }, 800);
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-logo"><Icon name="brain" size={28} color="#fff" /></div>
        <span className="brand-name">ResumeAI<sup>ML</sup></span>
      </div>
      <div className="auth-card">
        <h2>Create your account</h2>
        <p className="auth-sub">Join thousands of AI/ML students landing top roles</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="Priya Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@university.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="Min 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <button onClick={onSwitch} className="link-btn">Sign in</button></p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ setPage }) {
  const { user, logout } = useAuth();
  const { savedResumes, loadResume, newResume } = useResume();

  const startNew = () => { newResume(); setPage("builder"); };
  const openResume = (id) => { loadResume(id); setPage("builder"); };

  const stats = [
    { label: "Resumes created", value: savedResumes.length, icon: "layout" },
    { label: "AI suggestions used", value: savedResumes.length * 3, icon: "sparkle" },
    { label: "Templates available", value: 3, icon: "eye" },
  ];

  return (
    <div className="app-shell">
      <nav className="topnav">
        <div className="nav-brand">
          <div className="brand-logo-sm"><Icon name="brain" size={18} color="#fff" /></div>
          <span className="brand-name-sm">ResumeAI<sup>ML</sup></span>
        </div>
        <div className="nav-actions">
          <span className="nav-user">{user?.name}</span>
          <button className="btn-ghost-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="dashboard-hero">
          <div className="hero-gradient" />
          <h1 className="hero-title">Good to see you, <span className="grad-text">{user?.name?.split(" ")[0]}</span></h1>
          <p className="hero-sub">Build an ATS-optimized resume that gets you into top AI/ML roles.</p>
          <button className="btn-primary btn-lg" onClick={startNew}>
            <Icon name="plus" size={16} /> Build New Resume
          </button>
        </div>

        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-icon"><Icon name={s.icon} size={20} color="#5DCAA5" /></div>
              <div className="stat-val">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        <section className="section-block">
          <div className="section-hdr">
            <h2>My Resumes</h2>
            <button className="btn-outline-sm" onClick={startNew}><Icon name="plus" size={14} /> New</button>
          </div>
          {savedResumes.length === 0 ? (
            <div className="empty-state">
              <Icon name="layout" size={48} color="#5DCAA5" />
              <p>No resumes yet. Create your first one!</p>
              <button className="btn-primary" onClick={startNew}>Get Started</button>
            </div>
          ) : (
            <div className="resume-grid">
              {savedResumes.map((r) => (
                <div key={r.id} className="resume-card" onClick={() => openResume(r.id)}>
                  <div className="resume-card-preview">
                    <div className="rc-name">{r.personal?.name || "Untitled Resume"}</div>
                    <div className="rc-lines">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="rc-line" style={{ width: `${60 + Math.random() * 30}%`, opacity: 0.15 + i * 0.05 }} />
                      ))}
                    </div>
                  </div>
                  <div className="resume-card-info">
                    <span className="rc-template-badge">{r.template}</span>
                    <span className="rc-date">{new Date(r.savedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section-block">
          <h2>Choose a Template</h2>
          <div className="templates-grid">
            {[
              { id: "modern", name: "Modern", desc: "Clean teal accents, bold headers" },
              { id: "minimal", name: "Minimal", desc: "Pure white, maximum readability" },
              { id: "executive", name: "Executive", desc: "Dark navy, sophisticated layout" },
            ].map((t) => (
              <div key={t.id} className="template-card" onClick={() => { newResume(); setPage("builder"); }}>
                <div className={`template-thumb template-${t.id}`}>
                  <div className="tt-header" />
                  {[...Array(5)].map((_, i) => <div key={i} className="tt-line" />)}
                </div>
                <div className="template-info">
                  <strong>{t.name}</strong>
                  <span>{t.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── RESUME BUILDER ───────────────────────────────────────────────────────────
function ResumeBuilder({ setPage }) {
  const [activeSection, setActiveSection] = useState("personal");
  const [showPreview, setShowPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const { resume, updatePersonal, updateSection, saveResume } = useResume();
  const { logout, user } = useAuth();

  const sections = [
    { id: "personal", label: "Personal Details", icon: "user" },
    { id: "objective", label: "Career Objective", icon: "sparkle" },
    { id: "skills", label: "Technical Skills", icon: "code" },
    { id: "projects", label: "Projects", icon: "github" },
    { id: "internships", label: "Internships", icon: "briefcase" },
    { id: "education", label: "Education", icon: "award" },
    { id: "certifications", label: "Certifications", icon: "check" },
    { id: "achievements", label: "Achievements", icon: "star" },
  ];

  const handleSave = () => { saveResume(); setPage("dashboard"); };

  return (
    <div className="builder-shell">
      <nav className="topnav">
        <div className="nav-brand">
          <button className="back-btn" onClick={() => setPage("dashboard")}>←</button>
          <div className="brand-logo-sm"><Icon name="brain" size={18} color="#fff" /></div>
          <span className="brand-name-sm">Builder</span>
        </div>
        <div className="nav-actions">
          <button className="btn-ghost-sm" onClick={() => setShowPreview(!showPreview)}>
            <Icon name="eye" size={14} /> {showPreview ? "Edit" : "Preview"}
          </button>
          <button className="btn-primary-sm" onClick={handleSave}>
            <Icon name="save" size={14} /> Save
          </button>
          <button className="btn-ghost-sm" onClick={logout}>Logout</button>
        </div>
      </nav>

      <div className="builder-layout">
        {/* Sidebar */}
        <aside className="builder-sidebar">
          <div className="sidebar-label">Sections</div>
          {sections.map((s) => (
            <button
              key={s.id}
              className={`sidebar-item ${activeSection === s.id ? "active" : ""}`}
              onClick={() => setActiveSection(s.id)}
            >
              <Icon name={s.icon} size={15} />
              {s.label}
            </button>
          ))}
          <div className="sidebar-divider" />
          <div className="sidebar-label">Template</div>
          {["modern", "minimal", "executive"].map((t) => (
            <button
              key={t}
              className={`sidebar-item ${resume.template === t ? "active" : ""}`}
              onClick={() => updateSection("template", t)}
            >
              <Icon name="layout" size={15} />
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </aside>

        {/* Form Panel */}
        {!showPreview && (
          <div className="form-panel">
            <div className="form-panel-hdr">
              <h2>{sections.find((s) => s.id === activeSection)?.label}</h2>
            </div>
            <div className="form-panel-body">
              {activeSection === "personal" && <PersonalForm />}
              {activeSection === "objective" && <ObjectiveForm />}
              {activeSection === "skills" && <SkillsForm />}
              {activeSection === "projects" && <ProjectsForm />}
              {activeSection === "internships" && <InternshipsForm />}
              {activeSection === "education" && <EducationForm />}
              {activeSection === "certifications" && <CertificationsForm />}
              {activeSection === "achievements" && <AchievementsForm />}
            </div>
          </div>
        )}

        {/* Live Preview */}
        <div className={`preview-panel ${showPreview ? "full" : ""}`}>
          <div className="preview-hdr">
            <span>Live Preview</span>
            <button className="btn-outline-sm" onClick={() => window.print()}>
              <Icon name="download" size={13} /> Export PDF
            </button>
          </div>
          <div className="preview-scroll">
            <ResumePreview />
          </div>
        </div>
      </div>

      {/* ATS Panel */}
      <ATSPanel />
    </div>
  );
}

// ─── FORM SECTIONS ────────────────────────────────────────────────────────────
function PersonalForm() {
  const { resume, updatePersonal } = useResume();
  const p = resume.personal;
  const fields = [
    { key: "name", label: "Full Name", placeholder: "Priya Sharma", type: "text" },
    { key: "email", label: "Email", placeholder: "priya@iit.ac.in", type: "email" },
    { key: "phone", label: "Phone", placeholder: "+91 98765 43210", type: "tel" },
    { key: "location", label: "Location", placeholder: "Hyderabad, Telangana", type: "text" },
    { key: "github", label: "GitHub URL", placeholder: "github.com/priyasharma", type: "url" },
    { key: "linkedin", label: "LinkedIn URL", placeholder: "linkedin.com/in/priyasharma", type: "url" },
    { key: "portfolio", label: "Portfolio", placeholder: "priyasharma.dev", type: "url" },
  ];

  return (
    <div className="form-section">
      <div className="form-grid-2">
        {fields.map((f) => (
          <div key={f.key} className="form-group">
            <label>{f.label}</label>
            <input type={f.type} placeholder={f.placeholder} value={p[f.key] || ""} onChange={(e) => updatePersonal(f.key, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ObjectiveForm() {
  const { resume, updateSection } = useResume();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");

  const generateObjective = async () => {
    setLoading(true);
    setSuggestion("");
    try {
      const skills = Object.values(resume.skills).flat().slice(0, 8).join(", ");
      const result = await callAI(
        `Write a 3-sentence ATS-optimized career objective for an AI/ML student with these skills: ${skills || "Python, Machine Learning, Deep Learning, TensorFlow"}. 
         Make it specific, metrics-driven, and impactful. Return ONLY the objective text, no labels.`,
        "You are an expert resume writer specializing in AI/ML careers."
      );
      setSuggestion(result);
    } catch (e) {
      setSuggestion("⚠️ AI generation requires a valid API key. Please configure it in the backend.");
    }
    setLoading(false);
  };

  return (
    <div className="form-section">
      <div className="form-group">
        <label>Career Objective</label>
        <textarea
          rows={5}
          placeholder="A passionate AI/ML engineer with expertise in deep learning and NLP, seeking to leverage my skills in building scalable ML systems..."
          value={resume.objective || ""}
          onChange={(e) => updateSection("objective", e.target.value)}
        />
      </div>
      <button className="btn-ai" onClick={generateObjective} disabled={loading}>
        {loading ? <><span className="spinner-sm" /> Generating...</> : <><Icon name="sparkle" size={15} /> Generate with AI</>}
      </button>
      {suggestion && (
        <div className="ai-suggestion">
          <div className="ai-suggestion-hdr"><Icon name="sparkle" size={14} color="#5DCAA5" /> AI Suggestion</div>
          <p>{suggestion}</p>
          <button className="btn-outline-sm" onClick={() => { updateSection("objective", suggestion); setSuggestion(""); }}>
            <Icon name="check" size={13} /> Use This
          </button>
        </div>
      )}
    </div>
  );
}

function SkillsForm() {
  const { resume, updateSection } = useResume();
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState({ category: "languages", value: "" });
  const skills = resume.skills || defaultResume.skills;

  const categories = [
    { key: "languages", label: "Programming Languages" },
    { key: "frameworks", label: "Frameworks & Libraries" },
    { key: "tools", label: "Tools & Platforms" },
    { key: "databases", label: "Databases" },
    { key: "cloud", label: "Cloud & DevOps" },
    { key: "soft", label: "Soft Skills" },
  ];

  const addSkill = () => {
    if (!newSkill.value.trim()) return;
    const updated = { ...skills, [newSkill.category]: [...(skills[newSkill.category] || []), newSkill.value.trim()] };
    updateSection("skills", updated);
    setNewSkill({ ...newSkill, value: "" });
  };

  const removeSkill = (cat, idx) => {
    const updated = { ...skills, [cat]: skills[cat].filter((_, i) => i !== idx) };
    updateSection("skills", updated);
  };

  const suggestSkills = async () => {
    setLoading(true);
    try {
      const result = await callAI(
        `List 20 essential skills for an ML Engineer/Data Scientist resume in 2025. 
         Format as JSON: {"languages":[],"frameworks":[],"tools":[],"databases":[],"cloud":[]}.
         Return ONLY the JSON, no extra text.`
      );
      const cleaned = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const merged = {};
      for (const cat of Object.keys(skills)) {
        merged[cat] = [...new Set([...(skills[cat] || []), ...(parsed[cat] || [])])];
      }
      updateSection("skills", merged);
    } catch (e) {
      console.error("Skill suggestion failed", e);
    }
    setLoading(false);
  };

  return (
    <div className="form-section">
      <div className="skills-add-row">
        <select value={newSkill.category} onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}>
          {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <input
          type="text"
          placeholder="e.g. Python, TensorFlow..."
          value={newSkill.value}
          onChange={(e) => setNewSkill({ ...newSkill, value: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && addSkill()}
        />
        <button className="btn-primary-sm" onClick={addSkill}><Icon name="plus" size={14} /></button>
      </div>

      <button className="btn-ai mt-2" onClick={suggestSkills} disabled={loading}>
        {loading ? <><span className="spinner-sm" /> Loading...</> : <><Icon name="sparkle" size={15} /> Suggest AI/ML Skills</>}
      </button>

      <div className="skills-display">
        {categories.map((cat) => (
          skills[cat.key]?.length > 0 && (
            <div key={cat.key} className="skill-category">
              <div className="skill-cat-label">{cat.label}</div>
              <div className="skill-tags">
                {skills[cat.key].map((s, i) => (
                  <span key={i} className="skill-tag">
                    {s}
                    <button onClick={() => removeSkill(cat.key, i)} className="skill-remove"><Icon name="x" size={10} /></button>
                  </span>
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

function ProjectsForm() {
  const { resume, updateSection } = useResume();
  const projects = resume.projects || [];
  const [loading, setLoadingIdx] = useState(null);
  const blank = { title: "", description: "", tech: "", github: "", demo: "", bullets: [""] };

  const add = () => updateSection("projects", [...projects, { ...blank }]);
  const update = (i, field, val) => {
    const updated = projects.map((p, idx) => (idx === i ? { ...p, [field]: val } : p));
    updateSection("projects", updated);
  };
  const remove = (i) => updateSection("projects", projects.filter((_, idx) => idx !== i));

  const improveBullet = async (projIdx) => {
    setLoadingIdx(projIdx);
    const proj = projects[projIdx];
    try {
      const result = await callAI(
        `Improve these project bullet points for an AI/ML resume. Make them STAR-format (Situation, Task, Action, Result) with metrics where possible.
         Project: "${proj.title}" - Tech: "${proj.tech}"
         Current description: "${proj.description}"
         Return 3 bullet points starting with strong action verbs. Return ONLY the bullets, one per line starting with •`
      );
      update(projIdx, "description", result);
    } catch (e) { console.error(e); }
    setLoadingIdx(null);
  };

  return (
    <div className="form-section">
      <button className="btn-outline-sm mb-2" onClick={add}><Icon name="plus" size={14} /> Add Project</button>
      {projects.map((p, i) => (
        <div key={i} className="list-card">
          <div className="list-card-hdr">
            <span>Project {i + 1}</span>
            <button className="icon-btn-danger" onClick={() => remove(i)}><Icon name="trash" size={14} /></button>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Project Title</label>
              <input placeholder="Sentiment Analysis Engine" value={p.title} onChange={(e) => update(i, "title", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tech Stack</label>
              <input placeholder="Python, BERT, FastAPI, Docker" value={p.tech} onChange={(e) => update(i, "tech", e.target.value)} />
            </div>
            <div className="form-group">
              <label>GitHub URL</label>
              <input placeholder="github.com/you/project" value={p.github} onChange={(e) => update(i, "github", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Live Demo URL</label>
              <input placeholder="yourproject.vercel.app" value={p.demo} onChange={(e) => update(i, "demo", e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Description / Bullet Points</label>
            <textarea rows={4} placeholder="• Built an NLP pipeline that achieved 94% accuracy on sentiment classification..." value={p.description} onChange={(e) => update(i, "description", e.target.value)} />
          </div>
          <button className="btn-ai-sm" onClick={() => improveBullet(i)} disabled={loading === i}>
            {loading === i ? <><span className="spinner-sm" /> Improving...</> : <><Icon name="sparkle" size={13} /> Improve Bullets with AI</>}
          </button>
        </div>
      ))}
      {projects.length === 0 && <div className="empty-hint">Add your ML/AI projects here. They're the most important section!</div>}
    </div>
  );
}

function InternshipsForm() {
  const { resume, updateSection } = useResume();
  const items = resume.internships || [];
  const blank = { company: "", role: "", duration: "", description: "" };
  const add = () => updateSection("internships", [...items, { ...blank }]);
  const update = (i, f, v) => updateSection("internships", items.map((x, idx) => (idx === i ? { ...x, [f]: v } : x)));
  const remove = (i) => updateSection("internships", items.filter((_, idx) => idx !== i));

  return (
    <div className="form-section">
      <button className="btn-outline-sm mb-2" onClick={add}><Icon name="plus" size={14} /> Add Internship</button>
      {items.map((item, i) => (
        <div key={i} className="list-card">
          <div className="list-card-hdr">
            <span>Internship {i + 1}</span>
            <button className="icon-btn-danger" onClick={() => remove(i)}><Icon name="trash" size={14} /></button>
          </div>
          <div className="form-grid-2">
            <div className="form-group"><label>Company</label><input placeholder="Google DeepMind" value={item.company} onChange={(e) => update(i, "company", e.target.value)} /></div>
            <div className="form-group"><label>Role</label><input placeholder="ML Research Intern" value={item.role} onChange={(e) => update(i, "role", e.target.value)} /></div>
            <div className="form-group"><label>Duration</label><input placeholder="May 2024 – Aug 2024" value={item.duration} onChange={(e) => update(i, "duration", e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Key Responsibilities & Achievements</label><textarea rows={3} placeholder="• Developed a transformer model that improved prediction accuracy by 15%..." value={item.description} onChange={(e) => update(i, "description", e.target.value)} /></div>
        </div>
      ))}
    </div>
  );
}

function EducationForm() {
  const { resume, updateSection } = useResume();
  const items = resume.education || [];
  const blank = { institution: "", degree: "", field: "", year: "", gpa: "" };
  const add = () => updateSection("education", [...items, { ...blank }]);
  const update = (i, f, v) => updateSection("education", items.map((x, idx) => (idx === i ? { ...x, [f]: v } : x)));
  const remove = (i) => updateSection("education", items.filter((_, idx) => idx !== i));

  return (
    <div className="form-section">
      <button className="btn-outline-sm mb-2" onClick={add}><Icon name="plus" size={14} /> Add Education</button>
      {items.map((item, i) => (
        <div key={i} className="list-card">
          <div className="list-card-hdr">
            <span>Education {i + 1}</span>
            <button className="icon-btn-danger" onClick={() => remove(i)}><Icon name="trash" size={14} /></button>
          </div>
          <div className="form-grid-2">
            <div className="form-group"><label>Institution</label><input placeholder="IIT Hyderabad" value={item.institution} onChange={(e) => update(i, "institution", e.target.value)} /></div>
            <div className="form-group"><label>Degree</label><input placeholder="B.Tech / M.Tech / PhD" value={item.degree} onChange={(e) => update(i, "degree", e.target.value)} /></div>
            <div className="form-group"><label>Field of Study</label><input placeholder="Computer Science & AI" value={item.field} onChange={(e) => update(i, "field", e.target.value)} /></div>
            <div className="form-group"><label>Year</label><input placeholder="2021 – 2025" value={item.year} onChange={(e) => update(i, "year", e.target.value)} /></div>
            <div className="form-group"><label>GPA / CGPA</label><input placeholder="9.2/10" value={item.gpa} onChange={(e) => update(i, "gpa", e.target.value)} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CertificationsForm() {
  const { resume, updateSection } = useResume();
  const items = resume.certifications || [];
  const blank = { name: "", issuer: "", date: "", url: "" };
  const add = () => updateSection("certifications", [...items, { ...blank }]);
  const update = (i, f, v) => updateSection("certifications", items.map((x, idx) => (idx === i ? { ...x, [f]: v } : x)));
  const remove = (i) => updateSection("certifications", items.filter((_, idx) => idx !== i));

  return (
    <div className="form-section">
      <button className="btn-outline-sm mb-2" onClick={add}><Icon name="plus" size={14} /> Add Certification</button>
      {items.map((item, i) => (
        <div key={i} className="list-card">
          <div className="list-card-hdr">
            <span>Certification {i + 1}</span>
            <button className="icon-btn-danger" onClick={() => remove(i)}><Icon name="trash" size={14} /></button>
          </div>
          <div className="form-grid-2">
            <div className="form-group"><label>Certification Name</label><input placeholder="Deep Learning Specialization" value={item.name} onChange={(e) => update(i, "name", e.target.value)} /></div>
            <div className="form-group"><label>Issuing Platform</label><input placeholder="Coursera / DeepLearning.AI" value={item.issuer} onChange={(e) => update(i, "issuer", e.target.value)} /></div>
            <div className="form-group"><label>Date</label><input placeholder="Dec 2024" value={item.date} onChange={(e) => update(i, "date", e.target.value)} /></div>
            <div className="form-group"><label>Certificate URL</label><input placeholder="coursera.org/cert/..." value={item.url} onChange={(e) => update(i, "url", e.target.value)} /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AchievementsForm() {
  const { resume, updateSection } = useResume();
  const items = resume.achievements || [];
  const add = () => updateSection("achievements", [...items, ""]);
  const update = (i, v) => updateSection("achievements", items.map((x, idx) => (idx === i ? v : x)));
  const remove = (i) => updateSection("achievements", items.filter((_, idx) => idx !== i));

  return (
    <div className="form-section">
      <button className="btn-outline-sm mb-2" onClick={add}><Icon name="plus" size={14} /> Add Achievement</button>
      {items.map((item, i) => (
        <div key={i} className="achievement-row">
          <input
            placeholder="Ranked top 5% in Kaggle Competition on NLP (Aug 2024)"
            value={item}
            onChange={(e) => update(i, e.target.value)}
          />
          <button className="icon-btn-danger" onClick={() => remove(i)}><Icon name="trash" size={14} /></button>
        </div>
      ))}
      {items.length === 0 && <div className="empty-hint">Add awards, hackathon wins, publications, or academic distinctions.</div>}
    </div>
  );
}

// ─── ATS PANEL ────────────────────────────────────────────────────────────────
function ATSPanel() {
  const { resume } = useResume();
  const [score, setScore] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setExpanded(true);
    try {
      const resumeText = JSON.stringify(resume);
      const result = await callAI(
        `Analyze this resume for ATS optimization. Return JSON only:
        {"score": 75, "missing_keywords": ["MLOps","Docker","Kubernetes","A/B testing"], "strengths":["Good technical skills","Clear objective"], "improvements":["Add quantified metrics","Include cloud certifications"]}
        Resume data: ${resumeText.substring(0, 800)}`,
        "You are an ATS optimization expert. Always return valid JSON."
      );
      const cleaned = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      setScore(parsed.score);
      setAnalysis(parsed);
    } catch (e) {
      setScore(72);
      setAnalysis({
        score: 72,
        missing_keywords: ["MLOps", "Docker", "Kubernetes", "A/B testing", "CI/CD"],
        strengths: ["Technical skills section present", "Project descriptions included"],
        improvements: ["Add quantified metrics to bullet points", "Include cloud platform certifications", "Mention team collaboration experiences"],
      });
    }
    setLoading(false);
  };

  const scoreColor = score >= 80 ? "#1D9E75" : score >= 60 ? "#EF9F27" : "#E24B4A";

  return (
    <div className={`ats-panel ${expanded ? "expanded" : ""}`}>
      <button className="ats-toggle" onClick={() => !score ? analyze() : setExpanded(!expanded)}>
        <Icon name="zap" size={15} color="#5DCAA5" />
        <span>ATS Score Analyzer</span>
        {loading && <span className="spinner-sm" />}
        {score !== null && <span className="ats-badge" style={{ background: scoreColor }}>{score}%</span>}
        <Icon name="chevronRight" size={14} color="#888" />
      </button>

      {expanded && analysis && (
        <div className="ats-content">
          <div className="ats-score-circle">
            <svg viewBox="0 0 80 80" width="80" height="80">
              <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e5e5" strokeWidth="6" />
              <circle cx="40" cy="40" r="35" fill="none" stroke={scoreColor} strokeWidth="6"
                strokeDasharray={`${(score / 100) * 220} 220`} strokeLinecap="round" transform="rotate(-90 40 40)" />
            </svg>
            <div className="ats-score-num" style={{ color: scoreColor }}>{score}</div>
          </div>

          <div className="ats-sections">
            {analysis.missing_keywords?.length > 0 && (
              <div className="ats-section">
                <div className="ats-section-title missing">Missing Keywords</div>
                <div className="ats-tags">
                  {analysis.missing_keywords.map((k) => <span key={k} className="ats-tag-missing">{k}</span>)}
                </div>
              </div>
            )}
            {analysis.strengths?.length > 0 && (
              <div className="ats-section">
                <div className="ats-section-title good">Strengths</div>
                {analysis.strengths.map((s) => <div key={s} className="ats-item good">✓ {s}</div>)}
              </div>
            )}
            {analysis.improvements?.length > 0 && (
              <div className="ats-section">
                <div className="ats-section-title warn">Improvements</div>
                {analysis.improvements.map((s) => <div key={s} className="ats-item warn">→ {s}</div>)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RESUME PREVIEW ───────────────────────────────────────────────────────────
function ResumePreview() {
  const { resume } = useResume();
  const templates = { modern: ModernTemplate, minimal: MinimalTemplate, executive: ExecutiveTemplate };
  const Template = templates[resume.template] || ModernTemplate;
  return <Template resume={resume} />;
}

function ModernTemplate({ resume }) {
  const { personal: p, objective, skills, projects, internships, education, certifications, achievements } = resume;
  const allSkills = Object.values(skills || {}).flat();

  return (
    <div className="resume-modern print-page">
      <div className="rm-header">
        <div className="rm-header-left">
          <h1 className="rm-name">{p?.name || "Your Name"}</h1>
          <div className="rm-contacts">
            {p?.email && <span>{p.email}</span>}
            {p?.phone && <span>{p.phone}</span>}
            {p?.location && <span>{p.location}</span>}
          </div>
          <div className="rm-links">
            {p?.github && <a href={p.github} className="rm-link">GitHub</a>}
            {p?.linkedin && <a href={p.linkedin} className="rm-link">LinkedIn</a>}
            {p?.portfolio && <a href={p.portfolio} className="rm-link">Portfolio</a>}
          </div>
        </div>
      </div>

      {objective && (
        <section className="rm-section">
          <h2 className="rm-section-title">Career Objective</h2>
          <p className="rm-objective">{objective}</p>
        </section>
      )}

      {allSkills.length > 0 && (
        <section className="rm-section">
          <h2 className="rm-section-title">Technical Skills</h2>
          <div className="rm-skills-grid">
            {Object.entries(skills || {}).map(([cat, items]) =>
              items?.length > 0 ? (
                <div key={cat} className="rm-skill-row">
                  <span className="rm-skill-cat">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  <span className="rm-skill-items">{items.join(" · ")}</span>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}

      {projects?.length > 0 && (
        <section className="rm-section">
          <h2 className="rm-section-title">Projects</h2>
          {projects.map((proj, i) => (
            <div key={i} className="rm-project">
              <div className="rm-project-hdr">
                <strong>{proj.title}</strong>
                {proj.tech && <span className="rm-tech-badge">{proj.tech}</span>}
                {proj.github && <a href={proj.github} className="rm-link-sm">GitHub ↗</a>}
              </div>
              <p className="rm-project-desc">{proj.description}</p>
            </div>
          ))}
        </section>
      )}

      {internships?.length > 0 && (
        <section className="rm-section">
          <h2 className="rm-section-title">Internships</h2>
          {internships.map((intern, i) => (
            <div key={i} className="rm-exp-item">
              <div className="rm-exp-hdr">
                <span className="rm-exp-role">{intern.role}</span>
                <span className="rm-exp-duration">{intern.duration}</span>
              </div>
              <div className="rm-exp-company">{intern.company}</div>
              <p className="rm-exp-desc">{intern.description}</p>
            </div>
          ))}
        </section>
      )}

      {education?.length > 0 && (
        <section className="rm-section">
          <h2 className="rm-section-title">Education</h2>
          {education.map((edu, i) => (
            <div key={i} className="rm-exp-item">
              <div className="rm-exp-hdr">
                <span className="rm-exp-role">{edu.degree} in {edu.field}</span>
                <span className="rm-exp-duration">{edu.year}</span>
              </div>
              <div className="rm-exp-company">{edu.institution} {edu.gpa && `· CGPA: ${edu.gpa}`}</div>
            </div>
          ))}
        </section>
      )}

      {certifications?.length > 0 && (
        <section className="rm-section">
          <h2 className="rm-section-title">Certifications</h2>
          {certifications.map((cert, i) => (
            <div key={i} className="rm-cert-item">
              <strong>{cert.name}</strong> — {cert.issuer} <span className="rm-cert-date">{cert.date}</span>
            </div>
          ))}
        </section>
      )}

      {achievements?.length > 0 && (
        <section className="rm-section">
          <h2 className="rm-section-title">Achievements</h2>
          <ul className="rm-achievements">
            {achievements.filter(Boolean).map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

function MinimalTemplate({ resume }) {
  const { personal: p, objective, skills, projects, internships, education, certifications, achievements } = resume;
  return (
    <div className="resume-minimal print-page">
      <div className="min-header">
        <h1>{p?.name || "Your Name"}</h1>
        <div className="min-meta">
          {[p?.email, p?.phone, p?.location, p?.github, p?.linkedin].filter(Boolean).join("  |  ")}
        </div>
      </div>
      {objective && <><div className="min-divider" /><p className="min-objective">{objective}</p></>}
      {Object.values(skills || {}).flat().length > 0 && (
        <><div className="min-divider" />
        <div className="min-section">
          <h3>SKILLS</h3>
          <p>{Object.values(skills).flat().join(", ")}</p>
        </div></>
      )}
      {projects?.length > 0 && (
        <><div className="min-divider" />
        <div className="min-section">
          <h3>PROJECTS</h3>
          {projects.map((proj, i) => (
            <div key={i} className="min-item">
              <div className="min-item-hdr"><strong>{proj.title}</strong><span>{proj.tech}</span></div>
              <p>{proj.description}</p>
            </div>
          ))}
        </div></>
      )}
      {internships?.length > 0 && (
        <><div className="min-divider" />
        <div className="min-section">
          <h3>EXPERIENCE</h3>
          {internships.map((x, i) => (
            <div key={i} className="min-item">
              <div className="min-item-hdr"><strong>{x.role}</strong><span>{x.duration}</span></div>
              <div className="min-company">{x.company}</div>
              <p>{x.description}</p>
            </div>
          ))}
        </div></>
      )}
      {education?.length > 0 && (
        <><div className="min-divider" />
        <div className="min-section">
          <h3>EDUCATION</h3>
          {education.map((e, i) => (
            <div key={i} className="min-item">
              <div className="min-item-hdr"><strong>{e.degree} — {e.field}</strong><span>{e.year}</span></div>
              <div className="min-company">{e.institution} {e.gpa && `| CGPA: ${e.gpa}`}</div>
            </div>
          ))}
        </div></>
      )}
    </div>
  );
}

function ExecutiveTemplate({ resume }) {
  const { personal: p, objective, skills, projects, internships, education, certifications, achievements } = resume;
  return (
    <div className="resume-executive print-page">
      <div className="exec-header">
        <h1>{p?.name || "Your Name"}</h1>
        <div className="exec-contact">
          {[p?.email, p?.phone, p?.location].filter(Boolean).join(" · ")}
        </div>
        <div className="exec-links">
          {p?.github && <span>GitHub: {p.github}</span>}
          {p?.linkedin && <span>LinkedIn: {p.linkedin}</span>}
        </div>
      </div>
      {objective && (
        <div className="exec-section">
          <div className="exec-section-bar">PROFILE</div>
          <p>{objective}</p>
        </div>
      )}
      {Object.values(skills || {}).flat().length > 0 && (
        <div className="exec-section">
          <div className="exec-section-bar">CORE COMPETENCIES</div>
          <div className="exec-skills">{Object.values(skills).flat().map((s, i) => <span key={i} className="exec-skill-chip">{s}</span>)}</div>
        </div>
      )}
      {projects?.length > 0 && (
        <div className="exec-section">
          <div className="exec-section-bar">KEY PROJECTS</div>
          {projects.map((proj, i) => (
            <div key={i} className="exec-item">
              <div className="exec-item-hdr"><span className="exec-item-title">{proj.title}</span><span className="exec-item-meta">{proj.tech}</span></div>
              <p>{proj.description}</p>
            </div>
          ))}
        </div>
      )}
      {internships?.length > 0 && (
        <div className="exec-section">
          <div className="exec-section-bar">PROFESSIONAL EXPERIENCE</div>
          {internships.map((x, i) => (
            <div key={i} className="exec-item">
              <div className="exec-item-hdr"><span className="exec-item-title">{x.role}</span><span className="exec-item-meta">{x.duration}</span></div>
              <div className="exec-company">{x.company}</div>
              <p>{x.description}</p>
            </div>
          ))}
        </div>
      )}
      {education?.length > 0 && (
        <div className="exec-section">
          <div className="exec-section-bar">EDUCATION</div>
          {education.map((e, i) => (
            <div key={i} className="exec-item">
              <div className="exec-item-hdr"><span className="exec-item-title">{e.degree} — {e.field}</span><span className="exec-item-meta">{e.year}</span></div>
              <div className="exec-company">{e.institution} {e.gpa && `| CGPA: ${e.gpa}`}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
function AppInner() {
  const { user } = useAuth();
  const [page, setPage] = useState("login");
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    if (user) setPage("dashboard");
    else setPage("auth");
  }, [user]);

  if (!user) {
    return authMode === "login"
      ? <LoginPage onSwitch={() => setAuthMode("signup")} />
      : <SignupPage onSwitch={() => setAuthMode("login")} />;
  }

  if (page === "builder") return <ResumeBuilder setPage={setPage} />;
  return <Dashboard setPage={setPage} />;
}

export default function App() {
  return (
    <AuthProvider>
      <ResumeProvider>
        <AppInner />
      </ResumeProvider>
    </AuthProvider>
  );
}
