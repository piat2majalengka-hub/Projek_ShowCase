// =========================================================================
// KONFIGURASI REPOSITORI GITHUB (WAJIB DIUBAH SESUAI AKUN ANDA)
// =========================================================================
const CONFIG = {
  username: 'piat2majalengka-hub', // Contoh: 'ilhamapriansyah'
  repo: 'Archive_2025-2026', 'Archive_2026-2027',     // Contoh: 'projek-web-siswa'
  branch: 'main',                   // Gunakan 'main' atau 'master'
  ignoreFolders: ['.github', 'assets', 'img', 'images', 'css', 'js']
};

const CACHE_KEY = `gh_projects_${CONFIG.username}_${CONFIG.repo}`;

// Elemen DOM
const gridEl = document.getElementById('project-grid');
const statusEl = document.getElementById('status-box');
const countEl = document.getElementById('project-count');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');

// Elemen Modal
const modalEl = document.getElementById('preview-modal');
const modalTitle = document.getElementById('modal-title');
const modalExternalLink = document.getElementById('modal-external-link');
const previewFrame = document.getElementById('preview-frame');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalBackdrop = document.getElementById('modal-backdrop');

let allProjects = [];

// Ubah nama folder (misal: "budi-santoso" atau "siti_aminah") menjadi "Budi Santoso"
function formatStudentName(folderName) {
  return folderName
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

// Ambil 2 huruf inisial untuk avatar kartu
function getInitials(formattedName) {
  const parts = formattedName.split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Ambil daftar folder dari GitHub API
async function loadProjects(forceRefresh = false) {
  gridEl.innerHTML = '';
  statusEl.classList.remove('hidden');
  statusEl.textContent = 'Memuat daftar projek dari GitHub...';

  try {
    let folders = null;

    if (!forceRefresh) {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) folders = JSON.parse(cached);
    }

    if (!folders) {
      const apiUrl = `https://api.github.com/repos/${CONFIG.username}/${CONFIG.repo}/contents?ref=${CONFIG.branch}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repositori tidak ditemukan. Periksa username, nama repo, dan pastikan repositori bersifat Public.');
        }
        if (response.status === 403) {
          throw new Error('Batas permintaan GitHub API tercapai sementara. Coba lagi beberapa saat lagi.');
        }
        throw new Error(`Gagal memuat data (Status: ${response.status})`);
      }

      const contents = await response.json();

      // Filter hanya item bertipe folder ('dir') dan bukan folder sistem/aset
      folders = contents
        .filter((item) => item.type === 'dir' && !CONFIG.ignoreFolders.includes(item.name.toLowerCase()))
        .map((item) => ({
          folderName: item.name,
          displayName: formatStudentName(item.name),
          demoUrl: `./${encodeURIComponent(item.name)}/profile.html`,
          repoUrl: item.html_url
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName));

      sessionStorage.setItem(CACHE_KEY, JSON.stringify(folders));
    }

    allProjects = folders;
    renderProjects(allProjects);
  } catch (error) {
    statusEl.classList.remove('hidden');
    statusEl.textContent = `Terjadi kesalahan: ${error.message}`;
    countEl.textContent = '0 Projek';
  }
}

// Render kartu projek ke dalam grid
function renderProjects(projects) {
  gridEl.innerHTML = '';
  countEl.textContent = `${projects.length} Projek`;

  if (projects.length === 0) {
    statusEl.classList.remove('hidden');
    statusEl.textContent = 'Tidak ada folder projek siswa yang cocok.';
    return;
  }

  statusEl.classList.add('hidden');

  projects.forEach((project) => {
    const card = document.createElement('article');
    card.className = 'card';

    card.innerHTML = `
      <div class="card-header">
        <div class="avatar">${getInitials(project.displayName)}</div>
        <div>
          <h2 class="student-name"></h2>
          <span class="folder-tag">/${project.folderName}/</span>
        </div>
      </div>
      <div class="card-actions">
        <button type="button" class="btn btn-primary btn-full preview-trigger">
          ▶ Pratinjau Langsung
        </button>
        <a href="${project.demoUrl}" target="_blank" rel="noopener" class="btn btn-outline">
          Tab Baru ↗
        </a>
        <a href="${project.repoUrl}" target="_blank" rel="noopener" class="btn btn-outline">
          Kode GitHub
        </a>
      </div>
    `;

    // Gunakan textContent agar aman dari karakter khusus pada nama folder
    card.querySelector('.student-name').textContent = project.displayName;

    // Event buka modal pratinjau
    card.querySelector('.preview-trigger').addEventListener('click', () => {
      openPreviewModal(project);
    });

    gridEl.appendChild(card);
  });
}

// Kontrol Modal Pratinjau
function openPreviewModal(project) {
  modalTitle.textContent = `Karya: ${project.displayName}`;
  modalExternalLink.href = project.demoUrl;
  previewFrame.src = project.demoUrl;
  modalEl.classList.add('open');
  modalEl.setAttribute('aria-hidden', 'false');
}

function closePreviewModal() {
  modalEl.classList.remove('open');
  modalEl.setAttribute('aria-hidden', 'true');
  previewFrame.src = 'about:blank';
}

// Event Listeners
searchInput.addEventListener('input', (e) => {
  const keyword = e.target.value.toLowerCase().trim();
  const filtered = allProjects.filter(
    (p) =>
      p.displayName.toLowerCase().includes(keyword) ||
      p.folderName.toLowerCase().includes(keyword)
  );
  renderProjects(filtered);
});

refreshBtn.addEventListener('click', () => loadProjects(true));
closeModalBtn.addEventListener('click', closePreviewModal);
modalBackdrop.addEventListener('click', closePreviewModal);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalEl.classList.contains('open')) {
    closePreviewModal();
  }
});

// Jalankan saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => loadProjects(false));
