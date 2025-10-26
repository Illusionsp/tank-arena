# Pulltalk · PR comment recorder demo

This project showcases the Pulltalk browser extension experience — adding a “🎥 Record” button directly inside GitHub and GitLab pull request comment boxes so engineers can explain complex diffs in under a minute.

https://github.com/pulltalk

## 👀 What’s inside

- **Inline record button** that mirrors the Pulltalk extension UI.
- **Screen + microphone capture** powered by the MediaRecorder API.
- **Optional code highlights** so you can call out the exact lines that matter while you narrate.
- **Instant video embed preview** with simulated upload + shareable link insertion into the comment.

## 🚀 How the Pulltalk flow works

1. **Install the Pulltalk extension** (Chrome, Edge, Brave, Arc — any Chromium-based browser).
2. **Open a PR comment box** on GitHub or GitLab — a new “🎥 Record” button appears next to the native controls.
3. **Record your walkthrough** to capture voice, screen, and optional annotations without leaving the diff view.
4. **Stop recording** — Pulltalk uploads the clip to secure storage (S3/Firebase/etc.) and generates an embed link.
5. **Video embed** drops straight into the comment thread so reviewers can watch the walkthrough in-line.

The demo in this repo re-creates that flow locally so you can feel what the extension delivers.

## 🧪 Run the demo locally

```bash
npm install
npm run dev
```

A local Vite server will start (default on `http://localhost:5173`). Hit the “🎥 Record” button, share your screen, and follow the simulated upload path.

> ℹ️ You will need to grant screen and microphone permissions in your browser. MediaRecorder is supported in Chromium-based browsers and recent versions of Firefox.

## 🛠️ Tech stack

- Vite + vanilla JavaScript
- MediaRecorder API & `navigator.mediaDevices`
- Modern CSS (fluid typography, glassmorphism styling)

## 📌 Notes

- Uploading is simulated locally — the demo fakes a Pulltalk embed link rather than calling a backend.
- The UI mimics the GitHub comment surface so stakeholders can experience the workflow end-to-end.
- This branch (`feat-pulltalk-record-button-video-embed`) houses the interactive prototype for the “record button + video embed” experience.
