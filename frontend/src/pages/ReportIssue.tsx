/**
 * Report Issue — 2-Step Flow
 *
 * Step 1 — Upload Image
 *   • Drag-and-drop / click to upload ONE image
 *   • "Analyze with AI" → POST /analyze (AI service port 5001)
 *   • Frontend stores AI response temporarily
 *
 * Step 2 — AI Result + Fill Info
 *   • Image preview displayed
 *   • AI-suggested category shown and editable by user
 *   • User fills: description + location (map click)
 *   • On submit → POST /reports (multipart: image file + description + lat + lng)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { latLng } from 'leaflet';
import type { LatLng } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Camera, MapPin, Brain, CheckCircle2, AlertTriangle,
  X, ChevronRight, ChevronLeft, Zap, BarChart3,
  Clock, Upload, Navigation, ArrowRight, ThumbsUp,
} from 'lucide-react';
import { SeverityBadge, SeverityBar, PriorityRing } from '../components/SeverityBadge';
import toast from 'react-hot-toast';
import { aiAPI, reportsAPI, upvoteAPI } from '../utils/api';
import type { SeverityLevel, BackendReport } from '../types';

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'pothole',          label: 'Pothole' },
  { id: 'crack',            label: 'Road Crack' },
  { id: 'waterlogging',     label: 'Waterlogging' },
  { id: 'broken_divider',   label: 'Broken Divider' },
  { id: 'damaged_footpath', label: 'Damaged Footpath' },
  { id: 'other',            label: 'Other' },
];

// ─── AI result shape (from AI service OR mock fallback) ───────────────────────
interface AIResult {
  severity: SeverityLevel;
  severityScore: number;
  priorityScore: number;
  confidence: number;
  damageType: string;
  estimatedArea: number;
  urgencyReason: string;
  detectedFeatures: string[];
  suggestedCategory: string;
}

/** Used if the AI service isn't reachable */
function mockFallback(): AIResult {
  const score = Math.floor(Math.random() * 60) + 35;
  const sev: SeverityLevel =
    score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
  return {
    severity: sev,
    severityScore: score,
    priorityScore: Math.min(score + Math.floor(Math.random() * 15), 100),
    confidence: 0.82 + Math.random() * 0.13,
    damageType: 'Road Damage',
    estimatedArea: +(Math.random() * 8 + 0.5).toFixed(1),
    urgencyReason: 'Infrastructure damage detected',
    detectedFeatures: ['Surface deformation', 'Edge cracking'],
    suggestedCategory: 'other',
  };
}

/** Normalise whatever the AI service returns into our AIResult shape.
 *  AI returns: severity_score in [0, 15], priority_score in [0, 1]
 *  We display everything on a [0, 100] scale.
 */
function normaliseAIResponse(raw: any): AIResult {
  const rawSev = raw.severity_score ?? raw.severityScore ?? 7.5;
  const severityScore = Math.min(Math.round((rawSev / 15) * 100), 100);

  const rawPri = raw.priority_score ?? raw.priorityScore;
  const priorityScore = rawPri != null
    ? Math.min(Math.round(rawPri * 100), 100)
    : Math.min(severityScore + 5, 100);

  const sev: SeverityLevel =
    severityScore >= 80 ? 'critical' : severityScore >= 60 ? 'high' : severityScore >= 40 ? 'medium' : 'low';

  const damageType = raw.damage_type ?? raw.damageType ?? 'Road Damage';
  const lower = damageType.toLowerCase();

  return {
    severity: sev,
    severityScore,
    priorityScore,
    confidence: raw.confidence ?? 0.85,
    damageType,
    estimatedArea: raw.estimated_area ?? raw.estimatedArea ?? 1.0,
    urgencyReason: raw.urgency_reason ?? raw.urgencyReason ?? 'Infrastructure damage',
    detectedFeatures: raw.detected_features ?? raw.detectedFeatures ?? [],
    suggestedCategory: lower.includes('pothole') ? 'pothole'
      : lower.includes('crack') ? 'crack'
      : 'other',
  };
}

// ─── Map Location Picker ──────────────────────────────────────────────────────
const LocationPicker: React.FC<{ onPick: (ll: LatLng) => void }> = ({ onPick }) => {
  useMapEvents({ click: (e) => onPick(e.latlng) });
  return null;
};

const FlyToLocation: React.FC<{ position: LatLng | null }> = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 1.5 });
  }, [map, position]);
  return null;
};

// ─── Duplicate Report Modal ───────────────────────────────────────────────────
const IMG_BASE = 'http://localhost:5000';
const resolveImg = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${IMG_BASE}${url.startsWith('/') ? url : `/${url}`}`;
};

const DuplicateModal: React.FC<{
  report: BackendReport;
  onUpvote: () => void;
  onSubmitAnyway: () => void;
  upvoting: boolean;
}> = ({ report, onUpvote, onSubmitAnyway, upvoting }) => {
  const imgSrc = resolveImg(report.image_url);
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md cs-card overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-border bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
              <AlertTriangle size={18} className="text-yellow-400" />
            </div>
            <div>
              <p className="font-display text-lg font-black text-white uppercase tracking-wide">
                Report Already Exists
              </p>
              <p className="text-xs text-gray-400">A report was already filed at this location.</p>
            </div>
          </div>
        </div>

        {/* Existing report preview */}
        <div className="p-5">
          <div className="flex gap-3 p-3 bg-bg-elevated rounded-xl border border-border mb-4">
            {imgSrc ? (
              <img src={imgSrc} alt="existing"
                className="w-20 h-16 rounded-lg object-cover flex-shrink-0 border border-border"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-20 h-16 rounded-lg bg-bg-card border border-border flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-gray-600" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-display uppercase tracking-wider text-amber mb-1">
                {report.category?.replace(/_/g, ' ') || 'Report'}
              </p>
              <p className="text-sm text-gray-200 line-clamp-2 leading-snug">
                {report.description || 'No description provided.'}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                <span className="capitalize">{report.status?.replace(/_/g, ' ')}</span>
                <span>· {report.upvote_count ?? 0} upvotes</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Would you like to <strong className="text-white">upvote</strong> the existing report to boost its priority,
            or <strong className="text-white">discard</strong> your new submission?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onUpvote}
              disabled={upvoting}
              className="flex-1 btn-primary py-3 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {upvoting
                ? <><div className="spinner w-4 h-4 border-2" /> Upvoting…</>
                : <><ThumbsUp size={15} /> Upvote & Discard Mine</>
              }
            </button>
            <button
              onClick={onSubmitAnyway}
              className="flex-1 py-3 rounded-xl text-sm border border-border bg-bg-elevated text-gray-300 hover:text-white hover:border-gray-500 transition flex items-center justify-center gap-2"
            >
              <ArrowRight size={15} /> Upload Anyway
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const ReportIssue: React.FC = () => {
  const navigate = useNavigate();

  // Step: 0 = Upload, 1 = Details
  const [step, setStep] = useState(0);

  // Step 1 state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Step 2 state
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LatLng | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  // AI "normal" (no damage) detection
  const [normalDetected, setNormalDetected] = useState(false);

  // Duplicate detection
  const [duplicateReport, setDuplicateReport] = useState<BackendReport | null>(null);
  const [upvotingDuplicate, setUpvotingDuplicate] = useState(false);

  // ─── Dropzone ─────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setAiResult(null);
    setNormalDetected(false);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
  });


  // ─── Shared: process AI result (used by both analyze and retry) ─────────────
  const processAIResult = (rawResult: any): boolean => {
    if ((rawResult.damage_type ?? '').toLowerCase() === 'normal') {
      setNormalDetected(true);
      return false;
    }
    const normalised = normaliseAIResponse(rawResult);
    setAiResult(normalised);
    setCategory(normalised.suggestedCategory || 'other');
    setNormalDetected(false);
    return true;
  };

  // ─── Step 1: Call AI service ──────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!imageFile) { toast.error('Please upload an image first.'); return; }
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res = await aiAPI.analyze(fd);
      const url = res.data?.image_url ?? res.data?.imageUrl ?? '';
      setImageUrl(url);
      if (res.status === 207) {
        const fallback = mockFallback();
        setAiResult(fallback);
        setCategory(fallback.suggestedCategory);
        toast('AI service unavailable — using estimated results.', { icon: '⚠️' });
        setStep(1);
        return;
      }
      const ok = processAIResult(res.data.result ?? res.data);
      if (ok) { toast.success('AI analysis complete!'); setStep(1); }
    } catch (err: any) {
      console.warn('AI service unavailable, using mock:', err?.message);
      const fallback = mockFallback();
      setAiResult(fallback);
      setCategory(fallback.suggestedCategory);
      toast('AI service unavailable — showing estimated results.', { icon: '⚠️' });
      setStep(1);
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Retry analysis (for "normal" / no-damage result) ────────────────────
  const handleRetry = async () => {
    if (!imageFile) return;
    setAnalyzing(true);
    setNormalDetected(false);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      const res = await aiAPI.analyze(fd);
      const url = res.data?.image_url ?? res.data?.imageUrl ?? imageUrl;
      setImageUrl(url);
      if (res.status === 207) {
        setNormalDetected(true);
        toast.error('AI service unavailable. Try again later.');
        return;
      }
      const ok = processAIResult(res.data.result ?? res.data);
      if (ok) { toast.success('Analysis complete!'); setStep(1); }
      else toast('Still no damage detected. Try a clearer photo.', { icon: '⚠️' });
    } catch {
      setNormalDetected(true);
      toast.error('AI service unavailable. Try again later.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Auto-fetch location when entering step 2 ────────────────────────────
  useEffect(() => {
    if (step !== 1 || location) return;
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(latLng(coords.latitude, coords.longitude));
        setLocating(false);
      },
      () => { setLocating(false); },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [step]);

  // ─── Manual GPS fallback button ───────────────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(latLng(coords.latitude, coords.longitude));
        setLocating(false);
        toast.success('Current location detected!');
      },
      () => {
        toast.error('Could not get your location. Please select manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // ─── Do the actual API submit ─────────────────────────────────────────────
  const doSubmit = async () => {
    setSubmitting(true);
    setDuplicateReport(null);
    try {
      await reportsAPI.create({
        image_url: imageUrl,
        aiResult: {
          damage_type: aiResult!.damageType,
          severity_score: +((aiResult!.severityScore / 100) * 15).toFixed(2),
          priority_score: +(aiResult!.priorityScore / 100).toFixed(4),
          confidence: aiResult!.confidence,
        },
        description,
        lat: location!.lat,
        lng: location!.lng,
        categoryByUser: category,
      } as any);
      toast.success('Report submitted successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Step 2: Submit — check for duplicate lat/lng first ──────────────────
  const handleSubmit = async () => {
    if (!location) { toast.error('Please select a location on the map.'); return; }
    if (!description.trim()) { toast.error('Please add a description.'); return; }
    if (!aiResult) { toast.error('AI result missing — please go back.'); return; }
    if (!imageUrl) { toast.error('Image upload failed — please go back and re-upload.'); return; }

    setSubmitting(true);
    try {
      const res = await reportsAPI.getAll();
      const existing: BackendReport[] = Array.isArray(res.data) ? res.data : [];
      const THRESHOLD = 0.00005; // ~5 m — only exact same pin
      const dup = existing.find(r =>
        r.lat != null && r.lng != null &&
        r.category === category &&
        Math.abs(r.lat - location.lat) < THRESHOLD &&
        Math.abs(r.lng - location.lng) < THRESHOLD
      );
      if (dup) {
        setDuplicateReport(dup);
        setSubmitting(false);
        return;
      }
    } catch {
      // If the check fails, allow submission to proceed
    }
    setSubmitting(false);
    await doSubmit();
  };

  // ─── Duplicate modal handlers ─────────────────────────────────────────────
  const handleUpvoteDuplicate = async () => {
    if (!duplicateReport) return;
    setUpvotingDuplicate(true);
    try {
      const statusRes = await upvoteAPI.getStatus(duplicateReport.id);
      if (statusRes.data.hasUpvoted) {
        toast('You already upvoted this report!', { icon: '👍' });
      } else {
        await upvoteAPI.toggle(duplicateReport.id);
        toast.success('Upvoted! Thanks for supporting this report.');
      }
    } catch {
      toast.error('Could not upvote — please try again.');
    } finally {
      setUpvotingDuplicate(false);
      navigate('/dashboard');
    }
  };

  const handleDiscardDuplicate = () => {
    setDuplicateReport(null);
    navigate('/dashboard');
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-16 bg-grid noise">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Step Indicator */}
        <div className="mb-10">
          <div className="flex items-center relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-amber transition-all duration-500"
              style={{ width: step === 0 ? '0%' : '100%' }}
            />
            {['Upload & Analyze', 'Fill Details & Submit'].map((label, i) => (
              <div key={label} className="relative flex flex-col items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-display font-bold border-2 transition-all duration-300 z-10 ${
                  i < step
                    ? 'bg-amber border-amber text-white'
                    : i === step
                      ? 'bg-bg-card border-amber text-amber'
                      : 'bg-bg-card border-border text-gray-500'
                }`}>
                  {i < step ? <CheckCircle2 size={14} /> : i + 1}
                </div>
                <span className={`text-xs font-display uppercase tracking-wider text-center ${
                  i === step ? 'text-amber' : i < step ? 'text-gray-400' : 'text-gray-600'
                }`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ══ STEP 0: Upload ══ */}
          {step === 0 && (
            <motion.div
              key="step-upload"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              <div className="cs-card p-6 mb-4">
                <h2 className="font-display text-3xl font-black text-white mb-1">UPLOAD PHOTO</h2>
                <p className="text-gray-400 text-sm mb-5">
                  Upload a clear photo of the road damage. Our AI will analyse it instantly.
                </p>

                {/* Dropzone */}
                {!preview ? (
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
                        <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, WebP • 1 photo • Max 10 MB</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-bg-elevated">
                    <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setImageFile(null); setPreview(''); setAiResult(null); }}
                      className="absolute top-3 right-3 w-8 h-8 bg-bg-primary/80 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-3 left-3 text-xs font-mono bg-bg-primary/70 px-2 py-0.5 rounded text-gray-300">
                      {imageFile && (imageFile.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={!imageFile || analyzing}
                className="btn-primary w-full py-4 rounded-xl text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {analyzing
                  ? <><div className="spinner w-5 h-5 border-2" /> Analyzing...</>
                  : <><Brain size={20} /> Analyze with AI <ChevronRight size={18} /></>
                }
              </button>

              {/* No damage detected */}
              {normalDetected && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 cs-card p-5 border-yellow-500/20 bg-yellow-500/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={18} className="text-yellow-400" />
                    <p className="font-display font-bold text-yellow-300 text-sm uppercase tracking-wide">
                      No Damage Detected
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mb-4">
                    The AI found no road damage in this photo. Try a clearer image of the damage, or go back to dashboard.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      disabled={analyzing}
                      className="flex-1 btn-primary py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {analyzing
                        ? <><div className="spinner w-4 h-4 border-2" /> Retrying...</>
                        : <><Brain size={14} /> Retry Analysis</>
                      }
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 btn-secondary py-2.5 rounded-xl text-sm flex items-center justify-center gap-2"
                    >
                      <ArrowRight size={14} /> Dashboard
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ══ STEP 1: AI Result + Details ══ */}
          {step === 1 && aiResult && (
            <motion.div
              key="step-details"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            >
              {/* AI Result card */}
              <div className="cs-card p-5 mb-4">
                <h2 className="font-display text-2xl font-black text-white mb-1">AI ANALYSIS RESULT</h2>
                <p className="text-gray-400 text-sm mb-4">Review the AI assessment. You can change the category below.</p>

                {/* Image + score row */}
                <div className="flex gap-4 mb-4 p-4 bg-bg-elevated rounded-xl border border-border">
                  {preview && (
                    <div className="w-24 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={preview} alt="uploaded" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <SeverityBadge severity={aiResult.severity} size="md" />
                      <span className="text-xs font-mono text-gray-500">
                        {(aiResult.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="font-display text-lg font-bold text-white">{aiResult.damageType}</p>
                    <p className="text-xs text-gray-400">{aiResult.urgencyReason}</p>
                  </div>
                  <PriorityRing score={aiResult.priorityScore} size={64} />
                </div>

                {/* Scores */}
                <div className="space-y-2 mb-4">
                  <SeverityBar score={aiResult.severityScore} label="Damage Severity" />
                  <SeverityBar score={aiResult.priorityScore} label="Priority Score" />
                  <SeverityBar score={Math.round(aiResult.confidence * 100)} label="AI Confidence" />
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { icon: BarChart3, label: 'Area', val: `${aiResult.estimatedArea} m²` },
                    { icon: Clock,     label: 'SLA',  val: aiResult.severity === 'critical' ? '< 24h' : '< 48h' },
                  ].map(s => (
                    <div key={s.label} className="p-3 bg-bg-elevated rounded-xl text-center">
                      <s.icon size={15} className="text-amber mx-auto mb-1" />
                      <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                      <p className="text-xs font-bold text-white leading-tight">{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Detected features */}
                {aiResult.detectedFeatures.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {aiResult.detectedFeatures.map(f => (
                      <span key={f} className="px-2 py-0.5 bg-bg-elevated rounded-full text-xs text-gray-400 border border-border">{f}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Fill details form */}
              <div className="cs-card p-5 mb-4 space-y-4">
                <h2 className="font-display text-2xl font-black text-white mb-1">FILL DETAILS</h2>

                {/* Category — editable, pre-filled by AI */}
                <div>
                  <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">
                    Category <span className="text-amber">(AI-suggested, editable)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id} type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-display uppercase tracking-wider border transition-all ${
                          category === cat.id
                            ? 'bg-amber/10 border-amber/30 text-amber'
                            : 'bg-bg-elevated border-border text-gray-400 hover:border-amber/20'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-display uppercase tracking-widest text-gray-400 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe the damage — size, hazards, how long it has been there..."
                    className="cs-input w-full px-4 py-3 rounded-xl text-sm resize-none"
                  />
                </div>

                {/* Map location picker */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-xs font-display uppercase tracking-widest text-gray-400">
                      <MapPin size={12} className="text-amber" />
                      Select Location on Map *
                    </label>
                    <button
                      type="button"
                      onClick={handleUseCurrentLocation}
                      disabled={locating}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber/30 bg-amber/10 text-amber hover:bg-amber/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {locating
                        ? <><div className="spinner w-3 h-3 border-2" /> Detecting...</>
                        : <><Navigation size={12} /> Use Current Location</>
                      }
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">Click on the map to pin the exact location, or use your current location.</p>

                  <MapContainer
                    center={[19.09, 74.74]}
                    zoom={12}
                    style={{ height: '260px', borderRadius: '12px', border: '1px solid #1E293B' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap contributors'
                    />
                    <LocationPicker onPick={setLocation} />
                    <FlyToLocation position={location} />
                    {location && <Marker position={location} />}
                  </MapContainer>

                  {location ? (
                    <p className="text-xs text-amber mt-2 flex items-center gap-1">
                      <CheckCircle2 size={11} />
                      Pinned: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">No location selected yet — tap the map.</p>
                  )}
                </div>
              </div>

              {/* Notice */}
              <div className="cs-card p-4 mb-4 flex gap-3 border-amber/20 bg-amber/5">
                <Zap size={16} className="text-amber flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Your report will be analysed by our AI on submission and automatically
                  routed to the relevant city department.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="btn-secondary px-6 py-4 rounded-xl flex items-center gap-2"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !location || !description.trim()}
                  className="btn-primary flex-1 py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? <><div className="spinner w-5 h-5 border-2" /> Submitting...</>
                    : <><AlertTriangle size={18} /> Submit Report</>
                  }
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Duplicate report modal */}
      <AnimatePresence>
        {duplicateReport && (
          <DuplicateModal
            report={duplicateReport}
            onUpvote={handleUpvoteDuplicate}
            onSubmitAnyway={doSubmit}
            upvoting={upvotingDuplicate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportIssue;
