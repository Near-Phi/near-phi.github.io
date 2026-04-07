# Deploy MathTools to GitHub Pages (FREE hosting, 5 min)

## Steps

```bash
# 1. Initialize git repo (if not already)
cd C:\Users\damon\mathtools
git init
git add -A
git commit -m "Initial mathtools release"

# 2. Create a new public repo on github.com (manually)
# Name it: mathtools

# 3. Push
git remote add origin https://github.com/YOUR_USERNAME/mathtools.git
git branch -M main
git push -u origin main

# 4. Enable GitHub Pages
# Go to github.com/YOUR_USERNAME/mathtools/settings/pages
# Source: Deploy from a branch
# Branch: main, folder: / (root)
# Save

# 5. Wait 1-2 minutes
# Your site will be live at: https://YOUR_USERNAME.github.io/mathtools/
```

## URLs after deploy
- Landing: https://YOUR_USERNAME.github.io/mathtools/
- Fractal: https://YOUR_USERNAME.github.io/mathtools/fractal_explorer.html
- Wave: https://YOUR_USERNAME.github.io/mathtools/wave_interference.html
- Particle: https://YOUR_USERNAME.github.io/mathtools/particle_sim.html
- Neural: https://YOUR_USERNAME.github.io/mathtools/neural_geometry.html

## Custom domain (optional, $10/yr)
1. Buy domain at namecheap.com (e.g., mathtools.app)
2. Add CNAME file in repo with domain
3. In Namecheap DNS: CNAME @ → YOUR_USERNAME.github.io
4. Wait for DNS propagation (1-24 hours)

## Cost: $0
GitHub Pages is free for public repos. Custom domain optional ~$10/yr.
