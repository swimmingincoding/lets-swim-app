// AquaMasters Live - Main Application Controller
import { loadMastersData, getMyTeamIds, toggleMyTeamAthlete, addMultipleToMyTeam, isAthleteInMyTeam, clearLocalDataset } from './storage.js';
import { SearchEngine, getKoreanAthleteName } from './search.js';

let dataset = null;
let searchEngine = null;
let activeTab = 'search';
let activeMyTeamDay = 'all';
let activeScheduleDay = 1;
let activeStrokeFilter = 'all';
let currentSearchQuery = '';
let currentEdition = localStorage.getItem('wa_current_edition') || 'singapore_2025';

// DOM Elements
const editionFlagEl = document.getElementById('editionFlag');
const editionTitleEl = document.getElementById('editionTitle');
const connectionStatusEl = document.getElementById('connectionStatus');
const statusTextEl = document.getElementById('statusText');
const initialLoader = document.getElementById('initialLoader');
const loadingTitle = document.getElementById('loadingTitle');
const loadingDesc = document.getElementById('loadingDesc');
const navItems = document.querySelectorAll('.bottom-nav .nav-item');
const viewSections = document.querySelectorAll('.view-section');
const navMyTeamBadge = document.getElementById('navMyTeamBadge');

// Search elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const quickFilters = document.getElementById('quickFilters');
const searchResultsList = document.getElementById('searchResultsList');

// My team elements
const myTeamCountEl = document.getElementById('myTeamCount');
const myTeamRacesCountEl = document.getElementById('myTeamRacesCount');
const myTeamRelaysCountEl = document.getElementById('myTeamRelaysCount');
const myTeamTimelineList = document.getElementById('myTeamTimelineList');
const myTeamDaySelector = document.getElementById('myTeamDaySelector');
const copyTeamScheduleBtn = document.getElementById('copyTeamScheduleBtn');
const downloadCardBtn = document.getElementById('downloadCardBtn');

// Schedule elements
const scheduleDaySelector = document.getElementById('scheduleDaySelector');
const scheduleEventList = document.getElementById('scheduleEventList');

// Events browser elements
const eventCategoryFilters = document.getElementById('eventCategoryFilters');
const eventsList = document.getElementById('eventsList');

// Modal elements
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalSubTitle = document.getElementById('modalSubTitle');
const modalBody = document.getElementById('modalBody');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const toastContainer = document.getElementById('toastContainer');

// --- Initialization ---
async function initApp() {
  updateOnlineStatus();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      console.log('PWA ServiceWorker registered successfully');
      reg.update();
    } catch (err) {
      console.warn('ServiceWorker registration failed', err);
    }
  }

  // Load Dataset
  try {
    dataset = await loadMastersData((status) => {
      if (loadingTitle) loadingTitle.textContent = status;
    });
    searchEngine = new SearchEngine(dataset);
    
    // Hide loader, show initial tab
    if (initialLoader) initialLoader.style.display = 'none';
    updateEditionHeader();
    switchTab('search');
    updateNavBadge();

    // Notify user that offline cache is primed
    setTimeout(() => {
      showToast('⚡ 오프라인 저장 완료! 비행기 모드에서도 작동합니다.');
    }, 1000);
  } catch (err) {
    console.error('App init failed', err);
    if (loadingTitle) loadingTitle.textContent = '데이터를 불러오지 못했습니다';
    if (loadingDesc) loadingDesc.textContent = err.message;
  }
}

// --- Network Status ---
function updateOnlineStatus() {
  const isOnline = navigator.onLine;
  if (isOnline) {
    connectionStatusEl.className = 'status-badge';
    statusTextEl.textContent = '온라인';
  } else {
    connectionStatusEl.className = 'status-badge offline';
    statusTextEl.textContent = '오프라인 (로컬 동작)';
    showToast('📶 오프라인 모드: 로컬 캐시로 동작합니다.');
  }
}

// --- Tab Switching ---
function switchTab(tabName) {
  activeTab = tabName;
  navItems.forEach(item => {
    if (item.dataset.tab === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  viewSections.forEach(sec => {
    sec.classList.remove('active');
  });

  if (tabName === 'search') {
    document.getElementById('viewSearch').classList.add('active');
    renderSearchResults(currentSearchQuery);
  } else if (tabName === 'myteam') {
    document.getElementById('viewMyTeam').classList.add('active');
    renderMyTeamView();
  } else if (tabName === 'schedule') {
    document.getElementById('viewSchedule').classList.add('active');
    renderScheduleView();
  } else if (tabName === 'events') {
    document.getElementById('viewEvents').classList.add('active');
    renderEventsView();
  }

  // Scroll to top
  const main = document.getElementById('mainContainer');
  if (main) main.scrollTop = 0;
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    switchTab(item.dataset.tab);
  });
});

// Championship Edition Management
function updateEditionHeader() {
  if (!editionFlagEl || !editionTitleEl) return;
  if (currentEdition === 'singapore_2025') {
    editionFlagEl.textContent = '🇸🇬';
    editionTitleEl.textContent = '2025 싱가포르';
  } else if (currentEdition === 'budapest_2027') {
    editionFlagEl.textContent = '🇭🇺';
    editionTitleEl.textContent = '2027 부다페스트';
  }
}

function openChampionshipModal() {
  modalTitle.textContent = '🏆 대회 아카이브 선택';
  modalSubTitle.textContent = '조회할 월드마스터즈 수영대회를 선택하세요';

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <!-- Singapore 2025 -->
      <div class="card championship-card ${currentEdition === 'singapore_2025' ? 'active-edition' : ''}" onclick="window.aquaApp.selectEdition('singapore_2025')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="font-size: 2.2rem; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));">🇸🇬</div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 800; font-size: 1.1rem; color: #fff;">2025 싱가포르</span>
                ${currentEdition === 'singapore_2025' ? '<span class="status-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; font-size: 0.68rem; padding: 2px 6px;">선택됨</span>' : ''}
              </div>
              <div style="font-size: 0.8rem; color: var(--water-light); margin-top: 2px;">World Aquatics Masters Championships</div>
              <div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px;">📅 2025.08.07 ~ 08.14 · 📍 WCA &amp; OCBC (14,091건)</div>
            </div>
          </div>
          <button class="filter-chip ${currentEdition === 'singapore_2025' ? 'active' : ''}" style="margin: 0; padding: 6px 10px; font-size: 0.75rem;">
            ${currentEdition === 'singapore_2025' ? '조회 중' : '선택'}
          </button>
        </div>
      </div>

      <!-- Budapest 2027 -->
      <div class="card championship-card ${currentEdition === 'budapest_2027' ? 'active-edition' : ''}" onclick="window.aquaApp.selectEdition('budapest_2027')">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; gap: 12px; align-items: center;">
            <div style="font-size: 2.2rem; filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));">🇭🇺</div>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 800; font-size: 1.1rem; color: #fff;">2027 부다페스트</span>
                ${currentEdition === 'budapest_2027' ? '<span class="status-badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; font-size: 0.68rem; padding: 2px 6px;">선택됨</span>' : ''}
              </div>
              <div style="font-size: 0.8rem; color: var(--water-light); margin-top: 2px;">World Aquatics Masters Championships</div>
              <div style="font-size: 0.74rem; color: #f59e0b; margin-top: 4px; font-weight: 600;">📅 2027년 8월 예정 · 📍 Duna Aréna (발표 대기)</div>
            </div>
          </div>
          <button class="filter-chip ${currentEdition === 'budapest_2027' ? 'active' : ''}" style="margin: 0; padding: 6px 10px; font-size: 0.75rem;">
            ${currentEdition === 'budapest_2027' ? '조회 중' : '선택'}
          </button>
        </div>
      </div>
    </div>
  `;

  modalBody.innerHTML = bodyHtml;
  modalOverlay.classList.add('active');
}

function selectEdition(editionId) {
  currentEdition = editionId;
  localStorage.setItem('wa_current_edition', editionId);
  updateEditionHeader();
  modalOverlay.classList.remove('active');

  if (editionId === 'budapest_2027') {
    showToast('🇭🇺 2027 부다페스트 대회로 전환되었습니다.');
  } else {
    showToast('🇸🇬 2025 싱가포르 대회 아카이브로 전환되었습니다.');
  }

  // Refresh active view
  switchTab(activeTab);
}

// Update Badge Count for My Team
function updateNavBadge() {
  const count = getMyTeamIds().length;
  if (count > 0) {
    navMyTeamBadge.style.display = 'flex';
    navMyTeamBadge.textContent = count > 99 ? '99+' : count;
  } else {
    navMyTeamBadge.style.display = 'none';
  }
}

// Toast Helper
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 2500);
}

// --- Search Controller ---
let searchDebounceTimer = null;
searchInput.addEventListener('input', (e) => {
  const val = e.target.value;
  currentSearchQuery = val;
  clearSearchBtn.style.display = val ? 'flex' : 'none';

  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    renderSearchResults(val);
  }, 120);
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  currentSearchQuery = '';
  clearSearchBtn.style.display = 'none';
  renderSearchResults('');
  searchInput.focus();
});

// Quick Filters
quickFilters.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-chip');
  if (!btn) return;
  const q = btn.dataset.query;
  searchInput.value = q;
  currentSearchQuery = q;
  clearSearchBtn.style.display = 'flex';
  renderSearchResults(q);
});

// Render Search Results
function renderSearchResults(query) {
  if (currentEdition === 'budapest_2027') {
    searchResultsList.innerHTML = `
      <div class="card" style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(2, 132, 199, 0.14) 100%); border: 1.5px solid rgba(56, 189, 248, 0.35); padding: 22px; text-align: center; border-left: 4px solid var(--water-cyan);">
        <div style="font-size: 3.2rem; margin-bottom: 6px;">🇭🇺 🏊‍♂️</div>
        <div style="font-size: 0.8rem; font-weight: 700; color: #7dd3fc; text-transform: uppercase; letter-spacing: 0.5px;">World Aquatics Masters Championships</div>
        <h2 style="font-size: 1.35rem; font-weight: 800; color: #fff; margin-top: 4px;">BUDAPEST 2027</h2>
        <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 10px; line-height: 1.5;">
          📍 개최 장소: <b>Duna Aréna (헝가리 부다페스트 두나 아레나)</b><br>
          📅 개최 시기: <b>2027년 8월 예정</b>
        </div>
      </div>

      <div class="card" style="background: rgba(5, 19, 41, 0.75); border: 1.5px solid rgba(245, 158, 11, 0.35); border-left: 4px solid var(--accent-gold); padding: 18px;">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <div style="font-size: 2rem;">⏳</div>
          <div style="flex: 1;">
            <div style="font-weight: 800; color: #fbbf24; font-size: 1rem;">2027 부다페스트 공식 대진표 발표 대기 중</div>
            <div style="font-size: 0.84rem; color: #cbd5e1; margin-top: 6px; line-height: 1.55;">
              세계수영연맹(World Aquatics)에서 부다페스트 2027 대회의 공식 엔트리 리스트(Entry List) 및 경기 타임테이블(Timeline)을 발표하면, 자료 전달 즉시 이곳에 <b>선수 검색, 조/레인 배정, 팀 일정표</b>가 자동으로 연동됩니다!
            </div>
            <div style="margin-top: 14px; display: flex; gap: 8px;">
              <button class="btn-primary" style="flex: 1; padding: 11px 14px; font-size: 0.85rem;" onclick="window.aquaApp.selectEdition('singapore_2025')">
                🇸🇬 2025 싱가포르 아카이브 대진표 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (!searchEngine) return;

  if (!query || !query.trim()) {
    // Show summary info and recommendations
    const myTeamIds = getMyTeamIds();
    searchResultsList.innerHTML = `
      <div class="summary-banner">
        <div class="stat-item">
          <h3>${dataset.metadata.total_athletes.toLocaleString()}</h3>
          <p>전체 선수</p>
        </div>
        <div class="stat-item">
          <h3>${dataset.metadata.total_entries.toLocaleString()}</h3>
          <p>출전 엔트리</p>
        </div>
        <div class="stat-item">
          <h3>${dataset.metadata.total_teams.toLocaleString()}</h3>
          <p>참가 클럽</p>
        </div>
      </div>

      ${myTeamIds.length > 0 ? `
        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">★ 마이팀 바로가기</span>
          <button class="filter-chip accent-chip" onclick="window.aquaApp.switchTab('myteam')">전체 ${myTeamIds.length}명 보기 &gt;</button>
        </div>
      ` : ''}

      <div class="card" style="background: linear-gradient(135deg, rgba(14, 165, 233, 0.14) 0%, rgba(2, 132, 199, 0.08) 100%); border: 1.5px solid rgba(56, 189, 248, 0.25); border-left: 4px solid var(--water-cyan);">
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <div style="font-size: 1.8rem; filter: drop-shadow(0 2px 6px rgba(14, 165, 233, 0.4));">🏊‍♂️</div>
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">수영 대회 검색 팁</div>
            <div style="font-size: 0.82rem; color: #cbd5e1; margin-top: 4px; line-height: 1.45;">
              • 클럽명(<b>수영하자</b>, <b>LETS SWIM</b>)을 검색하면 소속 팀원 전체를 모아볼 수 있습니다.<br>
              • 한글 성씨(<b>김</b>, <b>이</b>, <b>박</b>) 또는 영문 성(<b>KIM</b>, <b>BAEK</b>)으로 검색 가능합니다.<br>
              • 오른쪽 별표(★)를 누르면 <b>우리 팀</b>으로 등록되어 타임라인이 자동 생성됩니다.
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const results = searchEngine.search(query);
  const myTeamIds = new Set(getMyTeamIds());

  let html = '';

  // 1. Teams matched banner
  if (results.matchedTeams.length > 0) {
    html += `
      <div style="margin-bottom: 14px;">
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--water-light); text-transform: uppercase; margin-bottom: 6px;">🏊 매칭된 수영 클럽/팀 (${results.matchedTeams.length})</div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          ${results.matchedTeams.map(t => `
            <div class="card" style="padding: 10px 14px; margin-bottom: 0; display: inline-flex; align-items: center; gap: 10px; cursor: pointer; border-left: 3px solid var(--water-cyan);" onclick="window.aquaApp.selectTeam('${escapeHtml(t.name)}')">
              <span style="font-weight: 700; color: #fff; font-size: 0.9rem;">🏢 ${escapeHtml(t.name)}</span>
              <span style="font-size: 0.75rem; background: rgba(14, 165, 233, 0.2); border: 1px solid rgba(56, 189, 248, 0.3); padding: 2px 7px; border-radius: 4px; color: #7dd3fc; font-weight: 600;">${t.athleteCount}명 출전</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 2. Events matched banner
  if (results.matchedEvents && results.matchedEvents.length > 0) {
    html += `
      <div style="margin-bottom: 14px;">
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--water-light); text-transform: uppercase; margin-bottom: 6px;">🏊 매칭된 경기 종목 (${results.matchedEvents.length})</div>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${results.matchedEvents.map(ev => `
            <div class="card" style="padding: 12px 14px; margin-bottom: 0; border-left: 4px solid var(--water-azure); display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="window.aquaApp.openEventDetails('${escapeHtml(ev.name)}')">
              <div>
                <div style="font-size: 0.72rem; color: var(--water-cyan); font-weight: 700;">Day ${ev.day} (${ev.session}) · 시작 예상 ${ev.time_est}</div>
                <div style="font-size: 1rem; font-weight: 700; color: #fff; margin-top: 2px;">${escapeHtml(ev.name)}</div>
              </div>
              <span style="font-size: 0.78rem; color: #ffffff; font-weight: 700; background: linear-gradient(135deg, #0284c7, #0ea5e9); padding: 5px 10px; border-radius: 6px; box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35);">
                대진표 보기 &gt;
              </span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 3. Athletes matched
  if (results.matchedAthletes.length === 0 && results.matchedTeams.length === 0 && (!results.matchedEvents || results.matchedEvents.length === 0)) {
    html += `
      <div class="state-container">
        <div class="state-icon">🔍</div>
        <div class="state-title">검색 결과가 없습니다</div>
        <div class="state-desc">'${escapeHtml(query)}'와 일치하는 선수나 클럽명, 종목을 찾을 수 없습니다. 영문 표기나 클럽명 일부로 검색해보세요.</div>
      </div>
    `;
  } else {
    if (results.matchedAthletes.length > 0) {
      html += `
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px;">
          출전 선수 목록 (${results.matchedAthletes.length}명)
        </div>
      `;

      results.matchedAthletes.forEach(ath => {
        const inTeam = myTeamIds.has(ath.id);
        const krName = getKoreanAthleteName(ath.name);
        const entries = (searchEngine.athleteEntriesMap.get(ath.id) || []).slice().sort((a, b) => 
          (a.day || 0) - (b.day || 0) || 
          (a.time_est || '').localeCompare(b.time_est || '') || 
          (a.order || 0) - (b.order || 0)
        );

        html += `
          <div class="card ${inTeam ? 'highlighted' : ''}" onclick="window.aquaApp.openAthleteModal('${ath.id}')" style="cursor: pointer;">
            <div class="card-header">
              <div class="athlete-title-group">
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                  <span class="athlete-name">${escapeHtml(ath.name)}</span>
                  ${krName ? `<span class="athlete-kr-name">${escapeHtml(krName)}</span>` : ''}
                  <span class="gender-badge ${ath.gender === 'M' ? 'gender-m' : 'gender-w'}">
                    ${ath.gender === 'M' ? '남(M) ♂' : '여(W) ♀'}
                  </span>
                </div>
                <div class="athlete-sub">
                  <span class="team-badge">${escapeHtml(ath.team || '개인')}</span>
                  <span>Cat ${ath.category} (${ath.birth_year}년생)</span>
                </div>
              </div>
              <button class="myteam-btn ${inTeam ? 'in-team' : ''}" onclick="event.stopPropagation(); window.aquaApp.toggleMyTeam('${ath.id}')" title="우리 팀 등록">
                ★
              </button>
            </div>

            <!-- Entries snippet -->
            <div class="entry-items-container">
              ${entries.map(e => {
                const venueStr = e.venue || (e.gender === 'M' ? 'World Aquatics Arena (WCA)' : 'OCBC Aquatic Center');
                const venueClass = venueStr.includes('WCA') ? 'wca' : (venueStr.includes('계영') ? 'relay' : 'ocbc');
                return `
                <div class="entry-pill">
                  <div style="flex: 1; min-width: 0;">
                    <div class="entry-event-title">
                      <span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 700;">Day ${e.day} (${e.date_label || ''}) · ${e.time_est ? e.time_est + '~' : ''}</span>
                      <span>${escapeHtml(e.event)}</span>
                    </div>
                    <div class="entry-venue-tag ${venueClass}">
                      📍 ${escapeHtml(venueStr)}
                    </div>
                  </div>
                  <div class="entry-meta-tags">
                    <span class="time-badge">${e.entry_time}</span>
                    <span class="rank-badge ${e.rank_in_category <= 3 ? 'top-seed' : ''}">#${e.rank_in_category}/${e.total_in_category}</span>
                  </div>
                </div>
              `;
              }).join('')}
            </div>
          </div>
        `;
      });
    }
  }

  searchResultsList.innerHTML = html;
}

// Select team from quick badge
function selectTeam(teamName) {
  searchInput.value = teamName;
  currentSearchQuery = teamName;
  clearSearchBtn.style.display = 'flex';
  renderSearchResults(teamName);
}

// Toggle My Team
function toggleMyTeam(athleteId) {
  const res = toggleMyTeamAthlete(athleteId);
  updateNavBadge();
  if (res.added) {
    showToast('★ 우리 팀에 추가되었습니다.');
  } else {
    showToast('우리 팀에서 제외되었습니다.');
  }

  // Re-render current view
  if (activeTab === 'search') {
    renderSearchResults(currentSearchQuery);
  } else if (activeTab === 'myteam') {
    renderMyTeamView();
  }
}

// --- My Team Controller ---
myTeamDaySelector.addEventListener('click', (e) => {
  const btn = e.target.closest('.day-tab-btn');
  if (!btn) return;
  myTeamDaySelector.querySelectorAll('.day-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeMyTeamDay = btn.dataset.day;
  renderMyTeamView();
});

function renderMyTeamView() {
  if (!searchEngine) return;
  if (currentEdition === 'budapest_2027') {
    myTeamCountEl.textContent = '0';
    myTeamRacesCountEl.textContent = '0';
    myTeamRelaysCountEl.textContent = '0';
    myTeamTimelineList.innerHTML = `
      <div class="state-container" style="padding: 40px 10px;">
        <div style="font-size: 2.8rem; margin-bottom: 10px;">🇭🇺 🏊‍♂️</div>
        <div class="state-title">2027 부다페스트 출전 명단 준비 중</div>
        <div class="state-desc" style="max-width: 320px;">
          공식 엔트리가 발표되면 부다페스트 대회 우리 팀 선수 등록 및 타임라인이 활성화됩니다.
        </div>
        <button class="btn-primary" style="margin-top: 16px;" onclick="window.aquaApp.selectEdition('singapore_2025')">
          🇸🇬 2025 싱가포르 우리 팀 타임라인 보기
        </button>
      </div>
    `;
    return;
  }

  const myTeamIds = getMyTeamIds();
  const teamAthletes = myTeamIds.map(id => searchEngine.athleteMap.get(id)).filter(Boolean);

  // Calculate statistics
  let totalEntriesCount = 0;
  const allTeamEntries = [];

  teamAthletes.forEach(ath => {
    const entries = searchEngine.athleteEntriesMap.get(ath.id) || [];
    totalEntriesCount += entries.length;
    entries.forEach(e => allTeamEntries.push(e));
  });

  // Calculate relays & add to timeline
  const teamRelaysSet = new Set();
  const athNames = new Set(teamAthletes.map(a => a.name.toUpperCase().trim()));
  searchEngine.relays.forEach(r => {
    const matchedMembers = [];
    for (const m of r.members) {
      if (athNames.has(m.name.toUpperCase().trim())) {
        matchedMembers.push(m.name);
      }
    }
    if (matchedMembers.length > 0 && !teamRelaysSet.has(r.id)) {
      teamRelaysSet.add(r.id);
      allTeamEntries.push({
        id: r.id,
        is_relay: true,
        athlete_id: null,
        athlete_name: `[계영] ${r.name}`,
        relay_members_desc: `출전 팀원: ${matchedMembers.join(', ')}`,
        team: r.name,
        event: r.event,
        category: r.category,
        entry_time: r.entry_time,
        entry_time_seconds: r.entry_time_seconds,
        day: r.day || 7,
        date: r.date || '2025-08-14',
        date_label: r.date_label || '8/14(목)',
        session: r.session || 'Morning',
        time_est: r.time_est || '09:00',
        venue: r.venue || 'OCBC Aquatic Center',
        estimated_heat: r.order || 1,
        estimated_lane: '-',
        rank_in_category: r.order || 1,
        total_in_category: '-'
      });
    }
  });

  myTeamCountEl.textContent = teamAthletes.length;
  myTeamRacesCountEl.textContent = totalEntriesCount;
  myTeamRelaysCountEl.textContent = teamRelaysSet.size;

  if (teamAthletes.length === 0) {
    myTeamTimelineList.innerHTML = `
      <div class="state-container">
        <div class="state-icon">👥</div>
        <div class="state-title">아직 등록된 팀원이 없습니다</div>
        <div class="state-desc">
          [검색] 탭에서 우리 팀 선수나 클럽명을 검색한 후, <b>★ 버튼</b>을 눌러 팀원으로 등록해보세요. 일자별 경기 일정이 여기에 자동으로 완성됩니다!
        </div>
        <button class="btn-primary" style="margin-top: 18px; width: auto; padding: 10px 20px;" onclick="window.aquaApp.switchTab('search')">
          선수 검색하러 가기
        </button>
      </div>
    `;
    return;
  }

  // Filter entries by selected day
  let filteredEntries = allTeamEntries;
  if (activeMyTeamDay !== 'all') {
    const dayNum = parseInt(activeMyTeamDay, 10);
    filteredEntries = allTeamEntries.filter(e => e.day === dayNum);
  }

  // Sort by day, then session (Morning first), then estimated time, then event_order
  filteredEntries.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    if (a.session !== b.session) return a.session === 'Morning' ? -1 : 1;
    return (a.time_est || '09:00').localeCompare(b.time_est || '09:00') || (a.estimated_heat - b.estimated_heat);
  });

  if (filteredEntries.length === 0) {
    myTeamTimelineList.innerHTML = `
      <div class="state-container" style="padding: 30px 10px;">
        <div style="font-size: 2rem; margin-bottom: 8px;">🏊‍♂️</div>
        <div class="state-title">Day ${activeMyTeamDay}에는 출전 일정이 없습니다</div>
        <div class="state-desc">'전체 일정' 또는 다른 일차를 선택해보세요.</div>
      </div>
    `;
    return;
  }

  // Group by Day & Session
  const grouped = {};
  filteredEntries.forEach(entry => {
    const groupKey = `Day ${entry.day} (${entry.date_label || ''}) · ${entry.session === 'Morning' ? '오전 세션 (09:00~)' : '오후 세션 (14:00~)'}`;
    if (!grouped[groupKey]) grouped[groupKey] = [];
    grouped[groupKey].push(entry);
  });

  let html = '';
  for (const [header, entries] of Object.entries(grouped)) {
    html += `
      <div class="session-header">
        <span class="session-badge">${header.includes('오전') ? '🌅 MORNING' : '☀️ AFTERNOON'}</span>
        <span>${header}</span>
      </div>
    `;

    entries.forEach(e => {
      const clickAction = e.is_relay 
        ? `window.aquaApp.openEventDetails('${escapeHtml(e.event)}')` 
        : `window.aquaApp.openAthleteModal('${e.athlete_id}')`;

      const krName = e.is_relay ? null : getKoreanAthleteName(e.athlete_name);
      const venueStr = e.venue || (e.is_relay ? 'OCBC Aquatic Center (Day 7 계영 전용)' : (e.gender === 'M' ? 'World Aquatics Arena (WCA)' : 'OCBC Aquatic Center'));
      const venueClass = venueStr.includes('WCA') ? 'wca' : (venueStr.includes('계영') ? 'relay' : 'ocbc');

      html += `
        <div class="card timeline-card" onclick="${clickAction}" style="cursor: pointer; ${e.is_relay ? 'border-left-color: var(--accent-emerald);' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span class="timeline-time">${e.time_est || '09:00'}</span>
                <span style="font-size: 0.8rem; font-weight: 700; color: ${e.is_relay ? 'var(--accent-emerald)' : 'var(--accent-cyan)'};">${escapeHtml(e.event)}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span style="font-size: 1.05rem; font-weight: 700; color: #fff;">
                  ${escapeHtml(e.athlete_name)}
                </span>
                ${krName ? `<span class="athlete-kr-name">${escapeHtml(krName)}</span>` : ''}
                ${!e.is_relay && e.gender ? `
                  <span class="gender-badge ${e.gender === 'M' ? 'gender-m' : 'gender-w'}" style="font-size: 0.68rem; padding: 1px 5px;">
                    ${e.gender === 'M' ? '남(M) ♂' : '여(W) ♀'}
                  </span>
                ` : ''}
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px;">
                ${escapeHtml(e.team)} · Cat ${e.category}
              </div>
              ${e.relay_members_desc ? `
                <div style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 4px; font-weight: 600;">
                  👥 ${escapeHtml(e.relay_members_desc)}
                </div>
              ` : ''}
              <div class="entry-venue-tag ${venueClass}" style="margin-top: 4px;">
                📍 ${escapeHtml(venueStr)}
              </div>
            </div>

            <div style="text-align: right;">
              <div class="time-badge" style="${e.is_relay ? 'color: var(--accent-emerald);' : ''}">${e.entry_time}</div>
              ${!e.is_relay ? `
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
                  예상 <b>${e.estimated_heat}조 ${e.estimated_lane}레인</b>
                </div>
                <div style="font-size: 0.7rem; color: var(--accent-gold); margin-top: 2px;">
                  시드 #${e.rank_in_category}/${e.total_in_category}
                </div>
              ` : `
                <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
                  엔트리 순번 #${e.estimated_heat}
                </div>
              `}
            </div>
          </div>
        </div>
      `;
    });
  }

  myTeamTimelineList.innerHTML = html;
}

// Copy Team Schedule to Clipboard
copyTeamScheduleBtn.addEventListener('click', () => {
  const myTeamIds = getMyTeamIds();
  if (myTeamIds.length === 0) {
    showToast('등록된 팀원이 없습니다.');
    return;
  }

  const teamAthletes = myTeamIds.map(id => searchEngine.athleteMap.get(id)).filter(Boolean);
  const allEntries = [];
  teamAthletes.forEach(ath => {
    (searchEngine.athleteEntriesMap.get(ath.id) || []).forEach(e => allEntries.push(e));
  });

  allEntries.sort((a, b) => a.day - b.day || (a.session === 'Morning' ? -1 : 1) || (a.time_est || '').localeCompare(b.time_est || ''));

  let text = `[Lets Swim World Masters] 싱가포르 월마 우리 팀 경기 일정\n`;
  text += `총 팀원: ${teamAthletes.length}명 / 출전 경기: ${allEntries.length}건\n`;
  text += `------------------------------------\n`;

  let currentDay = null;
  allEntries.forEach(e => {
    if (e.day !== currentDay) {
      currentDay = e.day;
      text += `\n📅 [Day ${currentDay} - ${e.date_label || ''}]\n`;
    }
    text += `• ${e.time_est || '09:00'} | ${e.event} (${e.venue || 'WCA / OCBC'})\n`;
    text += `   - ${e.athlete_name} (${e.category}) : ${e.entry_time} (예상 ${e.estimated_heat}조 ${e.estimated_lane}레인)\n`;
  });

  text += `\n공유: Lets Swim World Masters (https://lets-swim-world-masters.netlify.app)`;

  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 단톡방용 일정이 클립보드에 복사되었습니다!');
  }).catch(() => {
    showToast('복사에 실패했습니다. 권한을 확인해주세요.');
  });
});

// Download Graphic Share Card via HTML5 Canvas
downloadCardBtn.addEventListener('click', () => {
  const myTeamIds = getMyTeamIds();
  if (myTeamIds.length === 0) {
    showToast('등록된 팀원이 없습니다.');
    return;
  }

  const canvas = document.getElementById('shareCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 1000;

  // Background gradient - Deep Aquatic Pool Navy
  const bg = ctx.createLinearGradient(0, 0, 800, 1000);
  bg.addColorStop(0, '#040e21');
  bg.addColorStop(0.4, '#081e3d');
  bg.addColorStop(1, '#051329');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 800, 1000);

  // Water Wave Accent Ribbon
  const waveGrad = ctx.createLinearGradient(40, 0, 760, 0);
  waveGrad.addColorStop(0, '#0284c7');
  waveGrad.addColorStop(0.5, '#38bdf8');
  waveGrad.addColorStop(1, '#14b8a6');
  ctx.fillStyle = waveGrad;
  ctx.fillRect(40, 25, 720, 6);

  // Header
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText('LETS SWIM WORLD MASTERS', 40, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('싱가포르 월드마스터즈 우리 팀 경기 출전표', 40, 118);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px sans-serif';
  ctx.fillText(`등록 선수: ${myTeamIds.length}명  |  Lets Swim Official PWA`, 40, 150);

  // Divider line
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 175);
  ctx.lineTo(760, 175);
  ctx.stroke();

  // Draw Entries
  const teamAthletes = myTeamIds.map(id => searchEngine.athleteMap.get(id)).filter(Boolean);
  const allEntries = [];
  teamAthletes.forEach(ath => {
    (searchEngine.athleteEntriesMap.get(ath.id) || []).forEach(e => allEntries.push(e));
  });
  allEntries.sort((a, b) => a.day - b.day || (a.time_est || '').localeCompare(b.time_est || ''));

  let y = 220;
  const maxItems = Math.min(10, allEntries.length);

  for (let i = 0; i < maxItems; i++) {
    const e = allEntries[i];
    // Card background - Pool Tile
    ctx.fillStyle = 'rgba(11, 33, 64, 0.88)';
    ctx.roundRect ? ctx.roundRect(40, y - 30, 720, 64, 10) : ctx.fillRect(40, y - 30, 720, 64);
    ctx.fill();

    // Day & Time badge
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Day ${e.day} ${e.time_est || '09:00'}`, 55, y + 8);

    // Event & Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(e.athlete_name, 195, y + 8);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`${e.event} (${e.category})`, 380, y + 8);

    // Time
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(e.entry_time, 660, y + 8);

    y += 74;
  }

  if (allEntries.length > 10) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText(`... 외 ${allEntries.length - 10}개 경기 일정은 Lets Swim 앱에서 확인하세요!`, 40, y + 10);
  }

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '14px sans-serif';
  ctx.fillText('Generated by Lets Swim World Masters · 100% Offline PWA', 40, 960);

  // Download
  const link = document.createElement('a');
  link.download = `lets_swim_team_schedule.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('📸 팀 경기 일정 이미지가 다운로드되었습니다!');
});

// --- Schedule View Controller ---
scheduleDaySelector.addEventListener('click', (e) => {
  const btn = e.target.closest('.day-tab-btn');
  if (!btn) return;
  scheduleDaySelector.querySelectorAll('.day-tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeScheduleDay = parseInt(btn.dataset.day, 10);
  renderScheduleView();
});

function renderScheduleView() {
  if (currentEdition === 'budapest_2027') {
    scheduleEventList.innerHTML = `
      <div class="state-container" style="padding: 40px 10px;">
        <div style="font-size: 2.8rem; margin-bottom: 10px;">⏱️ 🇭🇺</div>
        <div class="state-title">부다페스트 2027 공식 일정표 대기 중</div>
        <div class="state-desc" style="max-width: 320px;">
          세계수영연맹(World Aquatics)에서 부다페스트 대회 일자별 경기 순서 및 타임라인을 발표하면 즉시 업데이트됩니다.
        </div>
        <button class="btn-primary" style="margin-top: 16px;" onclick="window.aquaApp.selectEdition('singapore_2025')">
          🇸🇬 2025 싱가포르 공식 일정표 보기
        </button>
      </div>
    `;
    return;
  }

  if (!dataset) return;
  const myTeamIds = new Set(getMyTeamIds());
  const dayEvents = dataset.events.filter(e => e.day === activeScheduleDay);

  let html = `
    <div class="venue-info-box">
      <div style="font-size: 0.82rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
        <span>🏟️</span> <span>공식 경기장 배정 안내 (남/여 일자별 교차 진행)</span>
      </div>
      <div style="font-size: 0.76rem; color: #cbd5e1; margin-top: 6px; line-height: 1.55;">
        • <b>1, 3, 5일차 (Day 1, 3, 5)</b>: <b style="color: #f472b6;">여자 WCA</b> / <b style="color: #7dd3fc;">남자 OCBC</b><br>
        • <b>2, 4, 6일차 (Day 2, 4, 6)</b>: <b style="color: #7dd3fc;">남자 WCA</b> / <b style="color: #f472b6;">여자 OCBC</b><br>
        • <b>7일차 (8/14 목 계영)</b>: <b style="color: #34d399;">OCBC Aquatic Center (남/여/혼성 단체전 단독)</b>
      </div>
    </div>
  `;
  const morningEvents = dayEvents.filter(e => e.session === 'Morning');
  const afternoonEvents = dayEvents.filter(e => e.session === 'Afternoon');

  const renderSessionEvents = (title, events) => {
    let sHtml = `
      <div class="session-header">
        <span class="session-badge">${title.includes('오전') ? '🌅 MORNING' : '☀️ AFTERNOON'}</span>
        <span>${title}</span>
      </div>
    `;

    events.forEach(ev => {
      // Find how many my team athletes are in this event (Individual + Relay)
      const matchedTeamAthletes = [];
      if (ev.is_relay) {
        const athNames = new Set(Array.from(myTeamIds).map(id => searchEngine.athleteMap.get(id)?.name?.toUpperCase()?.trim()).filter(Boolean));
        dataset.relays.filter(r => r.event === ev.name).forEach(r => {
          const mNames = r.members.filter(m => athNames.has(m.name.toUpperCase().trim())).map(m => m.name);
          if (mNames.length > 0) {
            matchedTeamAthletes.push({ athlete_name: `${r.name} (${mNames.join(', ')})`, entry_time: r.entry_time });
          }
        });
      } else {
        dataset.entries.filter(e => e.event === ev.name).forEach(e => {
          if (myTeamIds.has(e.athlete_id)) {
            matchedTeamAthletes.push(e);
          }
        });
      }

      const timeRange = ev.end_est ? `${ev.time_est} ~ ${ev.end_est}` : `예상 ${ev.time_est}`;
      const venueStr = ev.venue || (ev.name.includes('Men') ? 'World Aquatics Arena (WCA)' : 'OCBC Aquatic Center');
      const venueClass = venueStr.includes('WCA') ? 'wca' : (venueStr.includes('계영') ? 'relay' : 'ocbc');

      sHtml += `
        <div class="card" onclick="window.aquaApp.openEventDetails('${escapeHtml(ev.name)}')" style="cursor: pointer; ${ev.is_relay ? 'border-left: 3px solid var(--accent-emerald);' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.76rem; color: var(--accent-cyan); font-weight: 700;">
                ⏰ ${timeRange} · Event #${ev.event_order}
              </div>
              <div style="font-size: 1.05rem; font-weight: 700; color: #fff; margin-top: 2px;">
                ${escapeHtml(ev.name)}
              </div>
              <div class="entry-venue-tag ${venueClass}" style="margin-top: 4px;">
                📍 ${escapeHtml(venueStr)}
              </div>
            </div>
            ${matchedTeamAthletes.length > 0 ? `
              <span class="rank-badge top-seed" style="padding: 4px 8px;">★ 우리팀 ${matchedTeamAthletes.length}팀/명</span>
            ` : ''}
          </div>

          ${matchedTeamAthletes.length > 0 ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 0.8rem; color: var(--text-muted);">
              출전: ${matchedTeamAthletes.map(m => `<b>${m.athlete_name}</b>(${m.entry_time})`).join(', ')}
            </div>
          ` : ''}
        </div>
      `;
    });
    return sHtml;
  };

  const dayDateLabel = dayEvents[0]?.date_label || `Day ${activeScheduleDay}`;
  if (morningEvents.length > 0) html += renderSessionEvents(`Day ${activeScheduleDay} (${dayDateLabel}) 오전 세션`, morningEvents);
  if (afternoonEvents.length > 0) html += renderSessionEvents(`Day ${activeScheduleDay} (${dayDateLabel}) 오후 세션`, afternoonEvents);

  scheduleEventList.innerHTML = html;
}

// --- Events Browser Controller ---
eventCategoryFilters.addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-chip');
  if (!btn) return;
  eventCategoryFilters.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeStrokeFilter = btn.dataset.stroke;
  renderEventsView();
});

function renderEventsView() {
  if (currentEdition === 'budapest_2027') {
    eventsList.innerHTML = `
      <div class="state-container" style="padding: 40px 10px;">
        <div style="font-size: 2.8rem; margin-bottom: 10px;">🏊 🇭🇺</div>
        <div class="state-title">부다페스트 2027 종목 리스트 대기 중</div>
        <div class="state-desc" style="max-width: 320px;">
          공식 프로그램 발표 시 종목별 대진표가 열립니다.
        </div>
        <button class="btn-primary" style="margin-top: 16px;" onclick="window.aquaApp.selectEdition('singapore_2025')">
          🇸🇬 2025 싱가포르 종목별 대진표 보기
        </button>
      </div>
    `;
    return;
  }

  if (!dataset) return;
  let list = dataset.events;
  if (activeStrokeFilter !== 'all') {
    list = list.filter(e => e.name.includes(activeStrokeFilter));
  }

  let html = '';
  list.forEach(ev => {
    html += `
      <div class="card" onclick="window.aquaApp.openEventDetails('${escapeHtml(ev.name)}')" style="cursor: pointer;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.75rem; color: var(--text-sub); font-weight: 600;">Day ${ev.day} (${ev.session})</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #fff; margin-top: 2px;">${escapeHtml(ev.name)}</div>
          </div>
          <span style="color: var(--accent-cyan); font-weight: 700; font-size: 0.85rem;">대진표 &gt;</span>
        </div>
      </div>
    `;
  });

  eventsList.innerHTML = html;
}

// --- Modal Bottom Sheet (Athlete & Event Details) ---
function openAthleteModal(athleteId) {
  const details = searchEngine.getAthleteDetails(athleteId);
  if (!details) return;

  const { athlete, entries, relays } = details;
  const inTeam = isAthleteInMyTeam(athleteId);

  const krName = getKoreanAthleteName(athlete.name);

  modalTitle.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <span>${escapeHtml(athlete.name)}</span>
      ${krName ? `<span class="athlete-kr-name" style="font-size: 1.05rem; padding: 2px 8px;">${escapeHtml(krName)}</span>` : ''}
      <span class="gender-badge ${athlete.gender === 'M' ? 'gender-m' : 'gender-w'}">
        ${athlete.gender === 'M' ? '남(M) ♂' : '여(W) ♀'}
      </span>
    </div>
  `;
  modalSubTitle.innerHTML = `
    <span class="team-badge">${escapeHtml(athlete.team || '개인')}</span>
    <span>Cat ${athlete.category} (${athlete.birth_year}년생)</span>
  `;

  let bodyHtml = `
    <div style="display: flex; gap: 10px; margin-bottom: 20px;">
      <button class="btn-primary" style="flex: 1;" onclick="window.aquaApp.toggleMyTeam('${athlete.id}'); window.aquaApp.openAthleteModal('${athlete.id}');">
        ${inTeam ? '★ 우리 팀에서 제거' : '★ 우리 팀으로 등록'}
      </button>
      <button class="btn-secondary" onclick="window.aquaApp.downloadAthleteICS('${athlete.id}')">
        📅 캘린더 저장
      </button>
    </div>

    <div style="font-weight: 700; color: #fff; margin-bottom: 10px; font-size: 0.95rem;">
      개인 출전 종목 (${entries.length}개)
    </div>
  `;

  if (entries.length === 0) {
    bodyHtml += `<div style="color: var(--text-muted); font-size: 0.85rem;">개인 출전 종목이 없습니다.</div>`;
  } else {
    entries.forEach(e => {
      const venueStr = e.venue || (athlete.gender === 'M' ? 'World Aquatics Arena (WCA)' : 'OCBC Aquatic Center');
      const venueClass = venueStr.includes('WCA') ? 'wca' : (venueStr.includes('계영') ? 'relay' : 'ocbc');

      bodyHtml += `
        <div class="card" style="margin-bottom: 8px; background: rgba(5, 19, 41, 0.65); border: 1px solid rgba(56, 189, 248, 0.18); border-left: 3.5px solid var(--water-cyan);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 0.75rem; color: var(--water-cyan); font-weight: 700;">
                Day ${e.day} (${e.date_label || ''} ${e.session}) · 시작 예상 ${e.time_est || '09:00'} ${e.end_est ? `~ ${e.end_est}` : ''}
              </div>
              <div style="font-size: 1rem; font-weight: 700; color: #fff; margin-top: 2px;">
                ${escapeHtml(e.event)}
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">
                카테고리: <b>Cat ${e.category}</b> · <span class="entry-venue-tag ${venueClass}" style="margin-top: 0;">📍 <b>${escapeHtml(venueStr)}</b></span>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="time-badge">${e.entry_time}</div>
              <div style="font-size: 0.75rem; color: var(--accent-gold); margin-top: 2px;">
                시드 #${e.rank_in_category} / ${e.total_in_category}명
              </div>
              <div style="font-size: 0.72rem; color: var(--text-sub); margin-top: 2px;">
                예상 ${e.estimated_heat}조 ${e.estimated_lane}레인
              </div>
            </div>
          </div>
        </div>
      `;
    });
  }

  // Relays
  if (relays.length > 0) {
    bodyHtml += `
      <div style="font-weight: 700; color: #fff; margin: 18px 0 10px 0; font-size: 0.95rem;">
        🏊 계영(Relay) 단체전 출전 정보 (${relays.length}개)
      </div>
    `;

    relays.forEach(r => {
      bodyHtml += `
        <div class="card" style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 19, 41, 0.7) 100%); border: 1px solid rgba(16, 185, 129, 0.35); border-left: 3.5px solid #10b981;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <div style="font-size: 0.75rem; color: #34d399; font-weight: 700; margin-bottom: 4px;">
                Day ${r.day || 7} (${r.date_label || '8/14(목)'}) · 시작 예상 ${r.time_est || '09:00'} · 📍 ${r.venue || 'OCBC Aquatic Center'}
              </div>
              <div style="font-size: 1rem; font-weight: 700; color: #fff;">${escapeHtml(r.name)}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(r.event)} · Cat ${r.category}</div>
            </div>
            <div class="time-badge" style="color: #34d399;">${r.entry_time}</div>
          </div>
          <div style="margin-top: 8px; font-size: 0.78rem; color: var(--text-sub);">
            영자: ${r.members.map(m => m.name === athlete.name ? `<b>${m.name}</b>` : m.name).join(', ')}
          </div>
        </div>
      `;
    });
  }

  modalBody.innerHTML = bodyHtml;
  modalOverlay.classList.add('active');
}

// Open Event Details (Seeding rank within event)
function openEventDetails(eventName) {
  const entries = dataset.entries.filter(e => e.event === eventName);
  const myTeamIds = new Set(getMyTeamIds());

  modalTitle.textContent = eventName;
  modalSubTitle.textContent = `총 출전: ${entries.length}명`;

  // Group by category
  const catGroups = {};
  entries.forEach(e => {
    if (!catGroups[e.category]) catGroups[e.category] = [];
    catGroups[e.category].push(e);
  });

  let html = `<div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 14px;">연령 카테고리별 시드 랭킹표입니다.</div>`;

  // Sort categories
  const sortedCats = Object.keys(catGroups).sort((a, b) => {
    const aMin = parseInt(a.split('-')[0], 10);
    const bMin = parseInt(b.split('-')[0], 10);
    return bMin - aMin; // oldest first as official masters format
  });

  sortedCats.forEach(cat => {
    const list = catGroups[cat];
    list.sort((a, b) => a.entry_time_seconds - b.entry_time_seconds);

    html += `
      <div style="margin-top: 14px; margin-bottom: 6px; font-weight: 700; color: var(--accent-cyan); font-size: 0.95rem; display: flex; justify-content: space-between;">
        <span>Cat ${cat}</span>
        <span style="font-size: 0.75rem; color: var(--text-sub);">${list.length}명</span>
      </div>
      <div class="card" style="padding: 8px 12px; margin-bottom: 12px; background: rgba(0,0,0,0.3);">
    `;

    list.forEach((e, idx) => {
      const inTeam = myTeamIds.has(e.athlete_id);
      const krName = getKoreanAthleteName(e.athlete_name);
      html += `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.82rem; ${inTeam ? 'color: var(--accent-gold); font-weight: 700;' : ''}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: var(--text-sub); width: 22px;">#${idx + 1}</span>
            <span>${escapeHtml(e.athlete_name)} ${krName ? `<span class="athlete-kr-name" style="font-size: 0.76rem; padding: 1px 5px;">${escapeHtml(krName)}</span>` : ''} ${inTeam ? '★' : ''}</span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">(${escapeHtml(e.team)})</span>
          </div>
          <span style="font-family: var(--font-display); font-weight: 700; color: var(--accent-cyan);">${e.entry_time}</span>
        </div>
      `;
    });

    html += `</div>`;
  });

  modalBody.innerHTML = html;
  modalOverlay.classList.add('active');
}

// Download .ics Calendar File
function downloadAthleteICS(athleteId) {
  const details = searchEngine.getAthleteDetails(athleteId);
  if (!details) return;

  const { athlete, entries } = details;
  if (entries.length === 0) {
    showToast('등록할 경기 일정이 없습니다.');
    return;
  }

  // Base date for Singapore 2025 Swimming competition
  // e.g. Day 1: 2025-08-07, Day 2: 2025-08-08, etc.
  const baseYear = 2025;
  const baseMonth = 8; // August
  const baseDayStart = 7;

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lets Swim World Masters//World Masters Singapore//KO',
    'CALSCALE:GREGORIAN'
  ];

  entries.forEach(e => {
    const rawDate = e.date || '2025-08-07';
    const dateStr = rawDate.replace(/-/g, '');
    const startTime = e.time_est ? e.time_est.replace(':', '') + '00' : (e.session === 'Morning' ? '090000' : '140000');
    const endTime = e.end_est ? e.end_est.replace(':', '') + '00' : (e.session === 'Morning' ? '120000' : '170000');
    const venue = e.venue || 'Singapore OCBC Aquatic Centre';

    icsContent.push(
      'BEGIN:VEVENT',
      `SUMMARY:[월마] ${athlete.name} - ${e.event}`,
      `DESCRIPTION:선수: ${athlete.name}\\n종목: ${e.event}\\n카테고리: ${e.category}\\n신청기록: ${e.entry_time}\\n예상: ${e.estimated_heat}조 ${e.estimated_lane}레인 (시드 #${e.rank_in_category})\\n경기장: ${venue}`,
      `LOCATION:${venue}`,
      `DTSTART:${dateStr}T${startTime}`,
      `DTEND:${dateStr}T${endTime}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'DESCRIPTION:수영 경기 1시간 전 워밍업 알림',
      'ACTION:DISPLAY',
      'END:VALARM',
      'END:VEVENT'
    );
  });

  icsContent.push('END:VCALENDAR');

  const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `world_masters_${athlete.name.replace(/\s+/g, '_')}.ics`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('📅 캘린더(.ics) 일정이 다운로드되었습니다!');
}

modalCloseBtn.addEventListener('click', () => {
  modalOverlay.classList.remove('active');
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.remove('active');
  }
});

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Force update data helper
async function forceUpdateData() {
  showToast('🔄 최신 공식 경기 데이터로 동기화 중...');
  try {
    await clearLocalDataset();
    try {
      indexedDB.deleteDatabase('AquaMastersDB');
      indexedDB.deleteDatabase('LetsSwimWorldMastersDB');
    } catch (e) {}
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (err) {
    console.warn(err);
  }
  setTimeout(() => {
    window.location.reload(true);
  }, 300);
}

// Global exposure for inline HTML event handlers
window.aquaApp = {
  switchTab,
  selectTeam,
  toggleMyTeam,
  openAthleteModal,
  openEventDetails,
  downloadAthleteICS,
  forceUpdateData,
  openChampionshipModal,
  selectEdition
};

// Start the app
initApp();
