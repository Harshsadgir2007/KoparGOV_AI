"""Map & GIS Intelligence Router for Kopargaon Municipal Area.

Provides endpoints for:
- GIS layers (roads, ward polygons, critical civic landmarks) (`GET /api/map/layers`)
- Forward Geocoding (`GET /api/map/geocode`)
- Reverse Geocoding with local Kopargaon landmark index (`GET /api/map/reverse-geocode`)
- Ward boundaries and ward statistics (`GET /api/map/wards`)
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Query, status
from pydantic import BaseModel

from app.services.db_service import DatabaseService

router = APIRouter(prefix="/api/map", tags=["Map & GIS Intelligence"])
db_service = DatabaseService()


# ------------------------------------------------------------------------------
# Models
# ------------------------------------------------------------------------------

class MapPOI(BaseModel):
    """Point of Interest in Kopargaon."""
    id: str
    name: str
    category: str
    latitude: float
    longitude: float
    ward_number: int
    address: str


class WardBoundary(BaseModel):
    """Ward GIS definition and operational boundary."""
    ward_number: int
    ward_name: str
    center: List[float]
    population: int
    in_charge: str
    active_issues: int = 0


class GeocodeResult(BaseModel):
    """Geocoding result."""
    query: str
    latitude: float
    longitude: float
    display_name: str
    ward_number: int
    confidence: float


# Landmark POI Database for Kopargaon
KOPARGAON_LANDMARKS: List[MapPOI] = [
    MapPOI(
        id="POI-KPG-01",
        name="Kopargaon Municipal Council (KMC) Headquarters",
        category="GOVERNMENT",
        latitude=19.8928,
        longitude=74.4795,
        ward_number=5,
        address="Near Subhash Road, Shivaji Chowk, Kopargaon - 423601",
    ),
    MapPOI(
        id="POI-KPG-02",
        name="Kopargaon Railway Station",
        category="TRANSIT",
        latitude=19.8835,
        longitude=74.4712,
        ward_number=1,
        address="Station Road, Kopargaon Railway Colony",
    ),
    MapPOI(
        id="POI-KPG-03",
        name="Shivaji Chowk",
        category="JUNCTION",
        latitude=19.8917,
        longitude=74.4789,
        ward_number=5,
        address="Shivaji Chowk, Main Bazaar, Kopargaon",
    ),
    MapPOI(
        id="POI-KPG-04",
        name="Godavari River Bridge & Ghat",
        category="WATERFRONT",
        latitude=19.8985,
        longitude=74.4850,
        ward_number=2,
        address="Godavari Riverbank, Old Town Ghat Road",
    ),
    MapPOI(
        id="POI-KPG-05",
        name="Kopargaon Rural Hospital / Sub-District Hospital",
        category="HEALTHCARE",
        latitude=19.8890,
        longitude=74.4740,
        ward_number=3,
        address="Hospital Road, near Tilak Nagar",
    ),
    MapPOI(
        id="POI-KPG-06",
        name="Kopargaon Bus Depot (MSRTC)",
        category="TRANSIT",
        latitude=19.8902,
        longitude=74.4768,
        ward_number=4,
        address="Bus Stand Road, Kopargaon",
    ),
]

KOPARGAON_WARDS: List[WardBoundary] = [
    WardBoundary(
        ward_number=1,
        ward_name="Ward 1 - Railway Station Area",
        center=[19.8835, 74.4712],
        population=14500,
        in_charge="Shri. Ramesh Gaikwad",
    ),
    WardBoundary(
        ward_number=2,
        ward_name="Ward 2 - Godavari Riverfront / Old Town",
        center=[19.8985, 74.4850],
        population=18200,
        in_charge="Smt. Meena Sonawane",
    ),
    WardBoundary(
        ward_number=3,
        ward_name="Ward 3 - Tilak Nagar & Hospital Zone",
        center=[19.8890, 74.4740],
        population=16800,
        in_charge="Shri. Pravin Deshmukh",
    ),
    WardBoundary(
        ward_number=4,
        ward_name="Ward 4 - Bus Stand & Commercial Corridor",
        center=[19.8902, 74.4768],
        population=21000,
        in_charge="Shri. Anand Shinde",
    ),
    WardBoundary(
        ward_number=5,
        ward_name="Ward 5 - Shivaji Chowk & Market Center",
        center=[19.8917, 74.4789],
        population=24500,
        in_charge="Shri. Sunil Jadhav",
    ),
]


# ------------------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------------------

@router.get(
    "/layers",
    summary="Get all Kopargaon GIS layers (Roads, POIs, Wards)",
    status_code=status.HTTP_200_OK,
)
async def get_map_layers() -> Dict[str, Any]:
    """Retrieve full GIS dataset including road networks, landmarks, and ward boundaries."""
    roads = db_service.list_roads()
    issues = db_service.list_issues()

    # Calculate issue counts per ward
    ward_counts: Dict[int, int] = {}
    for issue in issues:
        wn = issue.ward_number or 5
        ward_counts[wn] = ward_counts.get(wn, 0) + 1

    wards_with_counts = []
    for w in KOPARGAON_WARDS:
        w_dict = w.model_dump()
        w_dict["active_issues"] = ward_counts.get(w.ward_number, 0)
        wards_with_counts.append(w_dict)

    return {
        "city": "Kopargaon",
        "district": "Ahilya Nagar (Ahmednagar)",
        "state": "Maharashtra",
        "center": [19.8917, 74.4789],
        "default_zoom": 14,
        "roads_count": len(roads),
        "roads": roads,
        "landmarks": [p.model_dump() for p in KOPARGAON_LANDMARKS],
        "wards": wards_with_counts,
    }


@router.get(
    "/wards",
    response_model=List[WardBoundary],
    summary="List all Kopargaon municipal wards",
    status_code=status.HTTP_200_OK,
)
async def list_wards() -> List[WardBoundary]:
    """Retrieve list of municipal wards and their operational centers."""
    issues = db_service.list_issues()
    ward_counts: Dict[int, int] = {}
    for issue in issues:
        wn = issue.ward_number or 5
        ward_counts[wn] = ward_counts.get(wn, 0) + 1

    res = []
    for w in KOPARGAON_WARDS:
        w_copy = w.model_copy()
        w_copy.active_issues = ward_counts.get(w.ward_number, 0)
        res.append(w_copy)
    return res


@router.get(
    "/geocode",
    response_model=List[GeocodeResult],
    summary="Forward geocode a location or landmark name in Kopargaon",
    status_code=status.HTTP_200_OK,
)
async def geocode_location(query: str = Query(..., min_length=2)) -> List[GeocodeResult]:
    """Geocode query string to geographical coordinates."""
    q_lower = query.lower()
    results: List[GeocodeResult] = []

    # Search local landmarks
    for poi in KOPARGAON_LANDMARKS:
        if q_lower in poi.name.lower() or q_lower in poi.address.lower() or q_lower in poi.category.lower():
            results.append(
                GeocodeResult(
                    query=query,
                    latitude=poi.latitude,
                    longitude=poi.longitude,
                    display_name=f"{poi.name}, {poi.address}",
                    ward_number=poi.ward_number,
                    confidence=0.95,
                )
            )

    # If no exact landmark match, match by ward
    if not results:
        for ward in KOPARGAON_WARDS:
            if q_lower in ward.ward_name.lower():
                results.append(
                    GeocodeResult(
                        query=query,
                        latitude=ward.center[0],
                        longitude=ward.center[1],
                        display_name=f"{ward.ward_name}, Kopargaon",
                        ward_number=ward.ward_number,
                        confidence=0.85,
                    )
                )

    # Fallback to municipal center
    if not results:
        results.append(
            GeocodeResult(
                query=query,
                latitude=19.8917,
                longitude=74.4789,
                display_name=f"{query}, Kopargaon, Maharashtra 423601",
                ward_number=5,
                confidence=0.60,
            )
        )

    return results


@router.get(
    "/reverse-geocode",
    response_model=GeocodeResult,
    summary="Reverse geocode coordinates to street and ward name",
    status_code=status.HTTP_200_OK,
)
async def reverse_geocode(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
) -> GeocodeResult:
    """Reverse geocode coordinates into a structured Kopargaon address."""
    # Find closest landmark
    closest_poi = None
    min_dist = float("inf")

    for poi in KOPARGAON_LANDMARKS:
        # Euclidean approximate distance in lat/lng space
        d = ((poi.latitude - latitude) ** 2 + (poi.longitude - longitude) ** 2) ** 0.5
        if d < min_dist:
            min_dist = d
            closest_poi = poi

    ward_num = closest_poi.ward_number if closest_poi else 5
    if closest_poi and min_dist < 0.005:  # ~500m
        display = f"Near {closest_poi.name}, Ward {ward_num}, Kopargaon"
    else:
        display = f"Ward {ward_num} Area ({latitude:.4f}, {longitude:.4f}), Kopargaon - 423601"

    return GeocodeResult(
        query=f"{latitude},{longitude}",
        latitude=latitude,
        longitude=longitude,
        display_name=display,
        ward_number=ward_num,
        confidence=0.90,
    )
