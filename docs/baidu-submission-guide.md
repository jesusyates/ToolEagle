# 百度站长平台站点提交指南

## 1. 添加站点

1. 访问 [百度站长平台](https://ziyuan.baidu.com/)
2. 登录/注册百度账号
3. 点击「用户中心」→「站点管理」→「添加网站」
4. 输入站点 URL（如 https://www.tooleagle.com）

## 2. 验证站点

选择「HTML 标签验证」方式：

1. 复制百度提供的 meta 标签中的 `content` 值
2. 在 Vercel 环境变量中设置：
   ```
   BAIDU_SITE_VERIFICATION=你复制的code值
   ```
3. 重新部署后，在百度站长平台点击「完成验证」

## 3. 提交 Sitemap

1. 验证通过后，进入「普通收录」→「sitemap」
2. 提交以下 sitemap 地址：
   - https://www.tooleagle.com/sitemap.xml
   - https://www.tooleagle.com/sitemap-zh.xml
   - https://www.tooleagle.com/baidu-sitemap.xml

## 4. API 主动推送（可选）

用于加速新页面收录：

1. 在「普通收录」→「API 提交」中获取 token
2. 设置环境变量：`BAIDU_TOKEN=你的token`
3. 运行：`npm run baidu:submit`

该脚本会将 sitemap URL 推送给百度。

## 5. robots.txt

站点已配置 `robots.txt`，允许 Baiduspider 抓取，并包含 sitemap 地址。
