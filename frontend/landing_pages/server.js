/**
 * Node.js Express Server for Landing Pages
 * Handles static marketing pages, blog, and SEO content
 * Does NOT require authentication
 */

const express = require('express');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const DJANGO_API_URL = process.env.DJANGO_API_URL || 'http://localhost:8000';

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to fetch public API data
async function fetchPublicData(endpoint) {
  try {
    const response = await axios.get(`${DJANGO_API_URL}/api/v1${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error.message);
    return null;
  }
}

// Routes
app.get('/', async (req, res) => {
  // Fetch public stats or content from Django if needed
  const stats = await fetchPublicData('/health');
  
  res.render('index', {
    title: 'Ongoza CyberHub - Cyber/AI Learning Platform',
    stats,
  });
});

app.get('/about', (req, res) => {
  res.render('about', {
    title: 'About Us - Ongoza CyberHub',
  });
});

app.get('/features', (req, res) => {
  res.render('features', {
    title: 'Features - Ongoza CyberHub',
  });
});

app.get('/pricing', (req, res) => {
  res.render('pricing', {
    title: 'Pricing - Ongoza CyberHub',
  });
});

app.get('/blog', async (req, res) => {
  // Could fetch blog posts from Django API
  res.render('blog', {
    title: 'Blog - Ongoza CyberHub',
    posts: [],
  });
});

app.get('/blog/:slug', (req, res) => {
  res.render('blog-post', {
    title: 'Blog Post - Ongoza CyberHub',
    slug: req.params.slug,
  });
});

// API proxy for public endpoints (optional)
app.get('/api/public/*', async (req, res) => {
  try {
    const endpoint = req.path.replace('/api/public', '');
    const response = await axios.get(`${DJANGO_API_URL}/api/v1${endpoint}`);
    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', {
    title: 'Page Not Found - Ongoza CyberHub',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', {
    title: 'Server Error - Ongoza CyberHub',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

app.listen(PORT, () => {
  console.log(`Landing pages server running on http://localhost:${PORT}`);
});

module.exports = app;

