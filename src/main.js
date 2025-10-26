import "./css/style.css";

const sampleDiff = [
  {
    marker: "-",
    number: 136,
    type: "removed",
    content: "  const summary = `${duration}s video uploaded`;",
  },
  {
    marker: "+",
    number: 136,
    type: "added",
    content: "  const summary = formatSummary({ duration });",
  },
  {
    marker: " ",
    number: 137,
    type: "context",
    content: "  const payload = {",
  },
  {
    marker: "+",
    number: 138,
    type: "added",
    content: "    transcript: await whisper.transcribe(blob),",
  },
  {
    marker: "+",
    number: 139,
    type: "added",
    content: "    embedUrl: buildEmbedUrl(uploadUrl),",
  },
  {
    marker: " ",
    number: 140,
    type: "context",
    content: "    duration,",
  },
  {
    marker: " ",
    number: 141,
    type: "context",
    content: "  };",
  },
  {
    marker: "+",
    number: 142,
    type: "added",
    content: '  await analytics.track("pulltalk.video_uploaded", payload);',
  },
  {
    marker: " ",
    number: 143,
    type: "context",
    content: "  return payload;",
  },
];

const diffMarkup = sampleDiff.map(createDiffLine).join("");

const app = document.querySelector("#app");

if (!app) {
  throw new Error("Missing #app container");
}

app.innerHTML = `
  <div class="shell">
    <section class="hero">
      <span class="hero__badge">Pulltalk demo</span>
      <h1>Record a pull request walkthrough in under 60 seconds</h1>
      <p>
        Pulltalk adds a "🎥 Record" button right where you leave code review comments.
        Capture your screen, voice, and highlights without leaving GitHub or GitLab.
      </p>
    </section>
    <div class="layout">
      <section class="comment">
        <div class="comment__header">
          <span class="comment__avatar" aria-hidden="true">JD</span>
          <div class="comment__meta">
            <strong>Pull request comment preview</strong>
            <span>Exactly what reviewers see in the thread</span>
          </div>
        </div>
        <div class="code-diff">
          <div class="code-diff__header">
            <span class="code-diff__title">services/pulltalk/uploadVideo.ts</span>
            <div class="code-diff__actions">
              <button class="ghost-button" type="button" data-highlight-toggle aria-pressed="false">Enable highlighter</button>
              <button class="ghost-button" type="button" data-clear-highlights>Clear highlights</button>
            </div>
          </div>
          <p class="highlighter-hint" data-highlighter-hint hidden>Highlighter is on — click any line to drop a callout.</p>
          <div class="code-diff__body" data-diff-container>${diffMarkup}</div>
        </div>
        <textarea
          data-comment-input
          placeholder="Add a short summary to pair with the video walkthrough..."
        ></textarea>
        <div class="record-bar" data-record-bar>
          <button class="primary-button" type="button" data-record>
            <span aria-hidden="true">🎥</span>
            Record
          </button>
          <button class="primary-button primary-button--stop" type="button" data-stop hidden>
            <span aria-hidden="true">⏹</span>
            Stop recording
          </button>
          <div class="record-indicator" data-recording-indicator hidden>
            <span class="record-indicator__dot" aria-hidden="true"></span>
            <span data-record-timer>0:00</span>
          </div>
        </div>
        <div class="status" data-status aria-hidden="true"></div>
        <div class="embed-preview" data-embed-preview>
          <video data-embed-video controls playsinline></video>
          <div class="embed-preview__meta">
            <h3>Pulltalk video comment ready</h3>
            <p>Embed link: <a href="#" data-embed-link target="_blank" rel="noreferrer noopener"></a></p>
            <div class="embed-preview__actions">
              <button class="secondary-button" type="button" data-copy-embed>Copy embed link</button>
              <button class="secondary-button" type="button" data-remove-embed>Remove embed</button>
            </div>
            <div class="embed-preview__feedback" data-copy-feedback></div>
          </div>
        </div>
      </section>
      <aside class="sidebar">
        <h2>How Pulltalk works</h2>
        <p class="sidebar__intro">
          Pulltalk lives inside the tools you already use for code review. Hit record, narrate the change,
          and we handle the upload plus embedding directly in the thread.
        </p>
        <ol class="sidebar__list">
          <li>Install the Pulltalk browser extension (Chrome, Edge, Brave, Arc — any Chromium-based browser).</li>
          <li>Open a GitHub or GitLab pull request — every comment box now includes a "🎥 Record" button.</li>
          <li>Record to capture your mic, screen, and optional highlights while you talk through the diff.</li>
          <li>When you stop, Pulltalk uploads the clip to secure storage and generates a lightweight embed link.</li>
          <li>The link and player are automatically inserted into the PR conversation.</li>
          <li>Reviewers and authors can play the walkthrough without leaving the page.</li>
        </ol>
        <div class="sidebar__callout">
          Optional drawings & callouts let you circle tricky code paths while you narrate — perfect for complex refactors,
          onboarding walkthroughs, or guiding reviewers to the exact lines that matter.
        </div>
      </aside>
    </div>
  </div>
`;

const elements = {
  recordButton: app.querySelector("[data-record]"),
  stopButton: app.querySelector("[data-stop]"),
  indicator: app.querySelector("[data-recording-indicator]"),
  timer: app.querySelector("[data-record-timer]"),
  status: app.querySelector("[data-status]"),
  embedPreview: app.querySelector("[data-embed-preview]"),
  embedVideo: app.querySelector("[data-embed-video]"),
  embedLink: app.querySelector("[data-embed-link]"),
  copyButton: app.querySelector("[data-copy-embed]"),
  removeButton: app.querySelector("[data-remove-embed]"),
  copyFeedback: app.querySelector("[data-copy-feedback]"),
  commentInput: app.querySelector("[data-comment-input]"),
  diffContainer: app.querySelector("[data-diff-container]"),
  highlightToggle: app.querySelector("[data-highlight-toggle]"),
  highlightHint: app.querySelector("[data-highlighter-hint]"),
  clearHighlights: app.querySelector("[data-clear-highlights]"),
};

defineRequiredElements(elements);

const diffLines = Array.from(elements.diffContainer.querySelectorAll("[data-code-line]"));

const state = {
  isRecording: false,
  mediaRecorder: null,
  streams: {
    screen: null,
    mic: null,
  },
  recordedChunks: [],
  timerInterval: null,
  startTime: 0,
  lastDurationSeconds: 0,
  mimeType: "",
  objectUrl: null,
  embedMarkdown: "",
  embedLink: "",
  highlightEnabled: false,
};

let copyFeedbackTimeout = null;

setupDiffInteractions();
updateRecordingUI(false);

if (!isRecordingSupported()) {
  elements.recordButton.disabled = true;
  elements.recordButton.title = "Screen recording is not supported in this browser.";
  setStatus(
    "Screen recording isn't available here. Try Chrome, Edge, or another modern Chromium browser to use Pulltalk.",
    "error",
  );
} else {
  clearStatus();
}

elements.recordButton.addEventListener("click", () => {
  startRecording().catch((error) => {
    console.error("Failed to start recording", error);
    setStatus("Recording failed to start. Please try again.", "error");
  });
});

elements.stopButton.addEventListener("click", stopRecording);

elements.copyButton.addEventListener("click", handleCopyLink);

elements.removeButton.addEventListener("click", () => removeEmbed());

window.addEventListener("beforeunload", cleanupResources);
window.addEventListener("pagehide", cleanupResources);

function setupDiffInteractions() {
  elements.highlightToggle.addEventListener("click", () => {
    state.highlightEnabled = !state.highlightEnabled;
    refreshHighlighterUI();
  });

  elements.clearHighlights.addEventListener("click", () => {
    diffLines.forEach((line) => {
      line.classList.remove("is-highlighted");
      line.setAttribute("aria-pressed", "false");
    });
  });

  diffLines.forEach((line) => {
    line.addEventListener("click", () => {
      if (!state.highlightEnabled) {
        return;
      }
      const isActive = line.classList.toggle("is-highlighted");
      line.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  });

  refreshHighlighterUI();
}

async function startRecording() {
  if (state.isRecording) {
    return;
  }

  if (!isRecordingSupported()) {
    setStatus(
      "Screen recording is not supported in this browser. Please switch to Chrome or Edge.",
      "error",
    );
    return;
  }

  clearStatus();
  setStatus("Requesting screen & microphone access…", "progress");
  elements.recordButton.disabled = true;

  let screenStream;
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: 30,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        cursor: "always",
      },
      audio: true,
    });
  } catch (error) {
    elements.recordButton.disabled = false;
    const message = error?.name === "NotAllowedError"
      ? "Permissions were denied. Please allow screen & microphone access to record."
      : "Unable to access screen capture. Check your browser permissions.";
    setStatus(message, "error");
    return;
  }

  let micStream = null;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  } catch (error) {
    console.warn("Microphone capture failed", error);
  }

  try {
    const combinedStream = buildCombinedStream(screenStream, micStream);
    const mimeType = getPreferredMimeType();
    const recorder = mimeType ? new MediaRecorder(combinedStream, { mimeType }) : new MediaRecorder(combinedStream);

    state.mediaRecorder = recorder;
    state.mimeType = mimeType || recorder.mimeType || "video/webm";
    state.streams.screen = screenStream;
    state.streams.mic = micStream;
    state.recordedChunks = [];
    state.lastDurationSeconds = 0;

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data && event.data.size > 0) {
        state.recordedChunks.push(event.data);
      }
    });

    recorder.addEventListener("stop", () => {
      state.isRecording = false;
      stopStreams();
      finalizeRecording();
    });

    recorder.addEventListener("error", (event) => {
      console.error("MediaRecorder error", event.error || event);
      updateRecordingUI(false);
      stopStreams();
      if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
      }
      state.mediaRecorder = null;
      state.recordedChunks = [];
      state.isRecording = false;
      setStatus(`Recording error: ${event.error?.message ?? event.error ?? "unknown error"}`, "error");
    });

    recorder.start();
    state.isRecording = true;
    state.startTime = Date.now();
    state.timerInterval = window.setInterval(updateTimer, 250);
    updateRecordingUI(true);
    updateTimer();
    setStatus("Recording… pull up the code you want to explain.", "progress");
  } catch (error) {
    console.error("Failed to initialise recorder", error);
    stopStreamIfPresent(screenStream);
    stopStreamIfPresent(micStream);
    state.streams.screen = null;
    state.streams.mic = null;
    state.mediaRecorder = null;
    state.recordedChunks = [];
    setStatus(error?.message ? `Recording failed: ${error.message}` : "Recording failed to start.", "error");
  } finally {
    elements.recordButton.disabled = false;
  }
}

function stopRecording() {
  if (!state.mediaRecorder || state.mediaRecorder.state === "inactive") {
    return;
  }

  elements.stopButton.disabled = true;
  state.lastDurationSeconds = Math.max(1, Math.floor((Date.now() - state.startTime) / 1000));

  try {
    state.mediaRecorder.stop();
  } catch (error) {
    console.error("Failed to stop recorder", error);
    setStatus("Could not stop the recording. Please try again.", "error");
  }

  updateRecordingUI(false);
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
  setStatus("Processing recording…", "progress");
}

function finalizeRecording() {
  const chunks = [...state.recordedChunks];
  state.recordedChunks = [];
  state.mediaRecorder = null;
  elements.stopButton.disabled = false;

  if (!chunks.length) {
    setStatus("No video captured — try recording again.", "error");
    return;
  }

  const blob = new Blob(chunks, { type: state.mimeType || "video/webm" });
  state.mimeType = "";

  if (!blob.size) {
    setStatus("The recording was empty. Please try again.", "error");
    return;
  }

  handleUpload(blob).catch((error) => {
    console.error("Upload failed", error);
    setStatus("Upload failed. Please try again.", "error");
  });
}

async function handleUpload(blob) {
  setStatus("Uploading to Pulltalk…", "progress");
  const { link } = await simulateUpload(blob);
  showEmbed(blob, link);
  setStatus("Upload complete — embed inserted into your comment preview.", "success");
}

function showEmbed(blob, link) {
  removeEmbed({ userAction: false });

  if (state.objectUrl) {
    URL.revokeObjectURL(state.objectUrl);
  }

  state.objectUrl = URL.createObjectURL(blob);
  elements.embedVideo.src = state.objectUrl;
  elements.embedVideo.currentTime = 0;

  elements.embedLink.href = link;
  elements.embedLink.textContent = link;

  elements.embedPreview.classList.add("is-visible");
  elements.copyFeedback.textContent = "";

  const durationLabel = formatDuration(state.lastDurationSeconds);
  const label = durationLabel ? `Pulltalk walkthrough (${durationLabel})` : "Pulltalk walkthrough";
  const markdown = `[🎥 ${label}](${link})`;

  state.embedMarkdown = markdown;
  state.embedLink = link;

  const trimmed = elements.commentInput.value.trim();
  let nextValue = trimmed;
  if (!trimmed) {
    nextValue = markdown;
  } else if (!trimmed.includes(markdown)) {
    nextValue = `${trimmed}\n\n${markdown}`;
  }
  elements.commentInput.value = nextValue;
}

function removeEmbed({ userAction = true } = {}) {
  if (state.objectUrl) {
    URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = null;
  }

  elements.embedVideo.pause();
  elements.embedVideo.removeAttribute("src");
  elements.embedPreview.classList.remove("is-visible");
  elements.copyFeedback.textContent = "";

  if (state.embedMarkdown) {
    elements.commentInput.value = stripEmbedMarkdown(elements.commentInput.value, state.embedMarkdown);
  }

  state.embedMarkdown = "";
  state.embedLink = "";

  if (userAction) {
    setStatus("Embed removed from the comment.", "info");
  }
}

function handleCopyLink() {
  if (!state.embedLink) {
    elements.copyFeedback.textContent = "Record a clip to generate an embed link first.";
    resetCopyFeedback();
    return;
  }

  if (copyFeedbackTimeout) {
    clearTimeout(copyFeedbackTimeout);
  }

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(state.embedLink)
      .then(() => {
        elements.copyFeedback.textContent = "Link copied to clipboard.";
        resetCopyFeedback();
      })
      .catch(() => {
        elements.copyFeedback.textContent = "Clipboard blocked — use ⌘+C / Ctrl+C to copy manually.";
        resetCopyFeedback();
      });
  } else {
    elements.copyFeedback.textContent = "Clipboard unavailable — copy the link manually.";
    resetCopyFeedback();
  }
}

function resetCopyFeedback() {
  if (copyFeedbackTimeout) {
    clearTimeout(copyFeedbackTimeout);
  }
  copyFeedbackTimeout = window.setTimeout(() => {
    elements.copyFeedback.textContent = "";
    copyFeedbackTimeout = null;
  }, 2200);
}

function buildCombinedStream(screenStream, micStream) {
  const tracks = [
    ...screenStream.getVideoTracks(),
    ...screenStream.getAudioTracks(),
  ];

  if (micStream) {
    micStream.getAudioTracks().forEach((track) => tracks.push(track));
  }

  return new MediaStream(tracks);
}

function updateRecordingUI(isRecording) {
  elements.recordButton.hidden = isRecording;
  elements.stopButton.hidden = !isRecording;
  elements.indicator.hidden = !isRecording;

  if (!isRecording) {
    elements.timer.textContent = "0:00";
    elements.stopButton.disabled = false;
  }
}

function updateTimer() {
  const elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = String(elapsedSeconds % 60).padStart(2, "0");
  elements.timer.textContent = `${minutes}:${seconds}`;
}

function setStatus(message, variant = "info") {
  if (!message) {
    elements.status.textContent = "";
    elements.status.dataset.variant = "";
    elements.status.setAttribute("aria-hidden", "true");
    return;
  }

  elements.status.textContent = message;
  elements.status.dataset.variant = variant;
  elements.status.setAttribute("aria-hidden", "false");
}

function clearStatus() {
  setStatus("");
}

function isRecordingSupported() {
  return typeof navigator !== "undefined"
    && Boolean(navigator.mediaDevices?.getDisplayMedia)
    && typeof window.MediaRecorder !== "undefined";
}

function getPreferredMimeType() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }

  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function stopStreams() {
  stopStreamIfPresent(state.streams.screen);
  stopStreamIfPresent(state.streams.mic);
  state.streams.screen = null;
  state.streams.mic = null;
}

function stopStreamIfPresent(stream) {
  if (!stream) {
    return;
  }
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch (error) {
      console.warn("Failed to stop track", error);
    }
  });
}

function stripEmbedMarkdown(text, markdown) {
  if (!markdown) {
    return text;
  }
  const target = markdown.trim();
  const lines = text.split(/\r?\n/);
  const filtered = lines.filter((line) => line.trim() !== target);
  return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function formatDuration(seconds) {
  if (!seconds || Number.isNaN(seconds)) {
    return "";
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  return `${mins}m ${String(secs).padStart(2, "0")}s`;
}

function simulateUpload(blob) {
  return new Promise((resolve) => {
    const latency = Math.min(2500, 900 + Math.random() * 900);
    window.setTimeout(() => {
      const id = Math.random().toString(36).slice(2, 10);
      resolve({ link: `https://pulltalk.app/embed/${id}`, id, size: blob.size });
    }, latency);
  });
}

function refreshHighlighterUI() {
  elements.highlightToggle.textContent = state.highlightEnabled ? "Disable highlighter" : "Enable highlighter";
  elements.highlightToggle.setAttribute("aria-pressed", state.highlightEnabled ? "true" : "false");
  elements.highlightToggle.classList.toggle("is-active", state.highlightEnabled);
  elements.highlightHint.hidden = !state.highlightEnabled;
  if (state.highlightEnabled) {
    elements.highlightHint.textContent = "Highlighter is on — click any line to drop a callout.";
  }
}

function cleanupResources() {
  stopRecording();
  stopStreams();
  if (state.objectUrl) {
    URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = null;
  }
}

function createDiffLine(line) {
  return `
    <button class="diff-line diff-line--${line.type}" type="button" data-code-line aria-pressed="false">
      <span class="diff-line__marker">${line.marker}</span>
      <span class="diff-line__number">${line.number}</span>
      <span class="diff-line__code">${escapeHtml(line.content)}</span>
    </button>
  `;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function defineRequiredElements(map) {
  const missing = Object.entries(map)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required DOM elements: ${missing.join(", ")}`);
  }
}
