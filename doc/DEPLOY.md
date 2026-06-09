# NavSphere 构建与部署指南

## 概述

NavSphere 是基于 Next.js 15 的导航管理平台，采用**双仓库架构**（见 [ARCHITECTURE.md](ARCHITECTURE.md)）：
- 代码仓库：`fanguohao/NavSphere`
- 数据仓库：`fanguohao/navsphere-data`（以 Git Submodule 挂载在 `src/navsphere/content/`）

数据存储在 GitHub 仓库的 JSON 文件中（无数据库）。支持三种部署方式：

| 部署方式 | 适用场景 | 域名示例 |
|---------|---------|---------|
| Cloudflare Workers | 生产环境（推荐） | `nav.example.com` |
| Docker | 自托管服务器 | 自定义 |
| Vercel | 快速测试 | `xxx.vercel.app` |

## 环境要求

- Node.js >= 20.0.0
- pnpm（推荐）或 npm
- Wrangler CLI（Cloudflare 部署需要）
- Docker & Docker Compose（Docker 部署需要）

```bash
# 安装 wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login
```

## 本地开发

### 1. 克隆并安装依赖

```bash
git clone --recurse-submodules https://github.com/fanguohao/NavSphere.git
cd NavSphere
pnpm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入以下变量：

```env
# GitHub OAuth App 配置
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# GitHub 仓库配置（数据存储仓库）
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name
GITHUB_BRANCH=main

# GitHub Fine-grained PAT（用于匿名投稿创建 Issue）
GITHUB_PAT=your-github-personal-access-token

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-random-auth-secret
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000

## 构建命令

⚠️ **重要：两种构建方式的区别**

| 命令 | 用途 | 输出目录 |
|------|------|---------|
| `pnpm build` | 标准 Next.js 构建 | `.next/` |
| `opennextjs-cloudflare build` | Workers 部署构建 | `.open-next/` |

**仅运行 `pnpm build` 无法部署到 Cloudflare Workers！** 必须使用 OpenNext 构建。

## Cloudflare Workers 部署

### 完整部署流程

```bash
# 1. 清除旧构建产物（避免缓存问题）
rm -rf .next .open-next

# 2. Next.js 构建
pnpm build

# 3. OpenNext Cloudflare 构建（生成 Workers 兼容格式）
npx opennextjs-cloudflare build

# 4. 部署到 Workers
npx wrangler deploy
```

### 一键部署（使用 npm script）

```bash
pnpm deploy
```

### 设置环境变量（Workers）

```bash
# 交互式设置 Secret
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put GITHUB_PAT
wrangler secret put AUTH_SECRET
wrangler secret put ADMIN_USER
wrangler secret put GITHUB_OWNER
wrangler secret put GITHUB_REPO

# 或使用 .dev.vars 文件（本地开发）
# Workers 环境变量在 Cloudflare Dashboard 设置
```

### 绑定自定义域名

1. 登录 Cloudflare Dashboard
2. 进入 Workers 服务页面
3. 点击 "Settings" → "Triggers" → "Custom Domains"
4. 添加自定义域名（如 `nav.323131.xyz`）

### wrangler.jsonc 配置说明

```jsonc
{
  "main": ".open-next/worker.js",           // OpenNext 生成的 Worker 入口
  "name": "navsphere",                       // Worker 名称
  "account_id": "your-cloudflare-account-id",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",        // 静态资源目录
    "binding": "ASSETS"
  }
}
```

## Docker 部署

### 快速启动

```bash
# 开发环境（端口 3000）
docker-compose -f docker/docker-compose.yml up -d

# 生产环境（端口 80）
docker-compose -f docker/docker-compose.prod.yml up -d
```

### 手动构建

```bash
# 构建镜像
docker build -f docker/Dockerfile -t navsphere:latest .

# 运行容器
docker run -d \
  --name navsphere \
  -p 3000:3000 \
  --env-file .env.local \
  navsphere:latest
```

### Docker 管理命令

```bash
# 查看状态
docker-compose -f docker/docker-compose.yml ps

# 查看日志
docker-compose -f docker/docker-compose.yml logs -f

# 停止服务
docker-compose -f docker/docker-compose.yml down

# 重启服务
docker-compose -f docker/docker-compose.yml restart
```

## 环境变量参考

| 变量名 | 必填 | 说明 |
|-------|------|------|
| `GITHUB_CLIENT_ID` | ✅ | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | ✅ | GitHub OAuth App Client Secret |
| `GITHUB_OWNER` | ✅ | 数据仓库拥有者（用户名或组织名） |
| `GITHUB_REPO` | ✅ | 数据仓库名称 |
| `GITHUB_BRANCH` | ✅ | 数据分支（默认 `main`） |
| `GITHUB_PAT` | ✅ | GitHub Personal Access Token（`repo` 权限） |
| `AUTH_SECRET` | ✅ | NextAuth 加密密钥（`openssl rand -base64 32` 生成） |
| `NEXTAUTH_URL` | ✅ | 应用 URL（本地: `http://localhost:3000`，生产: `https://nav.example.com`） |
| `AUTH_TRUST_HOST` | ✅ | 设为 `true`（解决 UntrustedHost 错误） |
| `ADMIN_USER` | ⬜ | 管理员 GitHub 用户名（默认 `fanguohao`） |
| `NEXT_PUBLIC_API_URL` | ⬜ | 公开 API URL |
| `GA_ID` | ⬜ | Google Analytics ID |

### GitHub OAuth App 配置

在 https://github.com/settings/applications 创建 OAuth App：

```
Application name: NavSphere
Homepage URL: https://nav.323131.xyz
Authorization callback URL: https://nav.323131.xyz/api/auth/callback/github
```

### GitHub PAT 权限

创建 Fine-grained Personal Access Token，需要以下权限：
- **Repository permissions**: `Contents` (Read/Write), `Issues` (Read/Write)

## 数据架构

### 数据流

```
浏览器 → Next.js API 路由 → GitHub Contents API → JSON 文件
```

### 数据仓库结构

数据存储在独立的 GitHub 仓库中（如 `fanguohao/navsphere-data`）：

```
src/navsphere/content/
├── navigation.json          # 导航分类数据
├── navigation-default.json  # 默认导航数据
├── site.json               # 站点配置
├── videos.json             # 视频数据
└── resource-metadata.json  # 资源元数据
```

### API 路由

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/navigation` | GET/POST | 获取/创建导航项 |
| `/api/navigation/[id]` | GET/PUT/DELETE | 单个导航项 CRUD |
| `/api/navigation/reorder` | POST | 重新排序导航项 |
| `/api/navigation/[id]/categories` | GET/POST | 分类管理 |
| `/api/navigation/[id]/items` | GET/POST | 站点管理 |
| `/api/submissions` | GET/POST | 投稿管理 |
| `/api/auth/[...nextauth]` | * | NextAuth 认证 |

## 已知问题与修复

### 1. 构建缓存导致旧代码未更新

**症状**：修改源码后部署，线上仍执行旧代码

**原因**：Next.js 使用内容哈希生成 chunk 文件名，如果 hash 不变，旧 chunk 仍被缓存

**解决**：每次部署前清除构建目录

```bash
rm -rf .next .open-next
pnpm build
npx opennextjs-cloudflare build
npx wrangler deploy
```

### 2. 前端调用不存在的 API（上游 Bug）

**症状**：点击"置顶"/"置底"按钮返回 404

**原因**：上游 NavSphere 前端调用 `/api/navigation/[id]/move-to-top` 和 `/api/navigation/[id]/move-to-bottom`，但后端未实现这两个路由

**修复**：已改为使用已有的 `/api/navigation/reorder` 接口

相关文件：`src/app/admin/navigation/page.tsx`

### 3. UntrustedHost 错误

**症状**：登录时返回 `AUTH_TRUST_HOST` 错误

**解决**：设置环境变量 `AUTH_TRUST_HOST=true`

### 4. GitHub API User-Agent 错误

**症状**：API 请求返回 400 或 403

**原因**：Cloudflare Workers 的 `fetch` 不自动发送 User-Agent 头，GitHub API 要求此头

**解决**：所有 GitHub API 请求添加 `User-Agent: NavSphere-App` 头

## 故障排除

### 构建失败

```bash
# 清除所有缓存
rm -rf .next .open-next node_modules
pnpm install
pnpm build
npx opennextjs-cloudflare build
```

### Workers 部署失败

```bash
# 检查登录状态
wrangler whoami

# 检查 account_id
wrangler account id

# 查看详细日志
DEBUG=* wrangler deploy
```

### 数据加载失败

1. 检查 `GITHUB_PAT` 是否有效
2. 检查仓库名称和拥有者是否正确
3. 检查数据文件是否存在（首次需手动创建或初始化）
4. 查看 Workers 日志：`wrangler tail`

## 相关文件

| 文件 | 说明 |
|------|------|
| `wrangler.jsonc` | Cloudflare Workers 配置 |
| `next.config.mjs` | Next.js 配置（含 OpenNext 初始化） |
| `open-next.config.ts` | OpenNext Cloudflare 配置 |
| `src/lib/auth.ts` | NextAuth 配置 |
| `src/lib/github.ts` | GitHub API 封装 |
| `src/middleware.ts` | 路由中间件（管理员权限控制） |
| `docker/Dockerfile` | Docker 构建配置 |
| `docker/docker-compose.yml` | Docker Compose 开发环境 |
| `docker/docker-compose.prod.yml` | Docker Compose 生产环境 |
