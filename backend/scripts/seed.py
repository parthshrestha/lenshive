"""Seed the DB with mock photographers + spots.

Usage:
    cd backend && ./venv/bin/python -m scripts.seed

Idempotent: upserts by slug, refreshes child rows.
"""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

# Make `app` importable when run as `python -m scripts.seed` from backend/.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
from sqlalchemy import delete, select

load_dotenv()

from app import models  # noqa: E402
from app.db import SessionLocal  # noqa: E402


PHOTOGRAPHERS = [
    {"id": "shrestha-media", "name": "Shrestha Media", "initials": "SM",
     "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
     "cover": "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
     "location": "Boulder, CO", "serviceArea": "Denver metro & Boulder County",
     "rating": 4.9, "reviewCount": 28, "startingPrice": 250,
     "services": ["Graduation", "Portraits", "Events", "Automotive"],
     "styles": ["Cinematic", "True-to-color", "Editorial"],
     "trustSignals": ["Verified", "Fast responder"],
     "responseTime": "2 hours", "memberSince": 2022, "bookings": 28,
     "bio": "Hi I'm Suman, a Boulder-based photographer specializing in graduation, portraits, and events. I love capturing real moments and helping you remember this season of life. I focus on natural light, true-to-color editing, and making you feel comfortable in front of the camera.",
     "spots": ["chautauqua", "pearl-street", "lost-gulch"],
     "lat": 40.015, "lng": -105.279},
    {"id": "ember-oak", "name": "Ember & Oak Photography", "initials": "EO",
     "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
     "cover": "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=80",
     "location": "Boulder, CO", "serviceArea": "Front Range",
     "rating": 5.0, "reviewCount": 41, "startingPrice": 350,
     "services": ["Graduation", "Family", "Couples", "Engagement"],
     "styles": ["Bright & Airy", "Natural"],
     "trustSignals": ["Verified", "Top rated"],
     "responseTime": "1 hour", "memberSince": 2020, "bookings": 64,
     "bio": "Two-person team focused on bright, candid family and couples work.",
     "spots": ["chautauqua", "botanic"],
     "lat": 40.005, "lng": -105.260},
    {"id": "lightwell", "name": "Lightwell Studios", "initials": "LS",
     "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
     "cover": "https://images.unsplash.com/photo-1554080353-a576cf803bda?w=1200&q=80",
     "location": "Denver, CO", "serviceArea": "Denver metro",
     "rating": 4.8, "reviewCount": 17, "startingPrice": 200,
     "services": ["Headshots", "Portraits", "Graduation", "LinkedIn"],
     "styles": ["Editorial", "Moody"],
     "trustSignals": ["Verified"],
     "responseTime": "4 hours", "memberSince": 2023, "bookings": 19,
     "bio": "Studio + on-location headshots and editorial portraiture.",
     "spots": ["union-station", "rino"],
     "lat": 39.755, "lng": -104.999},
    {"id": "mountain-main", "name": "Mountain & Main Photo", "initials": "MM",
     "avatar": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80",
     "cover": "https://images.unsplash.com/photo-1554080353-a576cf803bda?w=1200&q=80",
     "location": "Boulder, CO", "serviceArea": "Boulder + travel statewide",
     "rating": 4.9, "reviewCount": 56, "startingPrice": 400,
     "services": ["Graduation", "Couples", "Elopements", "Family"],
     "styles": ["Cinematic", "Natural"],
     "trustSignals": ["Verified", "Insured"],
     "responseTime": "3 hours", "memberSince": 2019, "bookings": 102,
     "bio": "Mountain elopements and outdoor sessions across the Front Range.",
     "spots": ["chautauqua", "lost-gulch", "red-rocks"],
     "lat": 40.020, "lng": -105.295},
    {"id": "north-fold", "name": "North Fold Studio", "initials": "NF",
     "avatar": "https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&q=80",
     "cover": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80",
     "location": "Denver, CO", "serviceArea": "Denver + Boulder",
     "rating": 4.7, "reviewCount": 22, "startingPrice": 300,
     "services": ["Weddings", "Couples", "Events"],
     "styles": ["Documentary", "True-to-color"],
     "trustSignals": ["Verified", "Fast responder"],
     "responseTime": "1 hour", "memberSince": 2021, "bookings": 38,
     "bio": "Documentary wedding and event work, calm presence on the day.",
     "spots": ["pearl-street", "union-station"],
     "lat": 39.760, "lng": -105.005},
    {"id": "altitude-co", "name": "Altitude Co.", "initials": "AC",
     "avatar": "https://images.unsplash.com/photo-1521119989659-a83eee488004?w=200&q=80",
     "cover": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=80",
     "location": "Denver, CO", "serviceArea": "Statewide",
     "rating": 4.6, "reviewCount": 13, "startingPrice": 500,
     "services": ["Automotive", "Brand", "Product"],
     "styles": ["Cinematic", "Flash"],
     "trustSignals": ["Verified"],
     "responseTime": "6 hours", "memberSince": 2022, "bookings": 21,
     "bio": "Automotive and brand photography with cinematic lighting.",
     "spots": ["red-rocks", "rino"],
     "lat": 39.748, "lng": -104.984},
    {"id": "june-rowe", "name": "June Rowe", "initials": "JR",
     "avatar": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
     "cover": "https://images.unsplash.com/photo-1529636798458-92182e662485?w=1200&q=80",
     "location": "Longmont, CO", "serviceArea": "Boulder County",
     "rating": 4.9, "reviewCount": 31, "startingPrice": 275,
     "services": ["Family", "Newborn", "Maternity"],
     "styles": ["Bright & Airy", "Film-inspired"],
     "trustSignals": ["Verified", "Top rated"],
     "responseTime": "2 hours", "memberSince": 2020, "bookings": 54,
     "bio": "Newborn, maternity, and family sessions with a film-inspired look.",
     "spots": ["chautauqua", "botanic"],
     "lat": 40.167, "lng": -105.101},
    {"id": "saltgrass", "name": "Saltgrass Photo Co.", "initials": "SP",
     "avatar": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&q=80",
     "cover": "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=1200&q=80",
     "location": "Boulder, CO", "serviceArea": "Boulder + Denver",
     "rating": 4.8, "reviewCount": 19, "startingPrice": 225,
     "services": ["Graduation", "Engagement", "Portraits"],
     "styles": ["Moody", "Film-inspired"],
     "trustSignals": ["Verified"],
     "responseTime": "5 hours", "memberSince": 2023, "bookings": 14,
     "bio": "Moody portrait and engagement work, mostly outdoors.",
     "spots": ["lost-gulch", "chautauqua"],
     "lat": 40.030, "lng": -105.270},
]

SPOTS = [
    {"id": "chautauqua", "name": "Chautauqua Park", "city": "Boulder, CO",
     "image": "https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=1200&q=80",
     "bestFor": ["Graduation", "Couples", "Family", "Engagement"],
     "bestTime": "Golden hour / sunset",
     "notes": "Free entry. Park early — lots fill by 7am summer weekends. Flatirons backdrop visible from the meadow.",
     "photographerCount": 18, "lat": 39.998, "lng": -105.281},
    {"id": "lost-gulch", "name": "Lost Gulch Overlook", "city": "Boulder, CO",
     "image": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
     "bestFor": ["Couples", "Engagement", "Elopements"],
     "bestTime": "Sunset",
     "notes": "10-min drive up Flagstaff. Small lot. Big views west toward the Continental Divide.",
     "photographerCount": 12, "lat": 40.005, "lng": -105.330},
    {"id": "pearl-street", "name": "Pearl Street Mall", "city": "Boulder, CO",
     "image": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80",
     "bestFor": ["Graduation", "Portraits", "Lifestyle"],
     "bestTime": "Morning / weekday afternoon",
     "notes": "Pedestrian mall. Best on weekday mornings before crowds. Brick texture + string lights at night.",
     "photographerCount": 16, "lat": 40.018, "lng": -105.279},
    {"id": "union-station", "name": "Union Station", "city": "Denver, CO",
     "image": "https://images.unsplash.com/photo-1568667256549-094345857637?w=1200&q=80",
     "bestFor": ["Engagement", "Portraits", "Editorial"],
     "bestTime": "Blue hour",
     "notes": "Beaux-Arts facade + indoor grand hall. Indoor shoots may require permission.",
     "photographerCount": 31, "lat": 39.753, "lng": -105.000},
    {"id": "rino", "name": "RiNo Art District", "city": "Denver, CO",
     "image": "https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=1200&q=80",
     "bestFor": ["Editorial", "Portraits", "Brand"],
     "bestTime": "Anytime, varied light",
     "notes": "Rotating murals. Walls 27th–32nd between Larimer and Walnut are the densest stretch.",
     "photographerCount": 22, "lat": 39.770, "lng": -104.985},
    {"id": "red-rocks", "name": "Red Rocks Amphitheatre", "city": "Morrison, CO",
     "image": "https://images.unsplash.com/photo-1519834785169-98be25ec3f84?w=1200&q=80",
     "bestFor": ["Graduation", "Couples", "Brand"],
     "bestTime": "Sunrise",
     "notes": "Free to walk during off-hours. Sunrise = no concert crew. Iconic stage view + Trading Post trail.",
     "photographerCount": 24, "lat": 39.665, "lng": -105.205},
    {"id": "botanic", "name": "Denver Botanic Gardens", "city": "Denver, CO",
     "image": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&q=80",
     "bestFor": ["Family", "Couples", "Maternity"],
     "bestTime": "Morning",
     "notes": "Permit required for commercial shoots. Japanese garden and conservatory are the favorites.",
     "photographerCount": 14, "lat": 39.732, "lng": -104.961},
]


async def upsert_spot(db, data: dict) -> models.Spot:
    spot = (await db.scalars(select(models.Spot).where(models.Spot.slug == data["id"]))).first()
    if spot is None:
        spot = models.Spot(slug=data["id"])
        db.add(spot)
    spot.name = data["name"]
    spot.city = data["city"]
    spot.image_url = data["image"]
    spot.best_time = data["bestTime"]
    spot.notes = data["notes"]
    spot.photographer_count = data["photographerCount"]
    spot.lat = data["lat"]
    spot.lng = data["lng"]
    await db.flush()

    await db.execute(delete(models.SpotBestFor).where(models.SpotBestFor.spot_id == spot.id))
    for label in data["bestFor"]:
        db.add(models.SpotBestFor(spot_id=spot.id, label=label))
    return spot


async def upsert_photographer(db, data: dict, spot_id_by_slug: dict[str, int]) -> None:
    p = (await db.scalars(select(models.Photographer).where(models.Photographer.slug == data["id"]))).first()
    if p is None:
        p = models.Photographer(slug=data["id"])
        db.add(p)
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
        print("DATABASE_URL not set in backend/.env", file=sys.stderr)
        sys.exit(1)
    async with SessionLocal() as db:
        spot_id_by_slug: dict[str, int] = {}
        for s in SPOTS:
            spot = await upsert_spot(db, s)
            spot_id_by_slug[s["id"]] = spot.id
        for p in PHOTOGRAPHERS:
            await upsert_photographer(db, p, spot_id_by_slug)
        await db.commit()
    print(f"Seeded {len(SPOTS)} spots and {len(PHOTOGRAPHERS)} photographers.")


if __name__ == "__main__":
    asyncio.run(main())
