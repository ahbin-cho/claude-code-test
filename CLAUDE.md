# 기다림 항구: 프로젝트 메모

## 무엇을 만드는가
펫로스 추모 마을 "별꾹"(starkkuk.com)의 공식을 '기다림'에 옮긴 서비스.
핵심 감정 장치 세 가지를 지킨다:
1. 정체성 전환: 사용자는 자기 이름이 아니라 "○○를 기다리는 사람"으로 불린다.
2. 함께 있다는 감각: 지금 접속한 사람이 실시간으로 보인다.
3. 기다림의 시각화: 돌아올 날이 가까울수록 등불이 밝아진다.
새 기능은 이 세 가지를 강화하는지로 판단한다.

## 구조
- `src/hooks/useHarbor.ts`: 익명 로그인, 데이터 로드, Realtime 구독, presence, 쓰기 동작 전부
- `src/three/Village.ts`: three.js 3D 마을 (지형, 하늘, 등불, 카메라 이동, 이름표 위치, 누르기)
- `src/components/`: Village3D(3D 마을 React 래퍼), LanternForm, LanternDetail, Sheet(바텀시트)
- `src/lib/places.ts`: 장소(항구/숲/언덕/등대), 노이즈 섬 지형, 휘어진 부두, 등불 자리
- `src/lib/looks.ts`: 등불 꾸미기 (불빛 색 7가지, 모양 3가지)
- `src/lib/waiting.ts`: 날짜 계산, 조사(을/를) 처리
- `supabase/schema.sql`: 테이블, RLS 정책, Realtime 설정

## 규칙
- UI 문구는 한국어, 존댓말 해요체. 짧고 따뜻하게, 과장 없이.
- 모바일 우선. 화면은 돌려보고 확대하는 3D 밤 마을 하나, 상세와 입력은 바텀시트.
- 처음엔 멀리서 마을 전체, 장소를 고르면 그곳으로, 등불을 열면 그 등불로 카메라가 다가간다.
- 색은 styles.css 의 :root 토큰만 쓴다. 3D 장면 색(Village.ts 의 C)은 같은 값을 따른다. 등불 색은 looks.ts 에만. 테마는 한밤 하나로 고정.
- 자로 그은 직선과 완벽한 대칭은 피한다. 지형, 부두, 등불 자리, 기울기는 노이즈로 조금씩 흐트러뜨린다.
- 빛을 내는 건 등불뿐이다. 등불 밝기는 사람이 고른 색과 상관없이 돌아올 날이 가까울수록 밝아진다.
- 폰트: 제목 Gowun Batang, 본문 Gowun Dodum, 사용자가 쓴 한 줄과 지도의 장소 이름은 손글씨 Nanum Pen Script.
- 빛나는 버튼, 유리 효과, 장식용 작은 글씨처럼 흔한 AI 디자인 장식은 쓰지 않는다.
- 사용자 입력은 항상 텍스트로 렌더링 (dangerouslySetInnerHTML 금지).
- DB 권한은 RLS 로 막는다. 클라이언트 검사는 편의일 뿐.

## 명령
- `npm run dev` 개발 서버
- `npm run build` 타입 검사 + 빌드
- `npm run check:supabase` .env 의 Supabase 연결 확인
