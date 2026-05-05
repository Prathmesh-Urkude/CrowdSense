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

// ─── Duplicate detection helpers ─────────────────────────────────────────────
const LS_KEY = 'cs_reported_images';

const getStoredHashes = (): string[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};

const saveImageHash = (fp: string) => {
  const hashes = getStoredHashes();
  if (!hashes.includes(fp)) {
    localStorage.setItem(LS_KEY, JSON.stringify([...hashes, fp]));
  }
};

const getFileFingerprint = (file: File): string =>
  `${file.size}-${file.lastModified}-${file.name}`;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Duplicate Modal ──────────────────────────────────────────────────────────
const DuplicateModal: React.FC<{
  report: BackendReport;
  onUpvoteAndGo: () => void;
  onSubmitAnyway: () => void;
  onClose: () => void;
}> = ({ report, onUpvoteAndGo, onSubmitAnyway, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="relative z-10 w-full max-w-md cs-card p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-amber" />
          <h2 className="font-display text-lg font-bold text-white">Similar Report Exists</h2>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={18} /></button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        A report for this issue already exists nearby. Upvoting it raises its priority faster than filing a duplicate.
      </p>
      <div className="p-3 bg-bg-elevated rounded-xl border border-border mb-5">
        {report.image_url && (
          <img
            src={`http://localhost:5000${report.image_url}`}
            alt="existing report"
            className="w-full h-28 object-cover rounded-lg mb-2"
          />
        )}
        <p className="text-sm text-gray-300 line-clamp-2">{report.description || 'No description'}</p>
        <p className="text-xs text-gray-500 mt-1 capitalize">{report.category?.replace(/_/g, ' ')} · {report.status}</p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={onUpvoteAndGo}
          className="btn-primary w-full py-3 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          <ThumbsUp size={14} /> Upvote Existing Report
        </button>
        <Link
          to={`/issues/${report.id}`}
          className="w-full py-2.5 rounded-xl text-sm border border-border bg-bg-elevated text-gray-300 hover:text-white transition flex items-center justify-center gap-2"
        >
          <ExternalLink size={13} /> View Report
        </Link>
        <button
          onClick={onSubmitAnyway}
          className="text-xs text-gray-500 hover:text-gray-300 transition py-1"
        >
          Submit new report anyway
        </button>
      </div>
    </motion.div>
  </div>
);

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
  const [currentFileHash, setCurrentFileHash] = useState<string>('');

  // Step 2 state
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LatLng | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  // Duplicate detection state
  const [allReports, setAllReports] = useState<BackendReport[]>([]);
  const [nearbyReport, setNearbyReport] = useState<BackendReport | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    reportsAPI.getAll()
      .then(res => setAllReports(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, []);

  // ─── Dropzone ─────────────────────────────────────────────────────────────
  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;

    const fp = getFileFingerprint(file);
    setCurrentFileHash(fp);

    try {
      const dupRes = await reportsAPI.checkDuplicate(fp);
      const dup = dupRes.data as any;
      if (dup?.duplicate && dup?.report) {
        setNearbyReport(dup.report);
        setShowDuplicateModal(true);
        return;
      }
    } catch {
      if (getStoredHashes().includes(fp)) {
        toast.error('This image has already been reported.');
        return;
      }
    }

    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setAiResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
    multiple: false,
  });

  // ─── Handle location pick with geo-proximity duplicate check ─────────────
  const handleLocationPick = (ll: LatLng) => {
    const nearby = allReports.find(r =>
      r.lat != null && r.lng != null &&
      haversineDistance(ll.lat, ll.lng, r.lat, r.lng) < 100
    );
    if (nearby) {
      setPendingLocation(ll);
      setNearbyReport(nearby);
      setShowDuplicateModal(true);
    } else {
      setLocation(ll);
    }
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
      // HTTP 207: AI service failed but image was saved — use mock fallback
      if (res.status === 207) {
        const fallback = mockFallback();
        setAiResult(fallback);
        setCategory(fallback.suggestedCategory);
        toast('AI service unavailable — using estimated results.', { icon: '⚠️' });
        setStep(1);
        return;
      }
      const normalised = normaliseAIResponse(res.data.result ?? res.data);
      setAiResult(normalised);
      setCategory(normalised.suggestedCategory || 'other');
      toast.success('AI analysis complete!');
      setStep(1);
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

  // ─── Step 2: Submit report ────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!location) { toast.error('Please select a location on the map.'); return; }
    if (!description.trim()) { toast.error('Please add a description.'); return; }
    if (!aiResult) { toast.error('AI result missing — please go back.'); return; }
    if (!imageUrl) { toast.error('Image upload failed — please go back and re-upload.'); return; }

    setSubmitting(true);
    try {
      await reportsAPI.create({
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
      if (currentFileHash) saveImageHash(currentFileHash);
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

      {/* Duplicate modal */}
      {showDuplicateModal && nearbyReport && (
        <DuplicateModal
          report={nearbyReport}
          onUpvoteAndGo={async () => {
            try { await upvoteAPI.toggle(nearbyReport.id); toast.success('Upvoted!'); } catch {}
            navigate(`/issues/${nearbyReport.id}`);
          }}
          onSubmitAnyway={() => {
            if (pendingLocation) setLocation(pendingLocation);
            setPendingLocation(null);
            setShowDuplicateModal(false);
            setNearbyReport(null);
          }}
          onClose={() => {
            setPendingLocation(null);
            setShowDuplicateModal(false);
            setNearbyReport(null);
          }}
        />
      )}
    </div>
  );
};

export default ReportIssue;
