# Escape Room Hub

국내 방탈출의 최소 사실 정보와 예약 가능 시간을 정규화해 Web, REST API, MCP로
조회하기 위한 정책 중심 스캐폴드입니다. 이 저장소는 백엔드·데이터 플랫폼 포트폴리오를
목적으로 하며 현재 단계에서는 실제 사이트를 크롤링하거나 실데이터를 제공하지 않습니다.

## 현재 범위

- pnpm 기반 strict TypeScript 모노레포
- React + Vite 웹 앱 셸
- Fastify REST API 계약과 `/health`
- 외부 네트워크 호출이 없는 worker/provider 계약
- stdio 및 Streamable HTTP MCP transport
- PostgreSQL + Drizzle 기본 스키마
- 공개 데이터와 로컬 실험 데이터를 분리하는 정책 가드
- 합성 데이터만 사용하는 단위·계약 테스트와 GitHub Actions

예약 중개, 결제, 실제 provider 구현, 실데이터 수집, 웹 디자인 구현과 배포는 이번
마일스톤에 포함되지 않습니다.

## 구조

```text
apps/
  api/       Fastify REST API
  mcp/       stdio + Streamable HTTP MCP server
  web/       React + Vite app shell
  worker/    provider orchestration entrypoint
packages/
  config/        validated runtime configuration
  contracts/     domain and public I/O schemas
  db/            Drizzle schema and migration
  provider-kit/  provider contract and policy guard
  providers/     fixture and disabled experimental stubs
docs/
  adr/        source-policy decisions
  design/     approved implementation references
```

## 시작하기

필수 버전은 Node.js `24.15.0`, pnpm `11.16.0`, Docker입니다.

```bash
pnpm install
docker compose up -d postgres
pnpm typecheck
pnpm test
pnpm build
```

개발 프로세스는 각 앱의 개별 명령으로 실행합니다.

```bash
pnpm --filter @escape-room-hub/api dev
pnpm --filter @escape-room-hub/web dev
pnpm --filter @escape-room-hub/mcp dev:http
pnpm --filter @escape-room-hub/mcp dev:stdio
```

## 데이터 경계

`DATA_PROFILE`은 다음 두 값만 허용합니다.

- `public-safe`: 공개 API, 웹, HTTP MCP에서 사용할 수 있는 데이터만 조회합니다.
- `local-experimental`: 로컬 실험용이며 공개 HTTP 경로에 노출할 수 없습니다.

MCP와 API 요청은 저장된 읽기 모델만 조회하도록 설계하며, 사용자 요청이 즉시 외부
크롤링을 유발하지 않습니다. 실제 provider 등록은 접근 근거와 배포 범위가 검토되기 전까지
`hold` 상태를 유지합니다.

구체적인 소스 조사, 약관·robots 검토 기록과 허락 증빙은 별도 비공개 저장소에서 관리합니다.
두 저장소는 submodule로 연결하지 않습니다.

## 저작권과 이용 조건

이 저장소에는 라이선스가 없습니다. 소스 코드는 공개되어 있지만 별도 허락 없이 복제,
수정, 배포할 권리가 부여되지 않습니다. 외부 데이터와 상표에 관한 범위는
[THIRD_PARTY_DATA.md](./THIRD_PARTY_DATA.md)를 참고하세요.
