# MindMapper

An interactive mind mapping application built with React, TypeScript, and React Flow.

## Features

- Create and organize nodes in a visual mind map
- Customize node colors and connections
- Interactive drag-and-drop interface
- Customizable edge styles and colors

## Development

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```

### Build for production
```bash
npm run build
```

## Deployment to GitHub Pages

This project is configured to deploy automatically to GitHub Pages.

### Automatic Deployment (Recommended)

1. **Create a GitHub repository** named "mindmapper"

2. **Push your code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/mindmapper.git
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to your repository settings → Pages
   - Under "Build and deployment", set Source to **"GitHub Actions"**
   
4. **Automatic deployment:** Every push to the `main` branch will automatically deploy to GitHub Pages. You can also trigger a manual deployment from the Actions tab.

Your site will be available at: `https://YOUR_USERNAME.github.io/mindmapper/`

### Manual Deployment (Alternative)

If you prefer to deploy manually:

1. **Install gh-pages package:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

This will build and push the site to the `gh-pages` branch.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Flow (@xyflow/react)
- ESLint

## License

MIT

