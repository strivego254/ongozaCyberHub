/**
 * Portfolio Exporter Component
 * PDF and JSON export functionality
 */

'use client';

import { useState } from 'react';
import { Download, FileText, Code } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { PortfolioItem } from '@/lib/portfolio/types';

interface PortfolioExporterProps {
  items: PortfolioItem[];
  userId: string;
}

export function PortfolioExporter({ items, userId }: PortfolioExporterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToJSON = () => {
    setIsExporting(true);
    
    const exportData = {
      userId,
      exportedAt: new Date().toISOString(),
      items: items.map((item) => ({
        title: item.title,
        summary: item.summary,
        type: item.type,
        status: item.status,
        skillTags: item.skillTags,
        competencyScores: item.competencyScores,
        createdAt: item.createdAt,
        approvedAt: item.approvedAt,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    // TODO: Implement PDF generation using a library like jsPDF or react-pdf
    // For now, this is a placeholder
    try {
      // This would typically call a backend endpoint or use a client-side library
      console.log('Exporting to PDF:', items);
      alert('PDF export coming soon!');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={exportToJSON}
        disabled={isExporting || items.length === 0}
      >
        <Code className="w-4 h-4 mr-2" />
        Export JSON
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={exportToPDF}
        disabled={isExporting || items.length === 0}
      >
        <FileText className="w-4 h-4 mr-2" />
        Export PDF
      </Button>
    </div>
  );
}

