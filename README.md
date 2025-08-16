# 🌙 Sleep Tracker PWA

A modern Progressive Web App for tracking your sleep patterns using device sensors. Built with React, Vite, and Tailwind CSS.

## 🚀 Live Demo

**Try it now:** [https://sleeptrackerixd.netlify.app/](https://sleeptrackerixd.netlify.app/)

## ✨ Features

- **🔄 Smart Sleep Tracking** - Uses device accelerometer to monitor movement
- **⏰ Intelligent Alarms** - Wake up with vibration and notifications
- **📊 Detailed Analytics** - Comprehensive sleep statistics and trends
- **📈 Movement Graphs** - Visualize your sleep patterns and disturbances
- **📅 Date Picker** - Browse historical sleep data
- **🎯 Sleep Quality Score** - AI-powered sleep quality analysis
- **🌙 Dark Mode** - Eye-friendly interface for nighttime use

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS v4
- **PWA:** Vite PWA Plugin
- **Icons:** Lucide React
- **Storage:** Local Storage (no backend required)
- **Sensors:** Device Motion API


## 🔧 Local Development

```bash
# Clone the repository
git clone -b master https://github.com/emin6oz/dreamscapeRetake1
cd dreamscapeRetake1

# Install dependencies
npm install

# Vite.config.js
make sure https is set to false:
server: {
    host: true,
    port: 5173,
    https: false <== for developmenet testing
  },

# Start development server
npm run dev

# Build for production
npm run build
```

## 📋 Prerequisites

- Node.js 16+
- Modern browser with sensor support
- HTTPS (for sensor access and PWA features)

## 🎯 Features Overview

### 🏠 Sleep Tracking
- Set custom bedtime and wake times
- Real-time movement monitoring
- Smart alarm with vibration
- Visual circular clock interface

### 📊 Analytics Dashboard
- Sleep duration tracking
- Movement pattern visualization
- Weekly and monthly averages
- Sleep quality scoring

### 📱 PWA Capabilities
- Offline functionality
- Native app experience
- Push notifications
- Background sync





*Made with ❤️ for better sleep*
