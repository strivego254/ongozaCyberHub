# Installing Prerequisites for Django Backend

## Problem
You're seeing errors like:
- `No module named 'venv'`
- `The virtual environment was not created successfully because ensurepip is not available`

## Solution

### Step 1: Install Required System Packages

Run these commands in your terminal:

```bash
sudo apt update
sudo apt install python3.12-venv python3-pip
```

Or if you're using a different Python version:

```bash
sudo apt update
sudo apt install python3-venv python3-pip
```

### Step 2: Verify Installation

```bash
python3 --version
python3 -m venv --help
python3 -m pip --version
```

### Step 3: Run Setup Script

Once prerequisites are installed:

```bash
cd backend/django_app
bash setup_and_start.sh
```

This script will:
1. Check prerequisites
2. Create virtual environment
3. Install all dependencies
4. Create .env file
5. Start Django server

### Alternative: Manual Setup

If you prefer to set up manually:

```bash
cd backend/django_app

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example if exists, or create manually)

# Start server
python manage.py runserver 0.0.0.0:8000
```

## Troubleshooting

### If `sudo apt` doesn't work:
- You may need to use `sudo` with your password
- On some systems, use `su -` to become root first

### If Python version is different:
- Check your Python version: `python3 --version`
- Install the matching venv package: `sudo apt install python3.X-venv` (replace X with your version)

### If database connection fails:
- Make sure PostgreSQL is running: `sudo systemctl status postgresql`
- Check your .env file has correct database credentials
- Create database: `python manage.py create_db`

