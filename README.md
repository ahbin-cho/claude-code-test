# 기다림 항구

돌아올 사람을 기다리는 사람들이 등불을 걸어두는 곳.
군대 간 애인, 장거리 연애, 해외에 있는 가족을 기다리는 사람들이 각자 등불을 걸고,
돌아올 날이 가까울수록 불빛이 밝아져요.

## 기능
- 회원가입 없이 익명으로 입장
- 내 등불 걸기: 기다리는 사람 이름, 기다림 종류, 시작일, 돌아오는 날, 오늘의 한 줄
- "지수를 기다리는 사람"처럼 기다리는 사람의 이름으로 불림
- 돌아올 날이 가까울수록 등불이 밝아지고, D-day가 지나면 "다시 만났어요"
- 지금 접속한 사람의 등불은 살짝 흔들림 (실시간)
- 다른 사람 등불에 하루 한 번 온기 보내기, 내 등불이 온기를 받으면 반짝임

## 기술
Vite + React + TypeScript, Supabase (DB, 익명 로그인, Realtime)

## 시작하기
1. https://supabase.com 에서 새 프로젝트를 만들어요.
2. Authentication > Sign In / Providers 에서 **Anonymous sign-ins** 를 켜요.
3. SQL Editor 에 `supabase/schema.sql` 을 붙여넣고 실행해요. (여러 번 실행해도 괜찮아요)
4. Project Settings > API 에서 URL과 anon key를 복사해서 `.env` 파일을 만들어요.
   ```
   cp .env.example .env
   ```
5. 연결 확인 (익명 로그인, 테이블 읽기, Realtime 구독을 차례로 확인해요)
   ```
   npm install
   npm run check:supabase
   ```
6. 실행
   ```
   npm run dev
   ```

## 배포
Vercel 이나 Netlify 에 저장소를 연결하고, 환경 변수 두 개(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)만 넣으면 돼요.

## 다음에 해볼 것
- 공유 카드: 내 등불을 이미지로 저장해서 인스타 스토리에 올리기
- 돌아오는 날 알림, 매일 한 줄 남기라는 알림 (PWA 푸시)
- 신고와 차단, 금칙어 필터
- 등불이 많아지면 온기 개수를 DB 뷰로 집계
