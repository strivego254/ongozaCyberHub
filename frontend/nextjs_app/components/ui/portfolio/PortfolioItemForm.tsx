/**
 * Portfolio Item Form Component
 * Create/Edit form for portfolio items - Coordinated with Settings, Missions, Marketplace
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, Link as LinkIcon, FileText, Image, Video, Plus, Trash2, Save } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';
import { useAuth } from '@/hooks/useAuth';
import type { PortfolioItemType, PortfolioVisibility, EvidenceFile } from '@/lib/portfolio/types';

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
  const { settings } = useSettingsMaster(userId);

  // Form state
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [type, setType] = useState<PortfolioItemType>(initialData?.type || 'mission');
  const [visibility, setVisibility] = useState<PortfolioVisibility>(
    initialData?.visibility || settings?.portfolioVisibility || 'private'
  );
  const [skillTags, setSkillTags] = useState<string[]>(initialData?.skillTags || []);
  const [newSkillTag, setNewSkillTag] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>(initialData?.evidenceFiles || []);
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
    { value: 'marketplace', label: 'Marketplace', icon: '🏪' },
  ];

  // Visibility options (coordinated with Settings)
  const visibilityOptions: { value: PortfolioVisibility; label: string; description: string }[] = [
    { value: 'private', label: 'Private', description: 'Only visible to you' },
    { value: 'unlisted', label: 'Unlisted', description: 'Accessible via direct link' },
    { value: 'marketplace_preview', label: 'Marketplace Preview', description: 'Visible in employer preview' },
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
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `portfolio-evidence/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('portfolio-evidence')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('portfolio-evidence')
          .getPublicUrl(filePath);

        // Determine file type
        let fileType: 'pdf' | 'image' | 'video' | 'link' = 'link';
        if (file.type.startsWith('image/')) fileType = 'image';
        else if (file.type.startsWith('video/')) fileType = 'video';
        else if (file.type === 'application/pdf') fileType = 'pdf';

        uploadedFiles.push({
          url: publicUrl,
          type: fileType,
          size: file.size,
          name: file.name,
          thumbnail: fileType === 'image' ? publicUrl : undefined,
        });
      }

      setEvidenceFiles([...evidenceFiles, ...uploadedFiles]);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !userId) {
      alert('Please provide a title for your portfolio item.');
      return;
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
        });
        
        // Show success and close
        setShowSuccess(true);
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 1500);
      } else {
        // Create new item
        createItem({
          title: title.trim(),
          summary: summary.trim(),
          type,
          visibility,
          skillTags,
          evidenceFiles,
        });
        
        // Show success message indicating mentors/directors will be notified
        setShowSuccess(true);
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 2000); // Longer delay to show the success message
      }
    } catch (error) {
      console.error('Error saving portfolio item:', error);
      alert('Failed to save portfolio item. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-indigo-500/50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-100">
              {itemId ? 'Edit Portfolio Item' : 'Create New Portfolio Item'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {showSuccess && (
            <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Save className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="text-emerald-300 font-medium">
                    {itemId ? 'Portfolio item updated successfully!' : 'Portfolio item created successfully!'}
                  </div>
                  {!itemId && (
                    <div className="text-emerald-400/80 text-sm mt-1">
                      Your mentors and directors have been notified for review.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., DFIR Mission: Incident Response"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Summary
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Describe your portfolio item, what you learned, and key achievements..."
                rows={4}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {itemTypes.map((itemType) => (
                  <button
                    key={itemType.value}
                    type="button"
                    onClick={() => setType(itemType.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      type === itemType.value
                        ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                        : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-2xl mb-1">{itemType.icon}</div>
                    <div className="text-xs font-medium">{itemType.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility (Coordinated with Settings) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Visibility
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {visibilityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      visibility === option.value
                        ? 'border-indigo-500 bg-indigo-500/20'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-medium text-slate-100 mb-1">{option.label}</div>
                    <div className="text-xs text-slate-400">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Skill Tags */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Skill Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {skillTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-indigo-500/20 text-indigo-300 border-indigo-500/50"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillTag(tag)}
                      className="ml-2 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkillTag}
                  onChange={(e) => setNewSkillTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkillTag())}
                  placeholder="Add skill tag (e.g., SIEM, Python, DFIR)"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddSkillTag}
                  className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Evidence Files */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Evidence Files
              </label>
              <div className="space-y-3">
                {/* Upload Button */}
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*,video/*,.pdf"
                      disabled={uploading}
                    />
                    <div className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload Files'}
                    </div>
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddLink}
                    className="border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Add Link
                  </Button>
                </div>

                {/* Evidence List */}
                {evidenceFiles.length > 0 && (
                  <div className="space-y-2">
                    {evidenceFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-lg"
                      >
                        {file.type === 'image' && <Image className="w-5 h-5 text-indigo-400" />}
                        {file.type === 'video' && <Video className="w-5 h-5 text-indigo-400" />}
                        {file.type === 'pdf' && <FileText className="w-5 h-5 text-indigo-400" />}
                        {file.type === 'link' && <LinkIcon className="w-5 h-5 text-indigo-400" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-slate-100 truncate">{file.name || file.url}</div>
                          {file.size > 0 && (
                            <div className="text-xs text-slate-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEvidence(index)}
                          className="text-red-400 hover:text-red-300"
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
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-700 text-slate-400"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="defender"
                disabled={isLoading || isCreating || isUpdating || uploading || !title.trim()}
                className="bg-indigo-500 hover:bg-indigo-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading || isCreating || isUpdating ? 'Saving...' : itemId ? 'Update Item' : 'Create Item'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

