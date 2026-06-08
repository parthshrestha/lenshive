"""Seed 50 filler photographers (25 Denver, 25 Dallas) as role=robot users.

Usage:
    cd backend && ./venv/bin/python -m scripts.seed_fillers

Idempotent: removes all role=robot photographers + users first, then re-inserts.
"""
from __future__ import annotations

import asyncio
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from sqlalchemy import delete, select

load_dotenv()

from app import models  # noqa: E402
from app.db import SessionLocal, engine  # noqa: E402

random.seed(42)  # deterministic output across runs

# Both metros, centered on the city + lat/lng jitter radius in degrees (~10mi)
METROS = [
    {"city": "Denver, CO",  "lat": 39.7392, "lng": -104.9903, "jitter": 0.18,
     "service_area": "Denver metro",
     "spots": ["union-station", "rino", "red-rocks", "botanic"]},
    {"city": "Dallas, TX",  "lat": 32.7767, "lng":  -96.7970, "jitter": 0.22,
     "service_area": "DFW metroplex",
     "spots": []},  # no Dallas spots in DB yet; that's fine
]

FIRST_NAMES = ["Aiden", "Bea", "Cole", "Dani", "Eli", "Fern", "Gus", "Hana",
               "Iris", "Jules", "Kai", "Lena", "Mara", "Niko", "Ola", "Piper",
               "Quinn", "Remy", "Sage", "Theo", "Una", "Vera", "Wes", "Xan",
               "Yara", "Zach"]
LAST_NAMES = ["Brooks", "Carter", "Diaz", "Ellis", "Flores", "Gray", "Hayes",
              "Imani", "Jensen", "Khan", "Lopez", "Morales", "Nguyen", "Ortiz",
              "Park", "Quintero", "Reyes", "Singh", "Tanaka", "Underwood", "Vega",
              "Walsh", "Xiong", "Young", "Zhao"]
STUDIO_SUFFIXES = ["Studio", "Photo Co.", "Imagery", "Visuals", "Media",
                   "Frames", "Light", "& Co.", "Collective", "Atelier"]

ALL_SERVICES = ["Graduation", "Wedding", "Engagement", "Family", "Couples",
                "Maternity", "Newborn", "Headshots", "LinkedIn", "Brand",
                "Product", "Events", "Automotive", "Portraits", "Elopements"]
ALL_STYLES = ["Cinematic", "Bright & Airy", "Moody", "Editorial", "Documentary",
              "True-to-color", "Film-inspired", "Natural", "Flash", "Luxury"]
ALL_TRUST = ["Verified", "Fast responder", "Top rated", "Insured"]
RESPONSE = ["1 hour", "2 hours", "3 hours", "4 hours", "6 hours", "Same day"]

UNSPLASH_AVATARS = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
    "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&q=80",
    "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80",
    "https://images.unsplash.com/photo-1554384645-13eab165c24b?w=200&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&q=80",
]
UNSPLASH_COVERS = [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=80",
    "https://images.unsplash.com/photo-1554080353-a576cf803bda?w=1200&q=80",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
    "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=80",
    "https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80",
    "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=1200&q=80",
    "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80",
    "https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80",
    "https://images.unsplash.com/photo-1465495976277-4387d4b0e4a6?w=1200&q=80",
]


def initials(name: str) -> str:
    parts = [p for p in name.split() if p[:1].isalpha()]
    return "".join(p[0] for p in parts[:2]).upper() or "??"


def make_one(idx: int, metro: dict) -> dict:
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    studio = random.choice([
        f"{first} {last}",
        f"{first} {last} {random.choice(STUDIO_SUFFIXES)}",
        f"{last} {random.choice(STUDIO_SUFFIXES)}",
    ])
    slug = f"filler-{idx:03d}-{last.lower()}"
    lat = metro["lat"] + random.uniform(-metro["jitter"], metro["jitter"])
    lng = metro["lng"] + random.uniform(-metro["jitter"], metro["jitter"])
    return {
        "slug": slug,
        "email": f"{slug}@filler.lenshive.test",
        "name": studio,
        "initials": initials(studio),
        "avatar": random.choice(UNSPLASH_AVATARS),
        "cover": random.choice(UNSPLASH_COVERS),
        "location": metro["city"],
        "serviceArea": metro["service_area"],
        "rating": round(random.uniform(4.3, 5.0), 1),
        "reviewCount": random.randint(3, 80),
        "startingPrice": random.choice([175, 200, 225, 250, 275, 300, 350, 400, 500, 650, 800]),
        "services": random.sample(ALL_SERVICES, k=random.randint(2, 5)),
        "styles": random.sample(ALL_STYLES, k=random.randint(2, 3)),
        "trustSignals": random.sample(ALL_TRUST, k=random.randint(1, 3)),
        "responseTime": random.choice(RESPONSE),
        "memberSince": random.randint(2018, 2025),
        "bookings": random.randint(5, 150),
        "bio": f"{studio} — {metro['city']} based, {random.choice(['part-time', 'full-time', 'weekend'])} photographer for {random.choice(['portraits', 'events', 'couples', 'family sessions'])}.",
        "spots": random.sample(metro["spots"], k=min(len(metro["spots"]), random.randint(0, 3))),
        "lat": lat,
        "lng": lng,
    }


async def upsert_filler(db, data: dict, spot_id_by_slug: dict[str, int]) -> None:
    # 1) ensure the backing User record exists
    user = (await db.scalars(select(models.User).where(models.User.email == data["email"]))).first()
    if user is None:
        user = models.User(
            email=data["email"],
            username=data["slug"],
            cognito_sub=None,  # robots have no Cognito identity
            name=data["name"],
            role=models.UserRole.robot,
        )
        db.add(user)
        await db.flush()
    else:
        user.role = models.UserRole.robot
        user.username = data["slug"]
        user.name = data["name"]

    # 2) upsert the Photographer record
    p = (await db.scalars(select(models.Photographer).where(models.Photographer.slug == data["slug"]))).first()
    if p is None:
        p = models.Photographer(slug=data["slug"])
        db.add(p)
    p.user_id = user.id
    p.name = data["name"]
    p.initials = data["initials"]
    p.avatar_url = data["avatar"]
    p.cover_url = data["cover"]
    p.location = data["location"]
    p.service_area = data["serviceArea"]
    p.rating = data["rating"]
    p.review_count = data["reviewCount"]
    p.starting_price = data["startingPrice"]
    p.bio = data["bio"]
    p.response_time = data["responseTime"]
    p.member_since = data["memberSince"]
    p.bookings_count = data["bookings"]
    p.lat = data["lat"]
    p.lng = data["lng"]
    await db.flush()

    await db.execute(delete(models.PhotographerService).where(models.PhotographerService.photographer_id == p.id))
    await db.execute(delete(models.PhotographerStyle).where(models.PhotographerStyle.photographer_id == p.id))
    await db.execute(delete(models.PhotographerTrustSignal).where(models.PhotographerTrustSignal.photographer_id == p.id))
    await db.execute(delete(models.PhotographerSpot).where(models.PhotographerSpot.photographer_id == p.id))

    for s in data["services"]:
        db.add(models.PhotographerService(photographer_id=p.id, service=s))
    for s in data["styles"]:
        db.add(models.PhotographerStyle(photographer_id=p.id, style=s))
    for t in data["trustSignals"]:
        db.add(models.PhotographerTrustSignal(photographer_id=p.id, signal=t))
    for slug in data["spots"]:
        spot_id = spot_id_by_slug.get(slug)
        if spot_id:
            db.add(models.PhotographerSpot(photographer_id=p.id, spot_id=spot_id))


async def main() -> None:
    if SessionLocal is None:
        print("DATABASE_URL not set", file=sys.stderr)
        sys.exit(1)
    async with SessionLocal() as db:
        # spot id lookup (we'll only link to spots that exist)
        spots = (await db.scalars(select(models.Spot))).all()
        spot_id_by_slug = {s.slug: s.id for s in spots}

        records = []
        for i in range(25):
            records.append(make_one(i, METROS[0]))           # Denver
        for i in range(25, 50):
            records.append(make_one(i, METROS[1]))           # Dallas

        for r in records:
            await upsert_filler(db, r, spot_id_by_slug)
        await db.commit()

    await engine.dispose()
    denver = sum(1 for r in records if r["location"] == "Denver, CO")
    dallas = sum(1 for r in records if r["location"] == "Dallas, TX")
    print(f"Seeded {denver} Denver + {dallas} Dallas filler photographers (role=robot).")


if __name__ == "__main__":
    asyncio.run(main())
