/**
 * Profile Form Section Component
 * Complete profile form with validation
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, MapPin, FileText, Globe, Languages } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSettingsMaster } from '@/hooks/useSettingsMaster';

export function ProfileFormSection() {
  const { settings, updateSettings } = useSettingsMaster();
  const [isEditing, setIsEditing] = useState(false);

  if (!settings) return null;

  const timezones = [
    // Africa
    'Africa/Nairobi',
    'Africa/Johannesburg',
    'Africa/Lagos',
    'Africa/Cairo',
    'Africa/Casablanca',
    'Africa/Accra',
    'Africa/Addis_Ababa',
    'Africa/Algiers',
    'Africa/Dar_es_Salaam',
    'Africa/Kampala',
    'Africa/Khartoum',
    'Africa/Luanda',
    'Africa/Maputo',
    'Africa/Tunis',
    // Americas
    'America/New_York',
    'America/Los_Angeles',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Anchorage',
    'America/Toronto',
    'America/Vancouver',
    'America/Montreal',
    'America/Mexico_City',
    'America/Bogota',
    'America/Lima',
    'America/Santiago',
    'America/Sao_Paulo',
    'America/Buenos_Aires',
    'America/Caracas',
    'America/Guatemala',
    'America/Havana',
    'America/La_Paz',
    'America/Managua',
    'America/Montevideo',
    'America/Panama',
    'America/Asuncion',
    'America/Santo_Domingo',
    // Europe
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Rome',
    'Europe/Madrid',
    'Europe/Amsterdam',
    'Europe/Brussels',
    'Europe/Vienna',
    'Europe/Prague',
    'Europe/Stockholm',
    'Europe/Copenhagen',
    'Europe/Helsinki',
    'Europe/Dublin',
    'Europe/Lisbon',
    'Europe/Athens',
    'Europe/Warsaw',
    'Europe/Budapest',
    'Europe/Bucharest',
    'Europe/Sofia',
    'Europe/Zagreb',
    'Europe/Istanbul',
    'Europe/Kiev',
    'Europe/Moscow',
    'Europe/Minsk',
    // Asia
    'Asia/Dubai',
    'Asia/Riyadh',
    'Asia/Kuwait',
    'Asia/Bahrain',
    'Asia/Qatar',
    'Asia/Tehran',
    'Asia/Baghdad',
    'Asia/Jerusalem',
    'Asia/Beirut',
    'Asia/Amman',
    'Asia/Damascus',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Dhaka',
    'Asia/Colombo',
    'Asia/Kathmandu',
    'Asia/Thimphu',
    'Asia/Yangon',
    'Asia/Bangkok',
    'Asia/Ho_Chi_Minh',
    'Asia/Phnom_Penh',
    'Asia/Vientiane',
    'Asia/Singapore',
    'Asia/Kuala_Lumpur',
    'Asia/Jakarta',
    'Asia/Bandung',
    'Asia/Manila',
    'Asia/Hong_Kong',
    'Asia/Shanghai',
    'Asia/Beijing',
    'Asia/Taipei',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Ulaanbaatar',
    'Asia/Almaty',
    'Asia/Tashkent',
    'Asia/Baku',
    'Asia/Yerevan',
    'Asia/Tbilisi',
    // Oceania
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Australia/Perth',
    'Australia/Adelaide',
    'Australia/Darwin',
    'Australia/Hobart',
    'Pacific/Auckland',
    'Pacific/Wellington',
    'Pacific/Fiji',
    'Pacific/Guam',
    'Pacific/Honolulu',
    'Pacific/Port_Moresby',
    'Pacific/Noumea',
    'Pacific/Tahiti',
  ];

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'pt', name: 'Portuguese', native: 'Português' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands' },
    { code: 'pl', name: 'Polish', native: 'Polski' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'zh', name: 'Chinese', native: '中文' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
    { code: 'th', name: 'Thai', native: 'ไทย' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
    { code: 'tl', name: 'Tagalog', native: 'Tagalog' },
    { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
    { code: 'zu', name: 'Zulu', native: 'isiZulu' },
    { code: 'af', name: 'Afrikaans', native: 'Afrikaans' },
    { code: 'he', name: 'Hebrew', native: 'עברית' },
    { code: 'fa', name: 'Persian', native: 'فارسی' },
    { code: 'uk', name: 'Ukrainian', native: 'Українська' },
    { code: 'cs', name: 'Czech', native: 'Čeština' },
    { code: 'sv', name: 'Swedish', native: 'Svenska' },
    { code: 'no', name: 'Norwegian', native: 'Norsk' },
    { code: 'da', name: 'Danish', native: 'Dansk' },
    { code: 'fi', name: 'Finnish', native: 'Suomi' },
    { code: 'el', name: 'Greek', native: 'Ελληνικά' },
    { code: 'ro', name: 'Romanian', native: 'Română' },
    { code: 'hu', name: 'Hungarian', native: 'Magyar' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="glass-card glass-card-hover">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Profile Information</h2>
              <p className="text-xs text-slate-500 mt-1">
                Basic information that appears on your marketplace profile
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                defaultValue={settings.name || ''}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    updateSettings({ name: e.target.value.trim() });
                  }
                }}
                className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500/70 focus:outline-none transition-colors"
              />
            </div>

            {/* Headline */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Professional Headline
              </label>
              <input
                type="text"
                placeholder="e.g., Cybersecurity Analyst | SIEM Specialist"
                defaultValue={settings.headline || ''}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    updateSettings({ headline: e.target.value.trim() });
                  }
                }}
                className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500/70 focus:outline-none transition-colors"
              />
              <p className="text-xs text-slate-500 mt-2">
                This appears on your marketplace profile and helps employers understand your role
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <input
                type="text"
                placeholder="City, Country"
                defaultValue={settings.location || ''}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    updateSettings({ location: e.target.value.trim() });
                  }
                }}
                className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500/70 focus:outline-none transition-colors"
              />
            </div>

            {/* Track */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Career Track
              </label>
              <select
                value={settings.track || 'defender'}
                onChange={(e) => updateSettings({ track: e.target.value as any })}
                className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
              >
                <option value="defender">Defender</option>
                <option value="attacker">Attacker</option>
                <option value="analyst">Analyst</option>
                <option value="architect">Architect</option>
                <option value="manager">Manager</option>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                Your career track helps personalize missions and recommendations
              </p>
            </div>

            {/* Bio/About */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bio / About
              </label>
              <textarea
                placeholder="Tell employers about your cybersecurity journey, skills, and goals..."
                className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500/70 focus:outline-none transition-colors min-h-[120px]"
                defaultValue={settings.integrations?.bio || ''}
                onBlur={(e) => {
                  if (e.target.value.trim()) {
                    updateSettings({ 
                      bioCompleted: true,
                      integrations: {
                        ...settings.integrations,
                        bio: e.target.value,
                      },
                    });
                  }
                }}
              />
              <p className="text-xs text-slate-500 mt-2">
                Completing your bio boosts marketplace ranking and helps employers understand your background
              </p>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Timezone
              </label>
              <select
                value={settings.timezoneSet || 'Africa/Nairobi'}
                onChange={(e) => updateSettings({ timezoneSet: e.target.value })}
                className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                size={1}
              >
                <optgroup label="Africa">
                  {timezones.filter(tz => tz.startsWith('Africa/')).map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace('Africa/', '').replace(/_/g, ' ')}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Americas">
                  {timezones.filter(tz => tz.startsWith('America/')).map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace('America/', '').replace(/_/g, ' ')}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Europe">
                  {timezones.filter(tz => tz.startsWith('Europe/')).map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace('Europe/', '').replace(/_/g, ' ')}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Asia">
                  {timezones.filter(tz => tz.startsWith('Asia/')).map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace('Asia/', '').replace(/_/g, ' ')}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Oceania & Pacific">
                  {timezones.filter(tz => tz.startsWith('Australia/') || tz.startsWith('Pacific/')).map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace('Australia/', '').replace('Pacific/', '').replace(/_/g, ' ')}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-xs text-slate-500 mt-2">
                {timezones.length} timezones available • Used for scheduling mentor sessions and mission deadlines
              </p>
            </div>

            {/* Language Preference */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Languages className="w-4 h-4" />
                Language Preference
              </label>
              <select
                value={settings.languagePreference || 'en'}
                onChange={(e) => updateSettings({ languagePreference: e.target.value })}
                className="w-full bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-3 text-slate-100 focus:border-indigo-500/70 focus:outline-none transition-colors"
                size={1}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native} ({lang.name})
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-2">
                {languages.length} languages available • Select your preferred language for platform interface and notifications
              </p>
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Social Links
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    placeholder="LinkedIn profile URL"
                    className="flex-1 bg-slate-900/70 border border-slate-800/70 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-indigo-500/70 focus:outline-none transition-colors"
                    defaultValue={settings.integrations?.linkedinUrl || ''}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        updateSettings({
                          linkedinLinked: true,
                          integrations: {
                            ...settings.integrations,
                            linkedinUrl: e.target.value,
                          },
                        });
                      }
                    }}
                  />
                  {settings.linkedinLinked && (
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                      Connected
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Social links help employers verify your professional background
              </p>
            </div>

            {/* Impact Callout */}
            <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-500/30 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-400 text-[10px]">
                  Impact
                </Badge>
                How this affects your platform experience
              </h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>• <strong className="text-slate-300">Marketplace:</strong> Complete profile improves employer trust and ranking</li>
                <li>• <strong className="text-slate-300">AI Coach:</strong> Better personalization with complete profile data</li>
                <li>• <strong className="text-slate-300">TalentScope:</strong> Profile data syncs to improve readiness scoring</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

