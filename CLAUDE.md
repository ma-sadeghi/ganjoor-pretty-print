# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a single-page web application for displaying Persian poetry from Ganjoor.org in a print-friendly format. The entire application is contained within a single `index.html` file with embedded CSS and JavaScript.

## Architecture

- **Single HTML file**: All code (HTML, CSS, JavaScript) is contained in `index.html`
- **API Integration**: Uses Ganjoor's official REST API (`api.ganjoor.net`) to fetch poem data
- **Two input modes**:
    - URL extraction from Ganjoor.net links
    - Manual text input for poems
- **Print optimization**: Special CSS media queries for clean printing

## Key Components

### API Integration

The app uses two main API endpoints:

- `/api/ganjoor/poem?url=` - Gets basic poem info and ID
- `/api/ganjoor/poem/{id}/verses` - Gets detailed verse structure with hemistichs

### Poem Display Format

- Poems are displayed in verses with hemistichs (half-lines)
- Two hemistichs per verse are displayed side-by-side
- Single lines are centered
- Print styles hide UI elements and optimize for paper

## Development Notes

- No build process required - direct HTML file execution
- All Persian text uses RTL direction and Vazirmatn font
- CORS is handled by Ganjoor's API (no proxy needed)
- Error handling includes API failures and invalid URLs

## Testing

Open `index.html` directly in a browser. Test with:

- Sample poem button (pre-loaded content)
- Valid Ganjoor URLs like `https://ganjoor.net/adib/divan/ghete/sh34`
- Manual poem input
- Print functionality (Ctrl+P or print button)

## Common Tasks

**View the application**: Open `index.html` in any modern web browser
**Test API integration**: Use the sample poem button or paste a Ganjoor URL
**Test print layout**: Use browser's print preview (Ctrl+P)
