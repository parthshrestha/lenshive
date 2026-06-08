"""Google Maps proxying — geocode, reverse-geocode, places autocomplete,
and the public client config that exposes the maps API key to the browser.
"""

import os
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, Query

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"
PLACES_AUTOCOMPLETE_URL = "https://maps.googleapis.com/maps/api/place/autocomplete/json"

router = APIRouter(prefix="/api", tags=["maps"])


def _component(components, type_name, short=False):
    key = "short_name" if short else "long_name"
    for c in components:
        if type_name in c.get("types", []):
            return c.get(key)
    return None


def _label(result):
    """Build a concise 'City, ST' label from a geocoding result."""
    comps = result.get("address_components", [])
    city = (
        _component(comps, "locality")
        or _component(comps, "postal_town")
        or _component(comps, "administrative_area_level_2")
    )
    state = _component(comps, "administrative_area_level_1", short=True)
    if city and state:
        return f"{city}, {state}"
    return city or state or result.get("formatted_address", "")


async def _call_geocode(params):
    if not GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=503, detail="Maps API key not configured")
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(GEOCODE_URL, params={**params, "key": GOOGLE_MAPS_API_KEY})
    data = resp.json()
    results = data.get("results") or []
    if not results:
        raise HTTPException(status_code=404, detail="No geocoding results")
    return results[0]


@router.get("/config")
def config():
    return {"mapsApiKey": GOOGLE_MAPS_API_KEY}


@router.get("/geocode")
async def geocode(
    address: Optional[str] = Query(None, min_length=1),
    place_id: Optional[str] = Query(None, min_length=1),
):
    """Resolve an address or a Google place_id to coordinates + a label.

    Place IDs come from the Places Autocomplete endpoint below; addresses are
    used for free-text submits when the user didn't pick a suggestion.
    """
    if not address and not place_id:
        raise HTTPException(status_code=400, detail="address or place_id required")
    params = {"place_id": place_id} if place_id else {"address": address}
    result = await _call_geocode(params)
    loc = result["geometry"]["location"]
    return {
        "lat": loc["lat"],
        "lng": loc["lng"],
        "label": _label(result),
        "formatted": result.get("formatted_address", address or ""),
    }


@router.get("/places-autocomplete")
async def places_autocomplete(
    input: str = Query(..., min_length=1),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
):
    """Google Places Autocomplete proxy.

    Optionally biases results around (lat, lng) so the user's nearby places
    show first. Returns at most 6 suggestions.
    """
    if not GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=503, detail="Maps API key not configured")
    params = {"input": input, "key": GOOGLE_MAPS_API_KEY}
    if lat is not None and lng is not None:
        params["location"] = f"{lat},{lng}"
        params["radius"] = 80000  # ~50 mi bias
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(PLACES_AUTOCOMPLETE_URL, params=params)
    data = resp.json()
    preds = data.get("predictions", []) or []
    return [
        {
            "placeId": p.get("place_id"),
            "description": p.get("description"),
            "mainText": (p.get("structured_formatting") or {}).get("main_text"),
            "secondaryText": (p.get("structured_formatting") or {}).get("secondary_text"),
        }
        for p in preds[:6]
    ]


@router.get("/reverse-geocode")
async def reverse_geocode(lat: float, lng: float):
    result = await _call_geocode({"latlng": f"{lat},{lng}"})
    loc = result["geometry"]["location"]
    return {
        "lat": loc["lat"],
        "lng": loc["lng"],
        "label": _label(result),
        "formatted": result.get("formatted_address", ""),
    }
