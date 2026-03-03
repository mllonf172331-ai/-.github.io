/***********************
 * Firebase Initialize *
 ***********************/
firebase.initializeApp({
    apiKey: "AIzaSyB0gX4WWmRAmJNnyIbXObr6F-vIGwpdoFM",
    authDomain: "graduation-notes.firebaseapp.com",
    projectId: "graduation-notes",
    storageBucket: "graduation-notes.firebasestorage.app",
    messagingSenderId: "256017443690",
    appId: "1:256017443690:web:bea5d930bd7a0f02ee1313"
});

const db = firebase.firestore();
const board = document.getElementById("board");

const colors = [
    "#bfdbfe",
    "#fecaca",
    "#bae6fd",
    "#fda4af",
    "#c7d2fe",
    "#fee2e2",
    "#bbf7d0",
    "#fde68a",
    "#ddd6fe",
    "#fed7aa"
];

const emojis = ["🌸", "🎓", "💐", "🎀", "🍡", "🕊️", "✨", "⭐", "🫶", "❤️", "🐾", "📌", "🏓"];

const LS_NOTES_KEY = "grad_notes_cache_v1";
const LS_FORM_KEY = "grad_notes_form_v1";
const LS_LIKED_KEY = "grad_notes_liked_v1";

let selectedEmoji = emojis[0];
let selectedColor = colors[0];
let likedNoteIds = new Set();

try {
    db.enablePersistence({ synchronizeTabs: true });
} catch (e) {
    // ignore (multiple tabs / unsupported)
}

function loadLikedSet() {
    try {
        const raw = localStorage.getItem(LS_LIKED_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return new Set();
        return new Set(arr.filter(Boolean).map(String));
    } catch {
        return new Set();
    }
}

function saveLikedSet(set) {
    try {
        localStorage.setItem(LS_LIKED_KEY, JSON.stringify([...set]));
    } catch { }
}

likedNoteIds = loadLikedSet();

function initSakura() {
    const container = document.getElementById("sakura");
    if (!container) return;

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) return;

    const count = 28;
    for (let i = 0; i < count; i++) {
        const p = document.createElement("div");
        p.className = "sakura-petal";

        const size = 10 + Math.random() * 10;
        const left = Math.random() * 100;
        const dur = 9 + Math.random() * 8;
        const delay = -Math.random() * dur;
        const drift = (Math.random() * 80 - 40).toFixed(0);
        const sway = (2.6 + Math.random() * 2.8).toFixed(2);
        const rot = (Math.random() * 120 - 60).toFixed(0) + "deg";
        const op = (0.62 + Math.random() * 0.28).toFixed(2);

        const palette = [
            ["rgba(255, 228, 230, 0.96)", "rgba(253, 164, 175, 0.92)"],
            ["rgba(254, 205, 211, 0.96)", "rgba(251, 113, 133, 0.90)"],
            ["rgba(219, 234, 254, 0.92)", "rgba(191, 219, 254, 0.92)"],
            ["rgba(253, 242, 248, 0.92)", "rgba(253, 186, 233, 0.90)"]
        ];
        const [petalA, petalB] = palette[Math.floor(Math.random() * palette.length)];

        p.style.left = left + "vw";
        p.style.setProperty("--size", size.toFixed(1) + "px");
        p.style.setProperty("--dur", dur.toFixed(2) + "s");
        p.style.setProperty("--delay", delay.toFixed(2) + "s");
        p.style.setProperty("--drift", drift + "px");
        p.style.setProperty("--sway", sway + "s");
        p.style.setProperty("--rot", rot);
        p.style.setProperty("--op", op);
        p.style.setProperty("--petal-a", petalA);
        p.style.setProperty("--petal-b", petalB);

        container.appendChild(p);
    }
}

function escapeHtml(unsafe) {
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function applySelectedButton(containerId, predicate) {
    const el = document.getElementById(containerId);
    if (!el) return;
    [...el.querySelectorAll("button")].forEach(b => {
        const isSelected = predicate(b);
        b.classList.toggle("selected", isSelected);
    });
}

function setEmoji(emoji) {
    selectedEmoji = emoji;
    applySelectedButton("emojiRow", b => (b.dataset?.emoji || b.textContent) === emoji);
    localStorage.setItem(LS_FORM_KEY, JSON.stringify({ emoji: selectedEmoji, color: selectedColor }));
}

function setColor(color) {
    selectedColor = color;
    applySelectedButton("colorRow", b => (b.dataset?.color || "") === color);
    localStorage.setItem(LS_FORM_KEY, JSON.stringify({ emoji: selectedEmoji, color: selectedColor }));
}

function restoreFormPrefs() {
    try {
        const raw = localStorage.getItem(LS_FORM_KEY);
        if (!raw) return;
        const p = JSON.parse(raw);
        if (p?.emoji && emojis.includes(p.emoji)) selectedEmoji = p.emoji;
        if (p?.color && colors.includes(p.color)) selectedColor = p.color;
    } catch { }

    // reflect to UI
    applySelectedButton("emojiRow", b => (b.dataset?.emoji || b.textContent) === selectedEmoji);
    applySelectedButton("colorRow", b => (b.dataset?.color || "") === selectedColor);
}

restoreFormPrefs();

/* Popup */
function openForm() {
    document.getElementById("popup").style.display = "flex";
    restoreFormPrefs();
}

function closeForm() {
    document.getElementById("popup").style.display = "none";
    document.getElementById("name").value = "";
    document.getElementById("message").value = "";
    const yt = document.getElementById("youtube");
    if (yt) yt.value = "";
}

function parseYouTubeId(input) {
    const raw = String(input || "").trim();
    if (!raw) return null;

    try {
        const url = new URL(raw);
        const host = url.hostname.replace(/^www\./, "");

        // youtu.be/<id>
        if (host === "youtu.be") {
            const id = url.pathname.split("/").filter(Boolean)[0];
            return id && /^[a-zA-Z0-9_-]{6,20}$/.test(id) ? id : null;
        }

        // youtube.com/watch?v=<id>
        if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
            if (url.pathname === "/watch") {
                const id = url.searchParams.get("v");
                return id && /^[a-zA-Z0-9_-]{6,20}$/.test(id) ? id : null;
            }

            // /shorts/<id> or /embed/<id>
            const parts = url.pathname.split("/").filter(Boolean);
            if (parts[0] === "shorts" || parts[0] === "embed") {
                const id = parts[1];
                return id && /^[a-zA-Z0-9_-]{6,20}$/.test(id) ? id : null;
            }
        }

        return null;
    } catch {
        return null;
    }
}

/* Submit */
async function submitNote() {
    const name = document.getElementById("name").value || "ไม่ระบุชื่อ";
    const message = document.getElementById("message").value.trim();
    const youtubeRaw = document.getElementById("youtube")?.value?.trim() || "";
    const youtubeId = youtubeRaw ? parseYouTubeId(youtubeRaw) : null;
    const submitBtn = document.getElementById("submitBtn");

    if (!message) {
        alert("กรุณาเขียนข้อความ");
        return;
    }

    if (message.length > 800) {
        alert("ข้อความยาวเกินไป (สูงสุด 800 ตัวอักษร)");
        return;
    }

    if (youtubeRaw && !youtubeId) {
        alert("ลิงก์ YouTube ไม่ถูกต้อง (วางลิงก์จาก YouTube/YouTube Music หรือ youtu.be)");
        return;
    }

    const baseData = {
        name,
        message,
        color: selectedColor || colors[Math.floor(Math.random() * colors.length)],
        emoji: selectedEmoji || "",
        youtubeId: youtubeId || "",
        likes: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "กำลังส่ง...";
    }

    try {
        await db.collection("notes").add(baseData);
        closeForm();
    } catch (e) {
        alert("ส่งโน้ตไม่สำเร็จ (อาจติดเน็ต/สิทธิ์) ลองใหม่อีกครั้ง");
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "ส่งข้อความ";
        }
    }
}

function renderNotes(notes) {
    board.innerHTML = "";

    notes.forEach(({ id, data }) => {
        const n = data;
        const div = document.createElement("div");
        div.className = "note";
        div.style.background = n.color || colors[0];
        div.style.setProperty("--tilt", `${(Math.random() * 4 - 2).toFixed(2)}deg`);

        const emoji = n.emoji ? escapeHtml(n.emoji) : "";
        const name = escapeHtml(n.name ?? "ไม่ระบุชื่อ");
        const msg = escapeHtml(n.message ?? "");
        const isLiked = likedNoteIds.has(String(id));
        const youtubeId = n.youtubeId ? escapeHtml(n.youtubeId) : "";

        div.innerHTML = `
        ${emoji ? `<div class="sticker" aria-hidden="true">${emoji}</div>` : ""}
        <strong>${name}</strong>
        <p>${msg}</p>
        ${youtubeId ? `<a class="yt-link" href="https://youtu.be/${youtubeId}" target="_blank" rel="noopener noreferrer">🎵 เปิดเพลงจาก YouTube</a>` : ""}
        <div class="heart ${isLiked ? "disabled" : ""}" onclick="likeNote('${id}')" data-note-id="${escapeHtml(id)}" aria-disabled="${isLiked ? "true" : "false"}">
          ❤️ ${n.likes || 0}
        </div>
      `;

        board.appendChild(div);
    });
}

/* Realtime Render */
db.collection("notes")
    .orderBy("createdAt", "asc")
    .onSnapshot(snapshot => {
        console.log("[Firestore] notes snapshot received, docs=", snapshot.size);
        const notes = snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
        renderNotes(notes);
        try {
            localStorage.setItem(LS_NOTES_KEY, JSON.stringify(notes));
        } catch { }
    });

// localStorage fallback (shows instantly even if offline)
try {
    const raw = localStorage.getItem(LS_NOTES_KEY);
    if (raw) {
        const cached = JSON.parse(raw);
        if (Array.isArray(cached) && cached.length) renderNotes(cached);
    }
} catch { }

/* Like */
function likeNote(id) {
    const noteId = String(id);
    if (likedNoteIds.has(noteId)) {
        alert("โน้ตนี้กดหัวใจได้แค่ 1 ครั้งต่อเครื่อง/เบราว์เซอร์");
        return;
    }

    likedNoteIds.add(noteId);
    saveLikedSet(likedNoteIds);

    const heartEl = document.querySelector(`.heart[data-note-id="${CSS.escape(noteId)}"]`);
    if (heartEl) {
        heartEl.classList.add("disabled");
        heartEl.setAttribute("aria-disabled", "true");
    }

    db.collection("notes").doc(noteId).update({
        likes: firebase.firestore.FieldValue.increment(1)
    }).catch(() => {
        likedNoteIds.delete(noteId);
        saveLikedSet(likedNoteIds);
        if (heartEl) {
            heartEl.classList.remove("disabled");
            heartEl.setAttribute("aria-disabled", "false");
        }
        alert("กดหัวใจไม่สำเร็จ ลองใหม่อีกครั้ง");
    });
}

initSakura();
