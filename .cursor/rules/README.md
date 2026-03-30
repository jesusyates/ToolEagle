# Cursor rules
- **`00-memory-read-policy.mdc`** — `alwaysApply: true`；**本会话首次**实质性回复前 **Read `docs/MEMORY.md` 一次**；**不**每条消息重复 Read（省 token）；触发再读条件时再 Read。详见文件内说明。
记忆本正文只在 **`docs/MEMORY.md`** 维护，不要在本目录重复写一份长规则。
**系统级能力**：**Content Safety Engine（全平台合规）** 已写入记忆本 **「二点五」**；新增 AI 用户输出路径须默认接入，不得绕过。
