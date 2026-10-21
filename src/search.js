// Instant Search & Phonetic Matching Engine for AquaMasters Live

// ==============================================================================
// 👥 [사용자 직접 추가 구역] 한국 선수 이름 맵핑 규칙 (Korean Athlete Name Mapping)
// ------------------------------------------------------------------------------
// 우리 팀원들의 한글 이름과 대진표 상의 영문 이름을 아래 목록에 추가하면:
// 1) 검색창에 한글 이름(예: '김태균')을 입력했을 때 영문 이름(KIM Teagyun) 선수가 즉시 최우선 매칭됩니다.
// 2) 선수 카드, 내 팀 타임라인, 상세 팝업에 'KIM Teagyun (김태균)' 형태로 한글 이름이 함께 표기됩니다.
// 3) '한글이름': '영문이름' 또는 '영문이름': '한글이름' 어느 방향으로 적어도 자동 인식됩니다.
//
// ✍️ 추가 방법: 아래 중괄호 { } 안에 `'김태균': 'KIM Teagyun',` 형식으로 한 줄씩 추가하세요!
// ==============================================================================
export const KOREAN_ATHLETE_NAMES = {
  // 예시: 김태균 (LETS SWIM KOREA)
  '김태균': 'KIM Teagyun',
  '김희년': 'KIM Heenyon',
  '홍정환': 'HONG Junghwan',
  '류혜주': 'RYU Hyejoo',
  '신영환': 'SHIN Younghwan',
  '박종찬': 'PARK Jongchan',
  '김우철': 'KIM Woochul',
  '주대중': 'JOO Daejoong',
  '전희성': 'JEON Hyi Seong',
  '서한결': 'SEO Hankyul',
  '강윤혜': 'KANG Yunhye',

  // 팀원들을 아래에 자유롭게 추가하세요:
  // '홍길동': 'HONG Gildong',
  // '이수영': 'LEE Sooyoung',
};

// 양방향 조회를 위한 내부 정규화 맵
const KOREAN_TO_ENGLISH_MAP = new Map();
const ENGLISH_TO_KOREAN_MAP = new Map();

function initAthleteNameMaps() {
  KOREAN_TO_ENGLISH_MAP.clear();
  ENGLISH_TO_KOREAN_MAP.clear();

  for (const [k, v] of Object.entries(KOREAN_ATHLETE_NAMES)) {
    if (!k || !v) continue;
    const strK = String(k).trim();
    const strV = String(v).trim();
    const hasHangulK = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(strK);
    const hasHangulV = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(strV);

    let krName = '';
    let enName = '';
    if (hasHangulK && !hasHangulV) {
      krName = strK;
      enName = strV;
    } else if (!hasHangulK && hasHangulV) {
      krName = strV;
      enName = strK;
    } else {
      krName = strK;
      enName = strV;
    }

    if (krName && enName) {
      KOREAN_TO_ENGLISH_MAP.set(krName, enName.toUpperCase());
      ENGLISH_TO_KOREAN_MAP.set(enName.toUpperCase(), krName);
      // 공백 제거 버전도 색인
      ENGLISH_TO_KOREAN_MAP.set(enName.toUpperCase().replace(/\s+/g, ''), krName);
    }
  }
}
initAthleteNameMaps();

/**
 * 대진표의 영문 이름으로 등록된 한글 이름을 찾습니다.
 * @param {string} englishName - 예: 'KIM Teagyun'
 * @returns {string|null} - 예: '김태균' (없으면 null)
 */
export function getKoreanAthleteName(englishName) {
  if (!englishName) return null;
  const upper = englishName.toUpperCase().trim();
  return ENGLISH_TO_KOREAN_MAP.get(upper) || ENGLISH_TO_KOREAN_MAP.get(upper.replace(/\s+/g, '')) || null;
}

/**
 * 한글 이름으로 등록된 대진표 영문 이름을 찾습니다.
 * @param {string} koreanName - 예: '김태균'
 * @returns {string|null} - 예: 'KIM TEAGYUN' (없으면 null)
 */
export function getEnglishAthleteName(koreanName) {
  if (!koreanName) return null;
  const trimmed = koreanName.trim();
  return KOREAN_TO_ENGLISH_MAP.get(trimmed) || null;
}

const KOREAN_CLUB_SYNONYMS = {
  '수영하자': 'LETS SWIM',
  '레츠스윔': 'LETS SWIM',
  '렛츠스윔': 'LETS SWIM',
  '스윔온': 'SWIMON',
  '스윔': 'SWIM',
  '매드': 'MAD88',
  '매드88': 'MAD88',
  '유캔스윔': 'UCANSWIM',
  '유캔': 'UCANSWIM',
  '아로와나': 'AROWANA',
  '한국': 'KOREA',
  '코리아': 'KOREA',
  '서울': 'SEOUL',
  '부산': 'BUSAN'
};

const KOREAN_LASTNAMES = {
  '김': 'KIM',
  '이': 'LEE',
  '박': 'PARK',
  '최': 'CHOI',
  '정': 'JUNG',
  '강': 'KANG',
  '조': 'CHO',
  '윤': 'YOON',
  '장': 'JANG',
  '임': 'LIM',
  '한': 'HAN',
  '오': 'OH',
  '서': 'SEO',
  '신': 'SHIN',
  '권': 'KWON',
  '황': 'HWANG',
  '안': 'AHN',
  '송': 'SONG',
  '전': 'JEON',
  '홍': 'HONG',
  '유': 'YOO',
  '고': 'KO',
  '문': 'MOON',
  '양': 'YANG',
  '손': 'SON',
  '배': 'BAE',
  '백': 'BAEK',
  '허': 'HEO',
  '노': 'NOH',
  '심': 'SHIM',
  '하': 'HA',
  '곽': 'KWAK',
  '성': 'SUNG',
  '차': 'CHA',
  '주': 'JOO',
  '우': 'WOO',
  '구': 'KOO',
  '류': 'RYU'
};

const EVENT_KOREAN_KEYWORDS = {
  '자유형': 'freestyle',
  '자유': 'freestyle',
  '자': 'freestyle',
  '배영': 'backstroke',
  '배': 'backstroke',
  '평영': 'breaststroke',
  '평': 'breaststroke',
  '접영': 'butterfly',
  '접': 'butterfly',
  '혼영': 'medley',
  '개인혼영': 'individual medley',
  '개혼': 'individual medley',
  '계영': 'freestyle',
  '혼계영': 'medley'
};

export class SearchEngine {
  constructor(dataset) {
    this.dataset = dataset;
    this.athletes = dataset.athletes || [];
    this.entries = dataset.entries || [];
    this.relays = dataset.relays || [];
    this.teams = dataset.teams || [];
    this.events = dataset.events || [];

    // Pre-build athlete ID map
    this.athleteMap = new Map();
    this.athletes.forEach(ath => {
      this.athleteMap.set(ath.id, ath);
    });

    // Pre-build entry ID map
    this.entryMap = new Map();
    this.entries.forEach(entry => {
      this.entryMap.set(entry.id, entry);
    });

    // Group entries by athlete
    this.athleteEntriesMap = new Map();
    this.entries.forEach(entry => {
      if (!this.athleteEntriesMap.has(entry.athlete_id)) {
        this.athleteEntriesMap.set(entry.athlete_id, []);
      }
      this.athleteEntriesMap.get(entry.athlete_id).push(entry);
    });

    // Chronologically sort entries for each athlete by day, start time, and event order
    for (const entriesList of this.athleteEntriesMap.values()) {
      entriesList.sort((a, b) => 
        (a.day || 0) - (b.day || 0) || 
        (a.time_est || '').localeCompare(b.time_est || '') || 
        (a.order || 0) - (b.order || 0)
      );
    }

    // Group entries by event & category
    this.eventCategoryEntriesMap = new Map();
    this.entries.forEach(entry => {
      const key = `${entry.event}___${entry.category}`;
      if (!this.eventCategoryEntriesMap.has(key)) {
        this.eventCategoryEntriesMap.set(key, []);
      }
      this.eventCategoryEntriesMap.get(key).push(entry);
    });

    // Sort entries within event+category by entry_time_seconds
    this.eventCategoryEntriesMap.forEach((list) => {
      list.sort((a, b) => a.entry_time_seconds - b.entry_time_seconds);
    });
  }

  normalizeQuery(query) {
    if (!query) return { raw: '', upper: '', mappedAthleteEn: null, romanizedLastname: null };
    const trimmed = query.trim();
    let q = trimmed.toUpperCase();

    // 1. Direct Athlete Korean Name mapping check
    let mappedAthleteEn = null;
    for (const [kr, enUpper] of KOREAN_TO_ENGLISH_MAP.entries()) {
      if (trimmed === kr || (trimmed.length >= 2 && kr.includes(trimmed))) {
        mappedAthleteEn = enUpper;
        break;
      }
    }

    // 2. Check Korean Club Synonyms
    for (const [kr, en] of Object.entries(KOREAN_CLUB_SYNONYMS)) {
      if (trimmed.includes(kr)) {
        q = q.replace(kr.toUpperCase(), en.toUpperCase());
      }
    }

    // 3. Check Korean Lastnames if 1-character Korean syllable
    let romanized = null;
    if (trimmed.length >= 1 && KOREAN_LASTNAMES[trimmed[0]]) {
      romanized = KOREAN_LASTNAMES[trimmed[0]];
    }

    return { raw: trimmed, upper: q, mappedAthleteEn, romanizedLastname: romanized };
  }

  search(query, maxResults = 50) {
    if (!query || !query.trim()) {
      return {
        matchedAthletes: [],
        matchedTeams: [],
        matchedEvents: [],
        totalCount: 0
      };
    }

    const { raw, upper, mappedAthleteEn, romanizedLastname } = this.normalizeQuery(query);
    const cleanUpper = upper.replace(/\s+/g, '');
    const cleanRaw = raw.toLowerCase().trim();

    // 1. Matched Teams
    const matchedTeams = [];
    for (const team of this.teams) {
      const tUpper = team.toUpperCase();
      if (tUpper.includes(upper) || (cleanUpper.length >= 3 && tUpper.replace(/\s+/g, '').includes(cleanUpper))) {
        // Count athletes in this team
        const count = this.athletes.filter(a => a.team === team).length;
        matchedTeams.push({ name: team, athleteCount: count });
        if (matchedTeams.length >= 10) break;
      }
    }

    // 2. Matched Events
    const matchedEvents = [];
    const eventKeyword = EVENT_KOREAN_KEYWORDS[cleanRaw] || cleanRaw;
    
    // Check specific patterns like 50m 자유형, 50자, 100자
    let matchedEventNames = new Set();
    for (const ev of this.events) {
      const evLower = ev.name.toLowerCase();
      const evUpper = ev.name.toUpperCase();
      let isMatch = false;

      if (evUpper.includes(upper) || evLower.includes(cleanRaw)) {
        isMatch = true;
      } else if (cleanRaw.includes('자유') || cleanRaw.includes('freestyle')) {
        if (evLower.includes('freestyle') && !evLower.includes('relay')) {
          if (cleanRaw.includes('50') && evLower.includes('50m')) isMatch = true;
          else if (cleanRaw.includes('100') && evLower.includes('100m')) isMatch = true;
          else if (cleanRaw.includes('200') && evLower.includes('200m')) isMatch = true;
          else if (cleanRaw.includes('400') && evLower.includes('400m')) isMatch = true;
          else if (cleanRaw.includes('800') && evLower.includes('800m')) isMatch = true;
          else if (!/\d+/.test(cleanRaw)) isMatch = true;
        }
      } else if (cleanRaw.includes('배영') || cleanRaw.includes('backstroke')) {
        if (evLower.includes('backstroke')) {
          if (cleanRaw.includes('50') && evLower.includes('50m')) isMatch = true;
          else if (cleanRaw.includes('100') && evLower.includes('100m')) isMatch = true;
          else if (cleanRaw.includes('200') && evLower.includes('200m')) isMatch = true;
          else if (!/\d+/.test(cleanRaw)) isMatch = true;
        }
      } else if (cleanRaw.includes('평영') || cleanRaw.includes('breaststroke')) {
        if (evLower.includes('breaststroke')) {
          if (cleanRaw.includes('50') && evLower.includes('50m')) isMatch = true;
          else if (cleanRaw.includes('100') && evLower.includes('100m')) isMatch = true;
          else if (cleanRaw.includes('200') && evLower.includes('200m')) isMatch = true;
          else if (!/\d+/.test(cleanRaw)) isMatch = true;
        }
      } else if (cleanRaw.includes('접영') || cleanRaw.includes('butterfly')) {
        if (evLower.includes('butterfly')) {
          if (cleanRaw.includes('50') && evLower.includes('50m')) isMatch = true;
          else if (cleanRaw.includes('100') && evLower.includes('100m')) isMatch = true;
          else if (cleanRaw.includes('200') && evLower.includes('200m')) isMatch = true;
          else if (!/\d+/.test(cleanRaw)) isMatch = true;
        }
      } else if (cleanRaw.includes('혼영') || cleanRaw.includes('medley')) {
        if (evLower.includes('medley')) isMatch = true;
      } else if (cleanRaw.includes('계영') || cleanRaw.includes('relay') || cleanRaw.includes('4x50')) {
        if (evLower.includes('4x50m')) isMatch = true;
      }

      if (isMatch) {
        matchedEvents.push(ev);
        matchedEventNames.add(ev.name);
      }
    }

    // 3. Matched Athletes
    const matchedAthletes = [];
    const matchedAthleteIds = new Set();

    for (const ath of this.athletes) {
      const nameUpper = ath.name.toUpperCase();
      const teamUpper = (ath.team || '').toUpperCase();
      const cat = ath.category;

      let score = 0;

      // 1. Exact match via mapped Korean athlete name (Highest Priority)
      if (mappedAthleteEn && (nameUpper === mappedAthleteEn || nameUpper.replace(/\s+/g, '') === mappedAthleteEn.replace(/\s+/g, ''))) {
        score = 250;
      } else if (nameUpper === upper) {
        score = 100;
      } else if (nameUpper.startsWith(upper)) {
        score = 80;
      } else if (nameUpper.includes(upper)) {
        score = 60;
      } else if (teamUpper.includes(upper)) {
        score = 50;
      } else if (romanizedLastname && nameUpper.startsWith(romanizedLastname)) {
        score = 40;
      } else if (cat === query.trim()) {
        score = 30;
      }

      // Check if athlete's mapped Korean name matches raw query
      if (score === 0) {
        const kr = getKoreanAthleteName(ath.name);
        if (kr && (kr === raw || kr.includes(raw) || raw.includes(kr))) {
          score = 200;
        }
      }

      if (score > 0) {
        matchedAthletes.push({ athlete: ath, score });
        matchedAthleteIds.add(ath.id);
      }

      if (matchedAthletes.length >= maxResults * 3) {
        break;
      }
    }

    // 4. If query matched events, also find athletes participating in those events!
    if (matchedEventNames.size > 0 && matchedAthletes.length < maxResults) {
      for (const entry of this.entries) {
        if (matchedEventNames.has(entry.event) && !matchedAthleteIds.has(entry.athlete_id)) {
          const ath = this.athleteMap.get(entry.athlete_id);
          if (ath) {
            matchedAthletes.push({ athlete: ath, score: 20 });
            matchedAthleteIds.add(ath.id);
            if (matchedAthletes.length >= maxResults * 2) break;
          }
        }
      }
    }

    // Sort athletes by score desc, then by name
    matchedAthletes.sort((a, b) => b.score - a.score || a.athlete.name.localeCompare(b.athlete.name));
    const slicedAthletes = matchedAthletes.slice(0, maxResults).map(m => m.athlete);

    return {
      matchedAthletes: slicedAthletes,
      matchedTeams,
      matchedEvents,
      totalCount: slicedAthletes.length + matchedTeams.length + matchedEvents.length
    };
  }

  getAthleteDetails(athleteId) {
    const athlete = this.athleteMap.get(athleteId);
    if (!athlete) return null;

    const rawEntries = this.athleteEntriesMap.get(athleteId) || [];
    const entries = rawEntries.slice().sort((a, b) => 
      (a.day || 0) - (b.day || 0) || 
      (a.time_est || '').localeCompare(b.time_est || '') || 
      (a.order || 0) - (b.order || 0)
    );

    // Find any relays this athlete might be part of
    const athNameClean = athlete.name.toUpperCase().trim();
    const matchedRelays = [];
    for (const relay of this.relays) {
      for (const m of relay.members) {
        if (m.name.toUpperCase().trim() === athNameClean || 
           (m.name.toUpperCase().includes(athlete.name.split(' ')[0]) && m.gender === athlete.gender)) {
          matchedRelays.push({ ...relay, roleMember: m });
          break;
        }
      }
    }

    matchedRelays.sort((a, b) => 
      (a.day || 7) - (b.day || 7) || 
      (a.time_est || '').localeCompare(b.time_est || '')
    );

    return {
      athlete,
      entries,
      relays: matchedRelays
    };
  }

  getTeamAthletes(teamName) {
    return this.athletes.filter(a => a.team === teamName);
  }

  getEntriesForEventCategory(eventName, category) {
    const key = `${eventName}___${category}`;
    return this.eventCategoryEntriesMap.get(key) || [];
  }
}
