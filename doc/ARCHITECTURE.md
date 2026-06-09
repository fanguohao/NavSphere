# NavSphere 项目架构

## 双仓库架构

NavSphere 由两个 Git 仓库组成：

| 仓库 | 用途 | 位置 |
|------|------|------|
| **NavSphere** | 应用代码（Next.js） | `git@github.com:fanguohao/NavSphere.git` |
| **navsphere-data** | 导航数据（JSON） | `git@github.com:fanguohao/navsphere-data.git` |

数据仓库以 **Git Submodule** 方式挂载在代码仓库的 `src/navsphere/content/` 目录下。

## 数据流向

```
管理员后台 (/admin/*)
    │
    ├── GET: 读取数据仓库实时数据
    └── POST/PUT/DELETE: 写入数据仓库

首页 (/)
    │
    └── GET: 读取数据仓库实时数据
```

所有导航数据存储在 navsphere-data 仓库的 `src/navsphere/content/` 中，包含：

- `navigation.json` - 导航站点数据
- `navigation-default.json` - 默认导航数据
- `site.json` - 站点配置
- `videos.json` - 视频数据
- `resource-metadata.json` - 资源元数据

## 管理方式

### 通过管理员后台（推荐日常使用）

直接访问 `/admin/` 页面，操作会实时写入 navsphere-data 仓库。

### 通过 Git（批量操作时使用）

```bash
# 克隆代码仓库（包含子模块）
git clone git@github.com:fanguohao/NavSphere.git
cd NavSphere
git submodule init
git submodule update

# 进入数据子模块
cd src/navsphere/content
# 修改数据文件...
git add .
git commit -m "update navigation data"
git push

# 回到代码仓库更新子模块引用
cd ../..
git add src/navsphere/content
git commit -m "chore: update data submodule"
git push
```

## 后期部署

数据提交到 navsphere-data 后，首页实时生效，无需重新部署。

代码提交到 NavSphere 后，需要重新构建部署到 Cloudflare Workers：

```bash
pnpm run deploy
```

## 注意事项

- 不要直接在 `src/navsphere/content/` 中修改而不通过子模块提交
- 如果需要在本地同时修改代码和数据，先提交数据，再提交代码中的子模块引用
- `git status` 中看到 `src/navsphere/content` 被修改，表示子模块指针需要更新
