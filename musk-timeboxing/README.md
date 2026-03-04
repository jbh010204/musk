# Musk Time-Boxing Planner

할 일 목록이 아니라 시간 블록 설계에 집중하는 로컬 웹 플래너입니다.

## 기술 스택

- Vite + React 18
- Tailwind CSS v3
- dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`)
- localStorage (날짜별 `musk-planner-YYYY-MM-DD` 키)

## 개발 실행

```bash
npm install
npm run dev
```

## 프로덕션 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

## 데이터 백업/복원

- 우하단 `데이터` 플로팅 버튼으로 백업/복원 모달을 엽니다.
- 내보내기:
  - `전체 내보내기`: 모든 날짜 + 카테고리 메타 JSON 생성
  - `오늘 내보내기`: 현재 날짜 데이터 중심 JSON 생성
- 가져오기:
  - `병합`: 기존 데이터 유지 + JSON 추가 반영
  - `교체`: 기존 planner 데이터 삭제 후 JSON으로 대체

## 정적 배포

`vite.config.js`의 `base: './'`가 설정되어 있어 상대 경로 정적 호스팅이 가능합니다.

### GitHub Pages

1. `npm run build`
2. 생성된 `dist/` 내용을 배포 브랜치(`gh-pages`) 또는 `docs/`로 업로드
3. 저장소 Settings > Pages에서 배포 브랜치/폴더 선택

### Vercel

1. 프로젝트를 Vercel에 연결
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Deploy

## 참고

현재 Vite 7은 Node.js `20.19+`를 권장합니다. Node.js가 `20.17` 이하이면 경고가 표시될 수 있습니다.

## AI 협업 문서

- 세션 운영 가이드: `.agents/SESSION_PLAYBOOK.md`
- 엔지니어링 컨벤션: `docs/ENGINEERING_CONVENTIONS.md`
