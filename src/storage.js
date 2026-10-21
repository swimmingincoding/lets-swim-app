// Storage & IndexedDB Offline Manager for Lets Swim World Masters

export const CURRENT_DATA_VERSION = '20250814_official_timeline_rev_030825_venues_v4';
const DB_NAME = 'LetsSwimWorldMastersDB_v2';
const DB_VERSION = 2;
const STORE_NAME = 'masters_dataset';
const MY_TEAM_KEY = 'wa_my_team_ids';

// Clean up legacy database if it exists
try {
  indexedDB.deleteDatabase('AquaMastersDB');
} catch (e) {
  // ignore
}

// IndexedDB Helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDatasetToLocal(data) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(data, 'main_data');
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Failed to save dataset to IndexedDB', err);
    return false;
  }
}

export async function getDatasetFromLocal() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('main_data');
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to read dataset from IndexedDB', err);
    return null;
  }
}

export async function clearLocalDataset() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Failed to clear dataset', err);
    return false;
  }
}

// Load dataset (Cache -> Network -> IndexedDB)
export async function loadMastersData(onProgress) {
  if (onProgress) onProgress('로컬 캐시 확인 중...');
  
  // 1. Check local IndexedDB first
  const localData = await getDatasetFromLocal();
  if (localData && localData.metadata && localData.metadata.version === CURRENT_DATA_VERSION) {
    if (onProgress) onProgress('최신 공식 대진표 로드 완료');
    return localData;
  }

  // 2. Fetch latest official JSON with cache-busting
  if (onProgress) onProgress('공식 경기 타임라인 데이터 다운로드 중 (약 1.5MB)...');
  try {
    const res = await fetch(`./data/masters_data.json?v=${CURRENT_DATA_VERSION}`, {
      cache: 'reload'
    });
    if (!res.ok) {
      throw new Error(`데이터 로드 실패: ${res.status}`);
    }
    
    const data = await res.json();
    if (onProgress) onProgress('로컬 데이터베이스 최신화 중...');
    
    // Save to IndexedDB asynchronously
    await saveDatasetToLocal(data);
    return data;
  } catch (err) {
    console.warn('Network fetch failed, fallback to localData if present', err);
    if (localData) {
      if (onProgress) onProgress('오프라인 캐시 데이터 로드 완료');
      return localData;
    }
    throw err;
  }
}

// My Team LocalStorage Management
export function getMyTeamIds() {
  try {
    const raw = localStorage.getItem(MY_TEAM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMyTeamIds(ids) {
  try {
    localStorage.setItem(MY_TEAM_KEY, JSON.stringify(ids));
  } catch (err) {
    console.warn('LocalStorage save failed', err);
  }
}

export function isAthleteInMyTeam(athleteId) {
  const ids = getMyTeamIds();
  return ids.includes(athleteId);
}

export function toggleMyTeamAthlete(athleteId) {
  const ids = getMyTeamIds();
  const idx = ids.indexOf(athleteId);
  let added = false;
  if (idx >= 0) {
    ids.splice(idx, 1);
  } else {
    ids.push(athleteId);
    added = true;
  }
  saveMyTeamIds(ids);
  return { added, total: ids.length };
}

export function addMultipleToMyTeam(athleteIds) {
  const ids = new Set(getMyTeamIds());
  athleteIds.forEach(id => ids.add(id));
  const newArr = Array.from(ids);
  saveMyTeamIds(newArr);
  return newArr.length;
}

export function clearMyTeam() {
  saveMyTeamIds([]);
}
