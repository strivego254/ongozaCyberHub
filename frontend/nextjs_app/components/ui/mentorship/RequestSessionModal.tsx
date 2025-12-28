/**
 * Request Session Modal
 * Dialog for students to request a new mentorship session
 */

'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { apiGateway } from '@/services/apiGateway';
import { useMentorship } from '@/hooks/useMentorship';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Clock, MessageSquare, X } from 'lucide-react';

interface RequestSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RequestSessionModal({ open, onOpenChange, onSuccess }: RequestSessionModalProps) {
  const { user } = useAuth();
  const { scheduleSession, refetchAll } = useMentorship(user?.id);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    preferred_date: '',
    preferred_time: '',
    duration_minutes: 45,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Combine date and time into ISO string
      const dateTimeString = `${formData.preferred_date}T${formData.preferred_time}:00`;
      const preferredDateTime = new Date(dateTimeString).toISOString();

      const payload = {
        title: formData.title,
        description: formData.description,
        preferred_date: preferredDateTime,
        duration_minutes: formData.duration_minutes,
        type: 'one_on_one',
      };

      await apiGateway.post('/mentorship/sessions/request', payload);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        preferred_date: '',
        preferred_time: '',
        duration_minutes: 45,
      });
      
      onOpenChange(false);
      onSuccess?.();
      refetchAll();
    } catch (err: any) {
      console.error('Failed to request session:', err);
      setError(err?.data?.detail || err?.data?.error || err?.message || 'Failed to request session. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-och-midnight border-och-steel/20 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <Calendar className="w-6 h-6 text-och-gold" />
            Request New Session
          </DialogTitle>
          <DialogDescription className="text-och-steel">
            Submit a session request to your mentor. They will review and confirm the time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-signal-orange/25 border border-signal-orange text-white px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Session Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold"
                placeholder="e.g., Career Path Discussion"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold min-h-[100px]"
                placeholder="What would you like to discuss in this session?"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  value={formData.preferred_date}
                  onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                  min={today}
                  className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Preferred Time *
                </label>
                <input
                  type="time"
                  value={formData.preferred_time}
                  onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                  className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Duration (minutes) *
              </label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-3 bg-och-midnight border border-och-steel/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-och-gold"
                required
                disabled={isSubmitting}
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-och-steel/20 text-och-steel hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="defender"
              disabled={isSubmitting}
              className="bg-och-gold text-black hover:bg-white font-black uppercase tracking-widest"
            >
              {isSubmitting ? 'Submitting...' : 'Request Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

