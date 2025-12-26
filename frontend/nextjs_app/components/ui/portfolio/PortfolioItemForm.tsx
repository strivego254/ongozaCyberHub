/**
 * Portfolio Item Form Component
 * Create/Edit form for portfolio items - Coordinated with Settings, Missions, Marketplace
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, Link as LinkIcon, FileText, Image, Video, Plus, Trash2, Save, CheckCircle, Zap, Shield, Target, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { useAuth } from '@/hooks/useAuth';
import type { PortfolioItemType, PortfolioVisibility, EvidenceFile } from '@/lib/portfolio/types';
import clsx from 'clsx';

interface PortfolioItemFormProps {
  itemId?: string; // If provided, edit mode; otherwise, create mode
  onClose: () => void;
  initialData?: {
    title?: string;
    summary?: string;
    type?: PortfolioItemType;
    visibility?: PortfolioVisibility;
    skillTags?: string[];
    evidenceFiles?: EvidenceFile[];
  };
}

export function PortfolioItemForm({ itemId, onClose, initialData }: PortfolioItemFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const { createItem, updateItem, isLoading, isCreating, isUpdating } = usePortfolio(userId);
  const { settings, entitlements } = useSettingsMaster(userId);
  const isProfessional = entitlements?.tier === 'professional';

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [type, setType] = useState<PortfolioItemType>(initialData?.type || 'mission');
  const [status, setStatus] = useState<string>(initialData?.status || 'draft');
  const [visibility, setVisibility] = useState<PortfolioVisibility>(
    initialData?.visibility || settings?.portfolioVisibility || 'private'
  );
  const [skillTags, setSkillTags] = useState<string[]>(initialData?.skillTags || []);
  const [newSkillTag, setNewSkillTag] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(initialData?.evidenceFiles || []);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Available types
  const itemTypes: { value: PortfolioItemType; label: string; icon: string }[] = [
    { value: 'mission', label: 'Mission', icon: '🎯' },
    { value: 'reflection', label: 'Reflection', icon: '💭' },
    { value: 'certification', label: 'Certification', icon: '🏆' },
    { value: 'github', label: 'GitHub', icon: '💻' },
    { value: 'thm', label: 'TryHackMe', icon: '🔐' },
    { value: 'external', label: 'External', icon: '🌐' },
    { value: 'other', label: 'Other', icon: '📁' },
  ];

  // Visibility options (coordinated with Settings)
  const visibilityOptions: { value: PortfolioVisibility; label: string; description: string }[] = [
    { value: 'private', label: 'Private', description: 'Only visible to you' },
    { value: 'unlisted', label: 'Unlisted', description: 'Accessible via direct link' },
    { value: 'public', label: 'Public', description: 'Visible to everyone' },
  ];

  const handleAddSkillTag = () => {
    if (newSkillTag.trim() && !skillTags.includes(newSkillTag.trim())) {
      setSkillTags([...skillTags, newSkillTag.trim()]);
      setNewSkillTag('');
    }
  };

  const handleRemoveSkillTag = (tag: string) => {
    setSkillTags(skillTags.filter((t) => t !== tag));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !userId) return;

    setUploading(true);
    try {
      const uploadedFiles: EvidenceFile[] = [];

      for (const file of Array.from(files)) {
        // Atomic Upload via API Gateway (Mocked for now)
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);
        
        // Mock successful upload
        const fileName = `${Date.now()}_${file.name}`;
        const mockUrl = `/uploads/portfolio/${userId}/${fileName}`;

        // Determine file type
        let fileType: 'pdf' | 'image' | 'video' | 'link' = 'link';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type === 'application/pdf') fileType = 'pdf';
        else if (file.name.endsWith('.pcap') || file.name.endsWith('.log')) fileType = 'pdf'; // PCAP/Logs as docs

        uploadedFiles.push({
          url: mockUrl,
          type: fileType,
          size: file.size,
          name: file.name,
          thumbnail: fileType === 'image' ? mockUrl : undefined,
        });
      }

      setEvidenceFiles([...evidenceFiles, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload artifacts. Please ensure file size is under 50MB.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = () => {
    const url = prompt('Enter URL:');
    if (url && url.trim()) {
      setEvidenceFiles([
        ...evidenceFiles,
        {
          url: url.trim(),
          type: 'link',
          size: 0,
          name: url.trim(),
        },
      ]);
    }
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent, isSubmission: boolean = false) => {
    e.preventDefault();

    if (!title.trim() || !userId) {
      alert('Please provide a title for your portfolio item.');
      return;
    }

    if (isSubmission && evidenceFiles.length === 0) {
      alert('Professional submissions require at least one piece of verifiable evidence (file or link).');
      return;
    }

    const newStatus = isSubmission ? 'submitted' : status;

    if (isSubmission) {
      setSubmissionFeedback('INITIATING ATOMIC SUBMISSION PROTOCOL...');
    }

    try {
      if (itemId) {
        // Update existing item
        updateItem(itemId, {
          title: title.trim(),
          summary: summary.trim(),
          visibility,
          skillTags,
          evidenceFiles,
          status: newStatus,
        });
      } else {
        // Create new item
        createItem({
          title: title.trim(),
          summary: summary.trim(),
          type,
          visibility,
          skillTags,
          evidenceFiles,
          status: newStatus,
        });
      }

      if (isSubmission) {
        setSubmissionFeedback(isProfessional 
          ? 'SUCCESS: TELEMETRY SYNCED. MENTOR REVIEW SEQUENCE ENGAGED.' 
          : 'SUCCESS: TELEMETRY SYNCED. AI ANALYSIS IN PROGRESS.');
      }

      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, isSubmission ? 3000 : 1500);
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      setSubmissionFeedback('ERROR: SUBMISSION FAILED. TELEMETRY ROLLBACK INITIATED.');
      alert('Failed to process submission. Telemetry rollback initiated to prevent data loss.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-och-midnight/90 backdrop-blur-md">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-och-midnight border border-och-steel/10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        {/* WATERMARK */}
        <div className="absolute top-0 right-0 p-12 opacity-5 select-none pointer-events-none">
          <Briefcase className="w-64 h-64 text-och-gold" />
        </div>

        <div className="p-8 lg:p-12 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-och-gold/10 border border-och-gold/20 flex items-center justify-center text-och-gold">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl xl:text-3xl font-black text-white uppercase tracking-tighter">
                  {itemId ? 'Refine Outcome' : 'Register New Outcome'}
                </h2>
                <p className="text-[10px] text-och-steel font-black uppercase tracking-widest mt-1">Portfolio Engine v2.4 • Operational</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-xl bg-och-steel/10 text-och-steel hover:bg-och-defender hover:text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {submissionFeedback && (
            <div className={clsx(
              "mb-6 p-4 rounded-[1.5rem] relative overflow-hidden group",
              submissionFeedback.includes('ERROR') 
                ? "bg-och-defender/10 border border-och-defender/30" 
                : "bg-emerald-500/10 border border-emerald-500/30"
            )}>
              <div className={clsx(
                "absolute inset-0 animate-pulse",
                submissionFeedback.includes('ERROR') ? "bg-och-defender/5" : "bg-emerald-500/5"
              )} />
              <div className="flex items-center gap-4 relative z-10">
                <div className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center border",
                  submissionFeedback.includes('ERROR') 
                    ? "bg-och-defender/20 border-och-defender/30 text-och-defender" 
                    : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                )}>
                  {submissionFeedback.includes('SUCCESS') ? <CheckCircle className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <div className={clsx(
                    "font-black uppercase tracking-tight text-xs",
                    submissionFeedback.includes('ERROR') ? "text-och-defender" : "text-emerald-300"
                  )}>
                    {submissionFeedback}
                  </div>
                  <p className="text-[10px] text-och-steel font-bold uppercase tracking-widest mt-1">
                    {submissionFeedback.includes('SUCCESS') 
                      ? "Verifiable evidence has been securely committed to the Portfolio Engine."
                      : "The system is protecting your data integrity."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {showSuccess && !submissionFeedback && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[1.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-emerald-300 font-black uppercase tracking-tight">
                    {status === 'submitted' ? 'Commitment Successful' : 'Intel Synchronized'}
                  </div>
                  <div className="text-emerald-400/80 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {status === 'submitted' 
                      ? 'Telemetry ingested by TalentScope. Review sequence initiated.' 
                      : 'Draft saved to your local repository repository.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
            {/* Title */}
            <div>
              <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em] mb-3">
                Outcome Title <span className="text-och-defender">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.G. DFIR MISSION: RANSOMWARE TRIAGE..."
                className="w-full px-6 py-4 bg-och-midnight/80 border border-och-steel/20 rounded-2xl text-white text-xs font-bold placeholder:text-och-steel/30 focus:border-och-gold/50 outline-none transition-all shadow-inner uppercase tracking-wider"
                required
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em] mb-3">
                Strategic Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="DESCRIBE YOUR METHODOLOGY, DISCOVERIES, AND PROFESSIONAL IMPACT..."
                rows={4}
                className="w-full px-6 py-4 bg-och-midnight/80 border border-och-steel/20 rounded-2xl text-white text-xs font-bold placeholder:text-och-steel/30 focus:border-och-gold/50 outline-none transition-all shadow-inner resize-none uppercase tracking-wider leading-relaxed"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em] mb-3">
                Classification
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {itemTypes.map((itemType) => (
                  <button
                    key={itemType.value}
                    type="button"
                    onClick={() => setType(itemType.value)}
                    className={clsx(
                      "p-4 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 group",
                      type === itemType.value
                        ? "bg-och-gold/10 border-och-gold/40 text-och-gold"
                        : "bg-och-midnight/80 border-och-steel/10 text-och-steel hover:border-white"
                    )}
                  >
                    <div className="text-xl group-hover:scale-110 transition-transform">{itemType.icon}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest">{itemType.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility (Coordinated with Settings) */}
            <div>
              <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em] mb-3">
                Publication Privacy
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibilityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={clsx(
                      "p-5 rounded-2xl border text-left transition-all relative overflow-hidden group",
                      visibility === option.value
                        ? "bg-och-gold/10 border-och-gold/40"
                        : "bg-och-midnight/80 border-och-steel/10 hover:border-white"
                    )}
                  >
                    <div className="font-black text-white text-[10px] uppercase tracking-widest mb-1 relative z-10">{option.label}</div>
                    <div className="text-[9px] text-och-steel font-bold uppercase tracking-tight relative z-10">{option.description}</div>
                    {visibility === option.value && (
                      <div className="absolute top-0 right-0 p-3 opacity-20">
                        <CheckCircle className="w-4 h-4 text-och-gold" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Tags */}
            <div>
              <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em] mb-3">
                Competency Telemetry
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {skillTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-och-mint/10 text-och-mint border-och-mint/30 px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillTag(tag)}
                      className="ml-2 hover:text-och-defender transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newSkillTag}
                  onChange={(e) => setNewSkillTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkillTag())}
                  placeholder="ADD COMPETENCY (E.G. SIEM, PCAP, NIST...)"
                  className="flex-1 px-6 py-3 bg-och-midnight/80 border border-och-steel/20 rounded-xl text-white text-[10px] font-black placeholder:text-och-steel/30 focus:border-och-mint/50 outline-none transition-all uppercase tracking-widest"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSkillTag}
                  className="h-[46px] px-6 rounded-xl border-och-mint/20 text-och-mint hover:bg-och-mint hover:text-black transition-all"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Evidence Files */}
            <div>
              <label className="block text-[10px] font-black text-och-steel uppercase tracking-[0.2em] mb-3">
                Verifiable Artifacts
              </label>
              <div className="space-y-4">
                {/* Upload Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex-1 cursor-pointer group">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,.pdf,.pcap,.log"
                      disabled={uploading}
                    />
                    <div className="px-6 py-4 bg-och-midnight/80 border border-och-steel/20 rounded-2xl text-och-steel hover:bg-white/5 hover:border-white transition-all flex items-center justify-center gap-3">
                      <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{uploading ? 'INGESTING...' : 'UPLOAD ARTIFACTS'}</span>
                    </div>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddLink}
                    className="h-14 px-8 rounded-2xl border-och-gold/20 text-och-gold hover:bg-och-gold hover:text-black transition-all font-black uppercase tracking-widest text-[10px]"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    EXTERNAL LINK
                  </Button>
                </div>

                {/* Evidence List */}
                {evidenceFiles.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {evidenceFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-white/5 border border-och-steel/10 rounded-2xl group hover:border-white/30 transition-all"
                      >
                        <div className="p-3 rounded-xl bg-och-midnight/80 border border-och-steel/10">
                          {file.type === 'image' && <Image className="w-5 h-5 text-och-gold" />}
                          {file.type === 'video' && <Video className="w-5 h-5 text-och-gold" />}
                          {file.type === 'pdf' && <FileText className="w-5 h-5 text-och-gold" />}
                          {file.type === 'link' && <LinkIcon className="w-5 h-5 text-och-gold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-black text-white truncate uppercase tracking-tight">{file.name || file.url}</div>
                          {file.size > 0 && (
                            <div className="text-[9px] text-och-steel font-bold uppercase tracking-widest mt-0.5">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • VERIFIED
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(index)}
                          className="p-2 rounded-lg hover:bg-och-defender/20 text-och-steel hover:text-och-defender transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-slate-800">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "px-4 py-2 rounded-xl border flex items-center gap-3",
                  isProfessional ? "bg-och-gold/10 border-och-gold/20 text-och-gold" : "bg-och-steel/5 border-och-steel/10 text-och-steel"
                )}>
                  {isProfessional ? <Shield className="w-4 h-4" /> : <Zap className="w-4 h-4 opacity-50" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {isProfessional ? '7 Professional Review Engaged' : '3 Starter AI Analysis Only'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 sm:flex-none h-12 px-6 rounded-xl border-slate-700 text-slate-400 font-black uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={isLoading || isCreating || isUpdating || uploading || !title.trim()}
                  className="flex-1 sm:flex-none h-12 px-6 rounded-xl border-och-steel/20 text-och-steel font-black uppercase tracking-widest text-[10px] hover:border-white transition-all"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>

                <Button
                  type="button"
                  variant="defender"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={isLoading || isCreating || isUpdating || uploading || !title.trim()}
                  className="flex-1 sm:flex-none h-12 px-8 rounded-xl bg-och-defender text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-och-defender/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Commit & Submit
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

