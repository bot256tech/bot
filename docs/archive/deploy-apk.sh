#!/bin/bash
# ============================================================
# AGRICHAIN 360™ — Push APK to GitHub & Deploy
# ============================================================

echo "🚀 AGRICHAIN 360 — APK Deployment Script"
echo ""

# Check if git remote exists
if ! git remote get-url origin &> /dev/null; then
    echo "⚠️  No remote repository configured."
    echo ""
    echo "Please add your GitHub repository:"
    echo "  git remote add origin https://github.com/bot256tech/bot.git"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo "📦 Repository: $(git remote get-url origin)"
echo ""

# Check APK exists
if [ ! -f "public/app/agrichain360.apk" ]; then
    echo "❌ APK file not found at public/app/agrichain360.apk"
    exit 1
fi

echo "✅ APK found: $(du -h public/app/agrichain360.apk | cut -f1)"
echo ""

# Push to GitHub
echo "📤 Pushing to GitHub..."
git add -A
git commit -m "feat: Deploy AGRICHAIN 360 APK (2.4MB) - Ready for download" 2>/dev/null || echo "No changes to commit"
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! APK pushed to GitHub"
    echo ""
    echo "🌐 Your APK will be available at:"
    echo "   https://agrichain360.onrender.com/app/agrichain360.apk"
    echo ""
    echo "📱 Download page:"
    echo "   https://agrichain360.onrender.com/download-app"
    echo ""
    echo "⏳ Render will auto-deploy in 2-3 minutes"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Wait for Render deployment to complete"
    echo "   2. Test: curl -I https://agrichain360.onrender.com/app/agrichain360.apk"
    echo "   3. Share: https://agrichain360.onrender.com/download-app"
    echo ""
    echo "🎉 Your AGRICHAIN 360 app is ready for users!"
else
    echo ""
    echo "❌ Push failed. Check your GitHub credentials."
    echo ""
    echo "If using HTTPS, you may need a Personal Access Token:"
    echo "  1. Go to: https://github.com/settings/tokens"
    echo "  2. Generate new token (classic) with 'repo' scope"
    echo "  3. Use the token as your password when prompted"
    exit 1
fi
