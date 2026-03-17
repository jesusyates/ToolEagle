# zh:auto Schedule (V63.1)

Run **2 times per day** for maximum keyword expansion:

- **02:00 UTC**
- **14:00 UTC**

## Setup

### Windows Task Scheduler
Create two tasks that run `scripts\run-zh-auto.bat` at:
- 02:00 UTC
- 14:00 UTC

### Linux / macOS cron
```cron
0 2,14 * * * cd /path/to/tooleagle && npm run zh:auto
```

### GitHub Actions
Add a workflow with schedule:
```yaml
schedule:
  - cron: '0 2 * * *'   # 02:00 UTC
  - cron: '0 14 * * *'  # 14:00 UTC
```
