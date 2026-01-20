/**
 * Student Coaching OS - Recipe Library Page
 * Protected route requiring student authentication
 */
'use client';

import { RecipeLibraryShell } from '@/components/recipes.disabled/RecipeLibraryShell';

export default function StudentRecipesPage() {
  return <RecipeLibraryShell />;
}
