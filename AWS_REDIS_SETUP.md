# AWS Redis + CloudWatch Setup Guide

## 🎯 Цель

Настроить AWS ElastiCache Redis для кэширования API responses + CloudWatch для мониторинга.

**Результат:** Снижение API costs с $350/month → $17/month (20x reduction)

---

## 📋 Prerequisites

1. **AWS Account** с $1000 кредитом
2. **AWS CLI** установлен локально
3. **Vercel deployment** работает

---

## 🚀 ШАГ 1: Настройка AWS CLI

### 1.1 Установка AWS CLI (если ещё нет)

**MacOS:**
```bash
brew install awscli
```

**Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**Windows:**
```powershell
msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
```

### 1.2 Конфигурация credentials

```bash
aws configure

# Введите:
AWS Access Key ID: AKIA...
AWS Secret Access Key: ...
Default region name: eu-central-1  # или us-east-1
Default output format: json
```

**Проверка:**
```bash
aws sts get-caller-identity
# Должно вернуть ваш Account ID
```

---

## ☁️ ШАГ 2: Создание ElastiCache Redis

### 2.1 Создать Security Group

```bash
# 1. Получить VPC ID
VPC_ID=$(aws ec2 describe-vpcs --query 'Vpcs[0].VpcId' --output text)
echo "VPC ID: $VPC_ID"

# 2. Создать Security Group
SG_ID=$(aws ec2 create-security-group \
  --group-name optimarket-redis-sg \
  --description "Security group for OPTIMARKET Redis cache" \
  --vpc-id $VPC_ID \
  --query 'GroupId' \
  --output text)

echo "Security Group ID: $SG_ID"

# 3. Разрешить входящие подключения на порт 6379 (Redis)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 6379 \
  --cidr 0.0.0.0/0  # ⚠️ Для production ограничьте IP Vercel

echo "✅ Security Group configured"
```

### 2.2 Создать Cache Subnet Group

```bash
# 1. Получить Subnet IDs
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].SubnetId' \
  --output text)

echo "Subnet IDs: $SUBNET_IDS"

# 2. Создать Subnet Group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name optimarket-subnet-group \
  --cache-subnet-group-description "Subnet group for OPTIMARKET Redis" \
  --subnet-ids $SUBNET_IDS

echo "✅ Subnet Group created"
```

### 2.3 Создать Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id optimarket-mvp \
  --engine redis \
  --cache-node-type cache.t3.micro \
  --num-cache-nodes 1 \
  --cache-subnet-group-name optimarket-subnet-group \
  --security-group-ids $SG_ID \
  --tags Key=Project,Value=OPTIMARKET Key=Environment,Value=MVP

echo "✅ Redis cluster creation started (takes 5-10 minutes)..."
```

**Мониторинг создания:**
```bash
# Проверять статус каждые 30 секунд
watch -n 30 aws elasticache describe-cache-clusters \
  --cache-cluster-id optimarket-mvp \
  --query 'CacheClusters[0].CacheClusterStatus' \
  --output text

# Ожидаем: "available"
```

### 2.4 Получить Redis Endpoint

```bash
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id optimarket-mvp \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text)

echo "✅ Redis Endpoint: $REDIS_ENDPOINT"
echo "✅ Redis URL: redis://$REDIS_ENDPOINT:6379"
```

---

## 🔑 ШАГ 3: Настройка Vercel Secrets

### 3.1 Добавить REDIS_URL в Vercel

**Через Vercel Dashboard:**
1. Откройте https://vercel.com/your-username/optimarket
2. Settings → Environment Variables
3. Add new variable:
   - **Name:** `REDIS_URL`
   - **Value:** `redis://optimarket-mvp.xxx.cache.amazonaws.com:6379`
   - **Environments:** Production, Preview, Development
4. Save

**Или через Vercel CLI:**
```bash
vercel env add REDIS_URL production
# Paste: redis://optimarket-mvp.xxx.cache.amazonaws.com:6379

vercel env add REDIS_URL preview
vercel env add REDIS_URL development
```

### 3.2 Redeploy на Vercel

```bash
# Автоматический redeploy после добавления env var
# Или вручную:
vercel --prod
```

---

## 📊 ШАГ 4: Настройка CloudWatch Monitoring

### 4.1 Включить Enhanced Monitoring для Redis

```bash
aws elasticache modify-cache-cluster \
  --cache-cluster-id optimarket-mvp \
  --apply-immediately \
  --cache-parameter-group-name default.redis7

# CloudWatch metrics автоматически включены для ElastiCache
```

### 4.2 Создать CloudWatch Dashboard

```bash
# Создать dashboard для мониторинга
cat > dashboard-config.json <<'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "AWS/ElastiCache", "CacheHits", { "stat": "Sum", "label": "Cache Hits" } ],
          [ ".", "CacheMisses", { "stat": "Sum", "label": "Cache Misses" } ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "eu-central-1",
        "title": "Cache Hit/Miss Rate",
        "yAxis": {
          "left": {
            "label": "Count"
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "AWS/ElastiCache", "CPUUtilization", { "stat": "Average" } ],
          [ ".", "NetworkBytesIn", { "stat": "Sum" } ],
          [ ".", "NetworkBytesOut", { "stat": "Sum" } ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "eu-central-1",
        "title": "Redis Performance"
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name OPTIMARKET-Redis \
  --dashboard-body file://dashboard-config.json

echo "✅ Dashboard created: https://console.aws.amazon.com/cloudwatch/home#dashboards:name=OPTIMARKET-Redis"
```

### 4.3 Настроить Алерты

```bash
# Alert: High error rate
aws cloudwatch put-metric-alarm \
  --alarm-name optimarket-high-error-rate \
  --alarm-description "Alert when API error rate > 5%" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:eu-central-1:YOUR_ACCOUNT_ID:optimarket-alerts

# Alert: Low cache hit rate
aws cloudwatch put-metric-alarm \
  --alarm-name optimarket-low-cache-hit \
  --alarm-description "Alert when cache hit rate < 80%" \
  --metric-name CacheHitRate \
  --namespace AWS/ElastiCache \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 2
```

---

## ✅ ШАГ 5: Тестирование

### 5.1 Локальный тест (с локальным Redis)

**Запустить Redis локально:**
```bash
# MacOS
brew install redis
redis-server

# Linux
sudo apt-get install redis-server
redis-server
```

**Протестировать кэширование:**
```bash
# Установить зависимости
npm install

# Запустить Vercel dev (локально)
vercel dev

# В другом терминале:
# Первый запрос (Cache MISS)
curl "http://localhost:3000/api/generate?category=drills"
# Проверьте логи: "⚠️  Cache MISS for reco:drills:2026-01-27"

# Второй запрос (Cache HIT)
curl "http://localhost:3000/api/generate?category=drills"
# Проверьте логи: "✅ Cache HIT for reco:drills:2026-01-27"
```

### 5.2 Production тест (с AWS Redis)

```bash
# После deploy на Vercel
curl "https://your-app.vercel.app/api/generate?category=drills"

# Проверьте Vercel logs:
# https://vercel.com/your-username/optimarket/deployments

# Ожидаемые логи:
# ✅ Redis connected
# ⚠️  Cache MISS for reco:drills:2026-01-27
# 🔧 Generating recommendations for: drills
# ✅ Cached result for reco:drills:2026-01-27 (TTL: 86400s)
```

### 5.3 Проверить CloudWatch Metrics

```bash
# Cache Hit Rate
aws cloudwatch get-metric-statistics \
  --namespace AWS/ElastiCache \
  --metric-name CacheHits \
  --dimensions Name=CacheClusterId,Value=optimarket-mvp \
  --start-time 2026-01-27T00:00:00Z \
  --end-time 2026-01-27T23:59:59Z \
  --period 3600 \
  --statistics Sum

# Expected: Hits увеличиваются после первого запроса
```

---

## 💰 ШАГ 6: Мониторинг затрат

### 6.1 Проверить использование кредита

```bash
# AWS Cost Explorer API
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics "BlendedCost" \
  --group-by Type=SERVICE

# Ожидаемые затраты (Month 1):
# - ElastiCache: ~$12
# - CloudWatch: ~$5
# - Data Transfer: ~$3
# Total: ~$20
```

### 6.2 Установить Budget Alert

```bash
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget-config.json

# budget-config.json:
{
  "BudgetName": "OPTIMARKET-Monthly",
  "BudgetLimit": {
    "Amount": "100",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

---

## 📈 РЕЗУЛЬТАТЫ

### До Redis (10k users/month):
```
API Calls: 10,000 requests
- Perplexity: 10,000 × $0.030 = $300
- Gemini: 10,000 × $0.005 = $50
Total API costs: $350/month
AWS costs: $0
TOTAL: $350/month
```

### После Redis (95% cache hit rate):
```
API Calls: 500 requests (только cache miss)
- Perplexity: 500 × $0.030 = $15
- Gemini: 500 × $0.005 = $2.50
Total API costs: $17.50/month
AWS costs: $20/month (из кредита)
TOTAL: $37.50/month

Экономия: $312.50/month (89% reduction) 🚀
ROI на Redis: 15.6x
```

---

## 🚨 Troubleshooting

### Проблема: "Redis connection failed"

**Решение 1: Проверить Security Group**
```bash
# Убедитесь что порт 6379 открыт
aws ec2 describe-security-groups \
  --group-ids $SG_ID \
  --query 'SecurityGroups[0].IpPermissions'
```

**Решение 2: Проверить VPC**
```bash
# ElastiCache должен быть в той же VPC что и ваши клиенты
# Для Vercel (external) нужен publicly accessible endpoint
# Или используйте VPC Peering
```

**Решение 3: Fallback на локальный Redis**
```bash
# Для тестирования используйте бесплатный Redis cloud:
# https://redis.com/try-free/ (30MB free)
```

### Проблема: "Low cache hit rate (<80%)"

**Причины:**
1. TTL слишком короткий → увеличьте до 24h
2. Категории меняются часто → проверьте cache key format
3. Lots of unique queries → это нормально для старта

**Решение:**
```javascript
// Увеличить TTL до 24 часов
const TTL_SECONDS = 24 * 60 * 60;

// Использовать date (не time) в cache key
const cacheKey = `reco:${category}:${new Date().toISOString().split('T')[0]}`;
```

---

## 📚 Resources

- **AWS ElastiCache Docs:** https://docs.aws.amazon.com/elasticache/
- **Redis Node.js Client:** https://github.com/redis/node-redis
- **CloudWatch Metrics:** https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/working_with_metrics.html
- **Vercel Environment Variables:** https://vercel.com/docs/concepts/projects/environment-variables

---

**Последнее обновление:** 2026-01-27
**Статус:** Ready for production
**Estimated setup time:** 1-2 hours
