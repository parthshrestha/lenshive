# LensHive — AWS RDS MySQL Setup

Lean prototype: **single-AZ `db.t4g.micro` MySQL 8.0** in us-east-1. Estimated cost
**~$14/mo** (or **$0/mo** for the first 12 months on a new AWS account, free-tier
eligible).

## 1. Create the DB instance (AWS Console)

RDS → Databases → **Create database**.

| Field | Value |
|---|---|
| Creation method | Standard create |
| Engine | **MySQL** |
| Version | 8.0.x (latest minor) |
| Templates | **Free tier** (if new account) — otherwise Dev/Test |
| DB instance identifier | `lenshive-db` |
| Master username | `lenshive` |
| Master password | *(generate, save to a password manager — you'll paste it into `.env`)* |
| DB instance class | **db.t4g.micro** |
| Storage type | gp3 |
| Allocated storage | **20 GiB** |
| Storage autoscaling | Off (keeps cost predictable) |
| Multi-AZ | **No** (lean) |
| VPC | default VPC is fine |
| Public access | **Yes** (so your laptop can reach it during dev — lock down via SG) |
| VPC security group | Create new → name `lenshive-db-sg` |
| Initial database name | **`lenshive`** |
| Backup retention | 7 days (default) |
| Encryption | Yes (default KMS key) |
| Enhanced monitoring | **Off** (extra cost) |
| Performance Insights | **Off** (extra cost on micro) |
| Auto minor version upgrade | On |
| Deletion protection | On |

Hit **Create database**. Provisioning takes ~5 min.

## 2. Open the security group to your IP

EC2 → Security Groups → `lenshive-db-sg` → **Inbound rules** → Edit:

- Type: **MySQL/Aurora (3306)**
- Source: **My IP** (and optionally a second rule for your office IP)

Don't open 3306 to `0.0.0.0/0` — that's how leaked DBs end up on Shodan.

## 3. Grab the connection string

RDS → Databases → `lenshive-db` → **Connectivity & security** tab → copy the **Endpoint**.

It looks like `lenshive-db.xxxxxxx.us-east-1.rds.amazonaws.com`. Put it in `backend/.env`:

```
DATABASE_URL=mysql+aiomysql://lenshive:YOUR_PASSWORD_HERE@lenshive-db.xxxxxxx.us-east-1.rds.amazonaws.com:3306/lenshive
```

`backend/.env` is gitignored — never commit it.

## 4. Run migrations + seed (from `backend/`)

```bash
./venv/bin/pip install -r requirements.txt
./venv/bin/alembic upgrade head
./venv/bin/python -m scripts.seed
```

You should see `Seeded 7 spots and 8 photographers.`

## 5. Verify

```bash
curl http://localhost:8000/api/photographers | head -c 200
```

Should return the photographer list as JSON.

---

## Cost guardrails

- **db.t4g.micro Single-AZ** in us-east-1: **$0.016/hr** ≈ $11.68/mo (free for 750 hrs/mo year one)
- **gp3 20 GiB**: ~$2.30/mo
- **Backups** (up to allocated): free up to 100% of allocated storage
- **Egress**: ~$0.09/GB — keep the FastAPI app in the same region to avoid this

Things that quietly multiply the bill if you flip them on later:
- Multi-AZ (2× compute + storage)
- Performance Insights (extra GB-month on micro)
- Enhanced Monitoring (~$2-5/mo)
- gp3 IOPS/throughput above the free baseline

## Tearing it down

When you're done iterating:

```
RDS → Databases → lenshive-db → Actions → Delete
  → uncheck "Create final snapshot"  (or keep it for $0.10/GB-mo)
  → uncheck "Retain automated backups"
  → confirm
```

Also delete the `lenshive-db-sg` security group afterwards.
