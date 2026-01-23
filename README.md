# 🌅 Morning Routine Timer

A visual countdown timer application designed to help children follow morning routines. Built with React, TypeScript, and Vite.

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or higher
- npm

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Test Production Build Locally

To test the production build locally before deploying, run:

```bash
npm run preview
```

This starts a local server at `http://localhost:4173/morning-routine-coun/` with the same base path configuration as GitHub Pages. Use this to verify the app works correctly with the subdirectory path structure.

## 📦 Deployment

This project is automatically deployed to GitHub Pages via GitHub Actions. Every push to the `main` branch triggers a build and deployment.

### Deployment Flow

1. **Push to main** → GitHub Actions workflow is triggered
2. **Build** → Dependencies installed and project built (`npm run build`)
3. **Deploy to gh-pages** → The `dist/` folder is deployed to the `gh-pages` branch
4. **GitHub Pages serves** → Site is published at https://samqbush.github.io/morning-routine-coun/

### GitHub Pages Configuration

In repository **Settings** → **Pages**:
- Source: **Deploy from a branch**
- Branch: **gh-pages** ← This is where the workflow deploys the built files

The workflow automatically creates and updates the `gh-pages` branch on each push to `main`.

## 📚 Tech Stack

- **React** 19.0.0 - UI framework
- **TypeScript** 5.7.2 - Type safety
- **Vite** 6.3.5 - Build tool
- **Tailwind CSS** 4.1.11 - Styling
- **Radix UI** - Component library
- **Web Audio & Speech Synthesis APIs** - Sound and voice features

## 📄 License

See LICENSE file for details.
