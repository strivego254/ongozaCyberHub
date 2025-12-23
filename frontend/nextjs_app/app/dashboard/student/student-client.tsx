/**
 * Student Dashboard Client
 * Orchestrates the Mission Control interface.
 * The sidebar and navigation are handled by the parent StudentLayout.
 */

'use client';

import { StudentDashboardHub } from './components/StudentDashboardHub';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function StudentClient() {
  return (
    <ErrorBoundary>
      <StudentDashboardHub />
    </ErrorBoundary>
  );
}
