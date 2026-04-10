import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Camera, MapPin, Upload, Brain, CheckCircle2,
  AlertTriangle, X, ChevronRight, ChevronLeft,
  Zap, BarChart3, DollarSign, Clock
} from 'lucide-react';
import { SeverityBadge, SeverityBar, PriorityRing } from '../components/SeverityBadge';
import toast from 'react-hot-toast';
import type { SeverityLevel } from '../types';

const STEPS = ['Upload Photo', 'AI Analysis', 'Issue Details', 'Submit'];
const CATEGORIES = [
  { id: 'pothole', label: 'Pothole' },
  { id: 'crack', label: 'Road Crack' },
  { id: 'waterlogging', label: 'Waterlogging' },
  { id: 'broken_divider', label: 'Broken Divider' },
  { id: 'damaged_footpath', label: 'Damaged Footpath' },
  { id: 'other', label: 'Other' },
];

interface MockAIResult {
  severity: SeverityLevel;
  severityScore: number;
  priorityScore: number;
  confidence: number;
  damageType: string;
  estimatedArea: number;
  repairEstimate: string;
  urgencyReason: string;
  detectedFeatures: string[];
}

function mockAIAnalyze(): Promise<MockAIResult> {
  return new Promise(resolve => {
    setTimeout(() => {
      const score = Math.floor(Math.random() * 60) + 35;
      const sev: SeverityLevel = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
      resolve({
        severity: sev,
        severityScore: score,
        priorityScore: Math.min(score + Math.floor(Math.random() * 15), 100),
        confidence: 0.85 + Math.random() * 0.13,
        damageType: ['Pothole', 'Alligator Cracking', 'Linear Crack', 'Surface Rutting', 'Edge Break'][Math.floor(Math.random() * 5)],
        estimatedArea: +(Math.random() * 8 + 0.5).toFixed(1),
        repairEstimate: score >= 70 ? '₹15,000 – ₹30,000' : score >= 40 ? '₹5,000 – ₹15,000' : '₹2,000 – ₹5,000',
        urgencyReason: ['High traffic zone', 'Near school/hospital', 'Spreading damage pattern', 'Vehicle safety risk'][Math.floor(Math.random() * 4)],
        detectedFeatures: ['Surface deformation', 'Edge cracking', 'Depth > 5cm', 'Structural fatigue'].slice(0, Math.floor(Math.random() * 3) + 1),
      });
    }, 3200);
  });
}

const ReportIssue: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [aiResult, setAiResult] = useState<MockAIResult | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', address: '', ward: '' });
  const [submitting, setSubmitting] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setImages(accepted.slice(0, 3));
    const urls = accepted.slice(0, 3).map(f => URL.createObjectURL(f));
    setPreviews(urls);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 3, multiple: true,
  });

  const removeImage = (i: number) => {
    setImages(p => p.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  const runAI = async () => {
    if (!images.length) { toast.error('Please upload at least one photo.'); return; }
    setStep(1);
    setAnalyzing(true);
    setAnalysisProgress(0);

    // Animate progress bar
    const interval = setInterval(() => {
      setAnalysisProgress(p => {
        if (p >= 90) { clearInterval(interval); return p; }
        return p + Math.random() * 12;
      });
    }, 300);

    const result = await mockAIAnalyze();
    clearInterval(interval);
    setAnalysisProgress(100);
    setAiResult(result);
    setAnalyzing(false);
    if (!form.category) setForm(p => ({ ...p, category: result.damageType.toLowerCase().includes('pothole') ? 'pothole' : 'crack' }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.address || !form.ward) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success('Issue reported successfully! AI has assigned priority.');
    navigate('/dashboard');
  };

  const ANALYSIS_STEPS = [
    { label: 'Loading image...', done: analysisProgress > 15 },
    { label: 'Detecting damage type...', done: analysisProgress > 35 },
    { label: 'Measuring damage area...', done: analysisProgress > 55 },
    { label: 'Calculating severity score...', done: analysisProgress > 72 },
    { label: 'Computing priority rank...', done: analysisProgress > 88 },
    { label: 'Generating repair estimate...', done: analysisProgress >= 100 },
  ];

  return (
    <div className="min-h-screen pt-16 bg-grid noise">
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Step Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-amber transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((label, i) => (
              <div key={label} className="relative flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold border-2 transition-all duration-300 z-10 ${
                  i < step ? 'bg-amber border-amber text-white' :
                  i === step ? 'bg-bg-card border-amber text-amber shadow-amber' :
                  'bg-bg-card border-border text-gray-500'
                }`}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-display uppercase tracking-wider hidden sm:block ${
                  i === step ? 'text-amber' : i < step ? 'text-gray-400' : 'text-gray-600'
                }`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Step 0: Upload ── */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="cs-card p-6 mb-4">
                <h2 className="font-display text-3xl font-black text-white mb-1">UPLOAD PHOTO(S)</h2>
                <p className="text-gray-400 text-sm mb-5">Upload 1–3 clear photos of the road damage. Better photos = better AI analysis.</p>

                <div
                  {...getRootProps()}
                  className={`upload-zone rounded-xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'active' : ''}`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-bg-elevated rounded-2xl border border-border flex items-center justify-center">
                      {isDragActive ? <Upload size={24} className="text-amber" /> : <Camera size={24} className="text-gray-500" />}
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold text-white">
                        {isDragActive ? 'Drop it here!' : 'Drag & drop or click to upload'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, WebP • Max 3 photos • 10MB each</p>
                    </div>
                  </div>
                </div>

                {previews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {previews.map((url, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden aspect-video bg-bg-elevated group">
                        <img src={url} alt={`preview ${i}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 w-6 h-6 bg-bg-primary/80 rounded-full flex items-center justify-center text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                        ><X size={12} /></button>
                        <div className="absolute bottom-2 left-2 text-xs font-mono bg-bg-primary/70 px-2 py-0.5 rounded text-gray-400">
                          {(images[i]?.size / 1024 / 1024).toFixed(1)}MB
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={runAI}
                disabled={!images.length}
                className="btn-primary w-full py-4 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Brain size={20} /> Analyze with AI <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {/* ── Step 1: AI Analysis ── */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="cs-card p-6 mb-4">
                <h2 className="font-display text-3xl font-black text-white mb-1">
                  {analyzing ? 'AI ANALYZING...' : 'ANALYSIS COMPLETE'}
                </h2>
                <p className="text-gray-400 text-sm mb-6">
                  {analyzing ? 'Our YOLOv8 model is processing your image.' : 'Review the AI-generated damage assessment below.'}
                </p>

                {analyzing ? (
                  <div className="space-y-5">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-xs text-gray-400 font-display uppercase tracking-wider">Processing</span>
                        <span className="text-xs font-mono text-amber">{Math.floor(analysisProgress)}%</span>
                      </div>
                      <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-amber"
                          style={{ width: `${analysisProgress}%`, boxShadow: '0 0 8px rgba(249,115,22,0.5)' }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-2">
                      {ANALYSIS_STEPS.map((s, i) => (
                        <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-300 ${s.done ? 'text-gray-300' : 'text-gray-600'}`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-amber/20 text-amber' : 'bg-bg-elevated'}`}>
                            {s.done ? <CheckCircle2 size={10} /> : <div className="w-1.5 h-1.5 bg-gray-600 rounded-full" />}
                          </div>
                          {s.label}
                        </div>
                      ))}
                    </div>

                    {/* Preview */}
                    {previews[0] && (
                      <div className="relative rounded-xl overflow-hidden h-40 scan-container">
                        <img src={previews[0]} alt="analyzing" className="w-full h-full object-cover opacity-70" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="spinner w-10 h-10 border-2" />
                        </div>
                      </div>
                    )}
                  </div>
                ) : aiResult && (
                  <div className="space-y-5">
                    {/* Header result */}
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-bg-elevated border border-border">
                      <PriorityRing score={aiResult.priorityScore} size={72} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <SeverityBadge severity={aiResult.severity} size="md" />
                          <span className="text-xs font-mono text-gray-500">
                            {(aiResult.confidence * 100).toFixed(1)}% confidence
                          </span>
                        </div>
                        <p className="font-display text-xl font-bold text-white">{aiResult.damageType}</p>
                        <p className="text-xs text-gray-400 mt-1">{aiResult.urgencyReason}</p>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="space-y-3">
                      <SeverityBar score={aiResult.severityScore} label="Damage Severity Score" />
                      <SeverityBar score={aiResult.priorityScore} label="Priority Score" />
                      <SeverityBar score={Math.round(aiResult.confidence * 100)} label="AI Confidence" />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: BarChart3, label: 'Damage Area', val: `${aiResult.estimatedArea} m²` },
                        { icon: DollarSign, label: 'Est. Repair', val: aiResult.repairEstimate },
                        { icon: Clock, label: 'Urgency', val: aiResult.severity === 'critical' ? '< 24h' : aiResult.severity === 'high' ? '< 48h' : '< 7 days' },
                      ].map(s => (
                        <div key={s.label} className="p-3 bg-bg-elevated rounded-xl text-center">
                          <s.icon size={16} className="text-amber mx-auto mb-1" />
                          <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                          <p className="text-xs font-bold text-white leading-tight">{s.val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Features */}
                    <div>
                      <p className="text-xs text-gray-500 mb-2 font-display uppercase tracking-widest">Detected Features</p>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.detectedFeatures.map(f => (
                          <span key={f} className="px-2.5 py-1 bg-bg-elevated rounded-full text-xs text-gray-300 border border-border">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!analyzing && aiResult && (
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary w-full py-4 rounded-xl text-base flex items-center justify-center gap-2"
                >
                  Continue to Details <ChevronRight size={18} />
                </button>
              )}
            </motion.div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="cs-card p-6 mb-4">
                <h2 className="font-display text-3xl font-black text-white mb-1">ISSUE DETAILS</h2>
                <p className="text-gray-400 text-sm mb-5">Add more context to help officials respond faster.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">Issue Title *</label>
                    <input
                      required type="text"
                      value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Large pothole near MG Road bus stop"
                      className="cs-input w-full px-4 py-3.5 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">Description</label>
                    <textarea
                      rows={3}
                      value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Additional details about the damage, when it started, safety hazards..."
                      className="cs-input w-full px-4 py-3 rounded-xl text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">Category</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat.id} type="button"
                          onClick={() => setForm(p => ({ ...p, category: cat.id }))}
                          className={`py-2.5 px-3 rounded-xl text-xs font-display uppercase tracking-wider border transition-all ${
                            form.category === cat.id
                              ? 'bg-amber/10 border-amber/30 text-amber'
                              : 'bg-bg-elevated border-border text-gray-400 hover:border-amber/20'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">Address *</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          required type="text"
                          value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                          placeholder="Street / landmark"
                          className="cs-input w-full pl-9 pr-4 py-3.5 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">Ward *</label>
                      <select
                        required value={form.ward} onChange={e => setForm(p => ({ ...p, ward: e.target.value }))}
                        className="cs-input w-full px-4 py-3.5 rounded-xl text-sm appearance-none"
                      >
                        <option value="">Select Ward</option>
                        {Array.from({ length: 15 }, (_, i) => (
                          <option key={i + 1} value={`Ward ${i + 1}`}>Ward {i + 1}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary px-6 py-4 rounded-xl flex items-center gap-2">
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  onClick={() => { if (form.title && form.address && form.ward) setStep(3); else toast.error('Fill required fields'); }}
                  className="btn-primary flex-1 py-4 rounded-xl flex items-center justify-center gap-2"
                >
                  Review & Submit <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Review ── */}
          {step === 3 && aiResult && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="cs-card p-6 mb-4 space-y-5">
                <div>
                  <h2 className="font-display text-3xl font-black text-white mb-1">REVIEW & SUBMIT</h2>
                  <p className="text-gray-400 text-sm">Review your issue before submitting to city officials.</p>
                </div>

                {/* Preview */}
                {previews[0] && (
                  <div className="rounded-xl overflow-hidden h-44 relative">
                    <img src={previews[0]} alt="issue" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/70 to-transparent" />
                    <div className="absolute bottom-3 left-3 flex gap-2">
                      <SeverityBadge severity={aiResult.severity} size="md" />
                      <span className="px-3 py-1 bg-bg-primary/70 backdrop-blur rounded-full text-xs font-mono text-gray-300">
                        {previews.length} photo{previews.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <PriorityRing score={aiResult.priorityScore} size={52} />
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="space-y-3">
                  {[
                    { label: 'Title', val: form.title },
                    { label: 'Category', val: CATEGORIES.find(c => c.id === form.category)?.label || form.category },
                    { label: 'Location', val: `${form.address}, ${form.ward}` },
                    { label: 'AI Damage Type', val: aiResult.damageType },
                    { label: 'Severity Score', val: `${aiResult.severityScore}/100` },
                    { label: 'Priority Score', val: `${aiResult.priorityScore}/100` },
                    { label: 'Repair Estimate', val: aiResult.repairEstimate },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-xs text-gray-500 font-display uppercase tracking-wider">{row.label}</span>
                      <span className="text-sm text-white font-medium text-right max-w-[55%]">{row.val}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber/5 border border-amber/20 rounded-xl flex gap-3 text-sm">
                  <Zap size={16} className="text-amber flex-shrink-0 mt-0.5" />
                  <p className="text-gray-300">Your issue will be automatically assigned to the relevant city department based on AI priority scoring.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="btn-secondary px-6 py-4 rounded-xl flex items-center gap-2">
                  <ChevronLeft size={18} /> Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary flex-1 py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <><div className="spinner w-5 h-5 border-2" /> Submitting...</>
                  ) : (
                    <><AlertTriangle size={18} /> Submit Report</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ReportIssue;
