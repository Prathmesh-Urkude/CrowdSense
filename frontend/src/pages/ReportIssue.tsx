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
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  Camera, MapPin, Brain, CheckCircle2, AlertTriangle,
  X, ChevronRight, ChevronLeft, Zap, BarChart3,
  Clock, Upload, Navigation, ThumbsUp, ExternalLink,
} from 'lucide-react';
import { SeverityBadge, SeverityBar, PriorityRing } from '../components/SeverityBadge';
import toast from 'react-hot-toast';
import { aiAPI, reportsAPI, upvoteAPI } from '../utils/api';
import type { BackendReport, SeverityLevel } from '../types';

// ─── Haversine distance (metres between two lat/lng points) ──────────────────
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DUPLICATE_RADIUS_M = 100; // within 100 metres = likely duplicate

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

/** Normalise whatever the AI service returns into our AIResult shape */
function normaliseAIResponse(raw: any): AIResult {
  const score = raw.severity_score ?? raw.severityScore ?? 50;
  const sev: SeverityLevel =
    score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low';
  return {
    severity: sev,
    severityScore: score,
    priorityScore: raw.priority_score ?? raw.priorityScore ?? Math.min(score + 5, 100),
    confidence: raw.confidence ?? 0.85,
    damageType: raw.damage_type ?? raw.damageType ?? 'Road Damage',
    estimatedArea: raw.estimated_area ?? raw.estimatedArea ?? 1.0,
    urgencyReason: raw.urgency_reason ?? raw.urgencyReason ?? 'Infrastructure damage',
    detectedFeatures: raw.detected_features ?? raw.detectedFeatures ?? [],
    suggestedCategory: (raw.damage_type ?? raw.damageType ?? '').toLowerCase().includes('pothole')
      ? 'pothole'
      : 'crack',
  };
}

// ─── Image fingerprint helpers ────────────────────────────────────────────────
// Uses size + lastModified + name — synchronous, works on HTTP/localhost, no crypto API needed.
function getFileFingerprint(file: File): string {
  return `${file.size}-${file.lastModified}-${file.name}`;
}

const LS_KEY = 'crowdsense_img_submissions';
const getStoredHashes = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
};
const saveImageHash = (fp: string, reportId: string) => {
  const stored = getStoredHashes();
  stored[fp] = reportId;
  localStorage.setItem(LS_KEY, JSON.stringify(stored));
};

// ─── Duplicate Report Modal (location-based only) ────────────────────────────
const DuplicateModal: React.FC<{
  report: BackendReport;
  distanceM: number;
  onContinue: () => void;
  onDiscard: () => void;
}> = ({ report, distanceM, onContinue, onDiscard }) => {
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(report.upvote_count ?? 0);

  const handleUpvote = async () => {
    try {
      await upvoteAPI.toggle(report.id);
      setUpvoted(p => !p);
      setUpvoteCount(p => !upvoted ? p + 1 : Math.max(0, p - 1));
      toast.success(!upvoted ? 'Upvoted! This helps prioritise the fix.' : 'Upvote removed.');
    } catch {
      toast.error('Please log in to upvote.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 w-full max-w-md cs-card p-6"
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-amber" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-white">Similar Report Nearby</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              A report exists <span className="text-amber font-semibold">{Math.round(distanceM)}m away</span> from your selected location.
            </p>
          </div>
        </div>

        {/* Existing report preview */}
        <div className="cs-card p-4 mb-5 bg-bg-elevated">
          <div className="flex gap-3">
            {report.image_url ? (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                <img src={`http://localhost:5000${report.image_url}`} alt="existing report" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl bg-bg-card border border-border flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-gray-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white capitalize mb-1">
                {report.category?.replace(/_/g, ' ') || 'Road Damage'}
              </p>
              {report.description && (
                <p className="text-xs text-gray-400 line-clamp-2">{report.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-500">{upvoteCount} upvotes</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber/10 border border-amber/20 text-amber capitalize">
                  {report.status ?? 'reported'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleUpvote}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs border transition-all ${
                upvoted ? 'bg-amber/10 border-amber/30 text-amber' : 'bg-bg-card border-border text-gray-400 hover:border-amber/20'
              }`}
            >
              <ThumbsUp size={12} className={upvoted ? 'fill-amber' : ''} />
              {upvoted ? 'Upvoted!' : 'Upvote this report'}
            </button>
            <Link
              to={`/issues/${report.id}`}
              target="_blank"
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs border border-border bg-bg-card text-gray-400 hover:text-amber hover:border-amber/20 transition"
            >
              <ExternalLink size={12} /> View
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4 text-center">
          Upvoting the existing report helps get it fixed faster instead of creating a duplicate.
        </p>

        <div className="flex gap-3">
          <button onClick={onDiscard} className="flex-1 py-3 rounded-xl text-sm border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition font-semibold">
            Discard Mine
          </button>
          <button onClick={onContinue} className="flex-1 py-3 rounded-xl text-sm border border-border bg-bg-elevated text-gray-300 hover:text-white hover:border-gray-500 transition">
            Continue Anyway
          </button>
        </div>
      </motion.div>
    </div>
  );
};

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

  // Duplicate detection state
  const [allReports, setAllReports] = useState<BackendReport[]>([]);
  const [nearbyReport, setNearbyReport] = useState<BackendReport | null>(null);
  const [pendingLocation, setPendingLocation] = useState<LatLng | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [currentFileHash, setCurrentFileHash] = useState<string>('');

  // ─── Dropzone ─────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;

    const fp = getFileFingerprint(file);

    // 1. Check DB first (cross-session, cross-user)
    try {
      const res = await reportsAPI.checkDuplicate(fp);
      if (res.data.duplicate && res.data.report) {
        const existing = res.data.report;
        try { await upvoteAPI.toggle(existing.id); } catch { /* already upvoted / not logged in */ }
        toast.success(
          'This photo was already reported! We upvoted that report to help get it fixed faster.',
          { duration: 5000 }
        );
        navigate(`/issues/${existing.id}`);
        return;
      }
    } catch {
      // DB check failed — fall through to localStorage fallback
    }

    // 2. Fallback: localStorage (same browser, older reports pre-DB)
    const existingId = getStoredHashes()[fp];
    if (existingId) {
      try {
        await upvoteAPI.toggle(existingId);
        toast.success(
          'This photo was already reported! We upvoted that report to help get it fixed faster.',
          { duration: 5000 }
        );
        navigate(`/issues/${existingId}`);
        return;
      } catch {
        const stored = getStoredHashes();
        delete stored[fp];
        localStorage.setItem(LS_KEY, JSON.stringify(stored));
      }
    }

    // No duplicate — proceed normally
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setAiResult(null);
    setCurrentFileHash(fp);
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
  });

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
      const normalised = normaliseAIResponse(res.data.result ?? res.data);
      setAiResult(normalised);
      setCategory(normalised.suggestedCategory || 'other');
      toast.success('AI analysis complete!');
      setStep(1);
    } catch (err: any) {
      // AI service down — backend still returns image_url in error body (HTTP 207)
      const errData = err?.response?.data;
      const savedUrl = errData?.image_url ?? '';
      if (savedUrl) setImageUrl(savedUrl);

      const fallback = mockFallback();
      setAiResult(fallback);
      setCategory(fallback.suggestedCategory);
      toast('AI service unavailable — using estimated results.', { icon: '⚠️' });
      setStep(1);
    } finally {
      setAnalyzing(false);
    }
  };

  // ─── Fetch all reports when entering step 2 (for duplicate detection) ───
  useEffect(() => {
    if (step !== 1) return;
    reportsAPI.getAll().then(res => {
      setAllReports(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, [step]);

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

  // ─── Location pick with duplicate check ──────────────────────────────────
  const handleLocationPick = (ll: LatLng) => {
    const nearby = allReports.find(r => {
      if (r.lat == null || r.lng == null) return false;
      return haversineDistance(ll.lat, ll.lng, r.lat, r.lng) <= DUPLICATE_RADIUS_M;
    }) ?? null;

    if (nearby) {
      setPendingLocation(ll);
      setNearbyReport(nearby);
      setShowDuplicateModal(true);
    } else {
      setLocation(ll);
    }
  };

  // ─── Step 2: Submit report ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!location) { toast.error('Please select a location on the map.'); return; }
    if (!description.trim()) { toast.error('Please add a description.'); return; }
    if (!aiResult) { toast.error('AI result missing — please go back.'); return; }
    if (!imageUrl) { toast.error('Image upload failed — please go back and re-upload.'); return; }

    setSubmitting(true);
    try {
      const result = await reportsAPI.create({
        image_url: imageUrl,
        aiResult: {
          damage_type: aiResult.damageType,
          severity_score: aiResult.severityScore,
          priority_score: aiResult.priorityScore,
          confidence: aiResult.confidence,
        },
        description,
        lat: location.lat,
        lng: location.lng,
        categoryByUser: category,
        file_fingerprint: currentFileHash || undefined,
      } as any);
      const newId = (result.data as any)?.report?.id;
      if (currentFileHash && newId) saveImageHash(currentFileHash, newId);
      toast.success('Report submitted successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Failed to submit report.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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
                    <LocationPicker onPick={handleLocationPick} />
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

      {/* ─── Nearby Location Duplicate Modal ───────────────────────────── */}
      {showDuplicateModal && nearbyReport && pendingLocation && (
        <DuplicateModal
          report={nearbyReport}
          distanceM={haversineDistance(
            pendingLocation.lat, pendingLocation.lng,
            nearbyReport.lat!, nearbyReport.lng!
          )}
          onContinue={() => {
            setLocation(pendingLocation);
            setShowDuplicateModal(false);
            setNearbyReport(null);
            setPendingLocation(null);
          }}
          onDiscard={() => {
            setShowDuplicateModal(false);
            setNearbyReport(null);
            setPendingLocation(null);
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
};

export default ReportIssue;
