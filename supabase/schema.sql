-- ============================================================
-- 宁夏理工学院新媒体中心 · 协作系统 Supabase 建表脚本
-- 在 Supabase SQL Editor 中一次性执行即可
-- ============================================================

-- 成员表
CREATE TABLE IF NOT EXISTS nxmc_members (
  id text PRIMARY KEY,
  name text,
  phone text,
  role text,
  department text,
  college text,
  major text,
  "className" text,
  accent text,
  status text,
  "invitedById" text,
  "invitedByPhone" text,
  "invitedAt" text
);

-- 项目表
CREATE TABLE IF NOT EXISTS nxmc_projects (
  id text PRIMARY KEY,
  title text,
  channel text,
  format text,
  status text,
  "statusLabel" text,
  time text,
  owner text,
  department text,
  "dayOffset" numeric,
  accent text,
  summary text,
  location text,
  progress numeric
);

-- 任务表
CREATE TABLE IF NOT EXISTS nxmc_tasks (
  id text PRIMARY KEY,
  "projectId" text,
  title text,
  project text,
  "ownerId" text,
  owner text,
  department text,
  due text,
  priority text,
  progress numeric,
  done boolean,
  accent text,
  deliverable text
);

-- 日程事件表
CREATE TABLE IF NOT EXISTS nxmc_events (
  id text PRIMARY KEY,
  "projectId" text,
  title text,
  time text,
  "dayOffset" numeric,
  location text,
  owner text,
  type text,
  accent text
);

-- 资料资产表
CREATE TABLE IF NOT EXISTS nxmc_assets (
  id text PRIMARY KEY,
  "projectId" text,
  project text,
  name text,
  category text,
  size text,
  owner text,
  updated text,
  accent text,
  scope text,
  department text,
  "filePath" text,
  "fileUrl" text,
  "localOnly" boolean
);

-- 群消息表
CREATE TABLE IF NOT EXISTS nxmc_messages (
  id text PRIMARY KEY,
  "group" text,
  "senderId" text,
  sender text,
  content text,
  time text
);

-- 课表
CREATE TABLE IF NOT EXISTS nxmc_courses (
  id text PRIMARY KEY,
  day numeric,
  period text,
  name text,
  room text,
  teacher text,
  weeks text
);

-- ============================================================
-- 开启 Row Level Security（可选，建议开启）
-- 开启后需要配置策略，否则 anon key 无法读写
-- 如果只是内部小团队使用，可先不开启 RLS，直接用 anon key 读写
-- ============================================================

-- 如需开启 RLS，取消下面注释并执行：
-- ALTER TABLE nxmc_members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nxmc_projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nxmc_tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nxmc_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nxmc_assets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nxmc_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE nxmc_courses ENABLE ROW LEVEL SECURITY;

-- 配合 RLS 的策略示例（允许所有认证/匿名用户读写，内部使用）：
-- CREATE POLICY "allow all" ON nxmc_members FOR ALL USING (true) WITH CHECK (true);
-- ... 其余表同理
