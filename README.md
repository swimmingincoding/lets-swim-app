# 🏊 AquaMasters Live (싱가포르 월마 모바일 대진표 & 팀 매니저)

> **276페이지 14,000건의 방대한 공식 대진표 PDF를 0.1초 만에 스마트폰에서 조회하는 오프라인 지원 PWA 모바일 웹앱**

---

## 🌟 핵심 기능
1. **0.1초 실시간 인스턴트 검색 & 한/영 퍼지 매칭**
   - 영문명(`BAEK Hyoungjeong`), 한글 성씨(`김`, `이`, `박`), 소속 클럽명(`SWIMON`, `MAD88`), 종목명 실시간 검색
2. **'우리 팀 (My Team)' 원클릭 타임라인 피드**
   - 선수 카드에서 `★ 버튼`을 누르면 우리 팀으로 자동 등록
   - Day 1 ~ Day 6 일자별 및 오전/오후 세션별로 팀원 경기 시간순 정렬
   - 카카오톡 단톡방 공지용 텍스트 원클릭 복사
   - 오늘의 팀 경기 일정 그래픽 카드 이미지(.png) 자동 생성 및 다운로드
3. **대회 공식 스케줄(Programme) & 시드 랭킹 매핑**
   - 개인 종목 신청기록(E.TIME) 기반 해당 연령 카테고리 내 시드 순위 및 예상 조(Heat)/레인(Lane) 자동 계산
   - 계영(Relay) 팀 4명 영자 명단 및 개인 출전 정보 연동
4. **100% 오프라인 지원 PWA (Progressive Web App)**
   - 경기장 수영장 지하, 대기실 등 Wi-Fi/데이터 음영 지역에서도 비행기 모드로 100% 정상 작동
   - 최초 1회 방문 시 약 800KB의 전체 데이터셋을 브라우저 IndexedDB에 영구 캐싱
5. **모바일 캘린더(.ics) 내보내기**
   - 선수 상세 모달에서 Apple 캘린더 / Google 캘린더에 원클릭 등록 (경기 1시간 전 알림)

---

## 🚀 로컬 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 실행 (모바일 테스트 가능)
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

---

## 📂 프로젝트 구조

```text
wa_swim/
├── SWM_EntryList MEN.pdf        # 남성부 공식 대진표 (169p)
├── SWM_EntryList WOMEN.pdf      # 여성부 공식 대진표 (107p)
├── scripts/
│   ├── parse_pdf.py             # 276p PDF 전수 파서 (PyMuPDF)
│   └── generate_icons.py        # PWA 고해상도 앱 아이콘 생성기
├── public/
│   ├── data/
│   │   └── masters_data.json    # 파싱된 14,091건 정형 데이터셋
│   ├── manifest.json            # PWA 웹앱 매니페스트
│   ├── sw.js                    # 오프라인 Service Worker 캐싱
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── storage.js               # IndexedDB & LocalStorage 매니저
│   ├── search.js                # 한/영 음차 & 퍼지 검색 엔진
│   ├── index.css                # 럭셔리 아쿠아 사이버 디자인 시스템
│   └── app.js                   # 모바일 뷰 렌더러 & 인터랙션 컨트롤러
├── index.html                   # 모바일 퍼스트 셸 마크업
└── package.json
```
