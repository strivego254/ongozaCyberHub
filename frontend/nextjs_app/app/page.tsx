/**
 * Next.js Home Page
 * Redirects to landing page or dashboard based on auth status
 */

import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to landing page (or dashboard if authenticated)
  // For now, redirect to landing page
  redirect('http://localhost:3001');
}
