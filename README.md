# TruckRoute Pro - Truck Driver Trip Planner

A full-stack web application that generates HOS-compliant trip plans and ELD daily log sheets for interstate truck drivers.

## Live Demo

- **Frontend:** [Vercel App URL]
- **Backend API:** [https://truck-driver-trip-planner-production.up.railway.app](https://truck-driver-trip-planner-production.up.railway.app)

## Features

- **Route Planning** — Enter current location, pickup, and dropoff to generate an optimized route
- **HOS Compliance** — Automatically applies FMCSA Hours of Service regulations (property-carrying, 70hr/8day)
- **Interactive Map** — Displays route with color-coded stop markers (fuel, rest breaks, overnight stops)
- **ELD Log Sheets** — Canvas-drawn daily logs matching the FMCSA graph grid format
- **Trip Summary** — Total miles, driving hours, number of days, and detailed stop timeline

## HOS Rules Implemented

| Rule | Description |
|------|-------------|
| 11-Hour Driving Limit | Max 11 hours driving after 10 consecutive hours off duty |
| 14-Hour Driving Window | Cannot drive beyond 14 hours after coming on duty |
| 30-Minute Break | Required after 8 cumulative hours of driving |
| 10-Hour Off-Duty | Minimum 10 consecutive hours off duty to reset clocks |
| 70-Hour/8-Day Limit | Cannot drive after 70 hours on duty in 8 consecutive days |
| Fuel Stops | At least once every 1,000 miles |
| Pickup/Dropoff | 1 hour on-duty (not driving) for each |

## Tech Stack

### Backend
- **Django** — Python web framework
- **Django REST Framework** — REST API
- **OSRM** — Open source routing (free, no API key)
- **Nominatim** — Geocoding (free, no API key)
- **SQLite** — Database
- **Gunicorn** — Production server

### Frontend
- **React** + TypeScript
- **Vite** — Build tool
- **Leaflet** — Interactive maps with OpenStreetMap tiles
- **TailwindCSS** — Styling
- **HTML5 Canvas** — ELD log sheet drawing

## Project Structure

```
├── backend/
│   ├── config/              # Django project settings
│   ├── trips/
│   │   ├── models.py        # Trip model
│   │   ├── views.py         # API endpoints
│   │   ├── serializers.py   # JSON serialization
│   │   ├── hos_engine.py    # HOS calculation engine
│   │   ├── route_service.py # Geocoding + OSRM routing
│   │   └── urls.py          # URL routing
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TripForm.tsx      # Input form
│   │   │   ├── RouteMap.tsx      # Leaflet map
│   │   │   ├── TripSummary.tsx   # Trip details + stops
│   │   │   ├── ELDLogBook.tsx    # Multi-day log container
│   │   │   └── ELDLogSheet.tsx   # Canvas-drawn daily log
│   │   ├── utils/
│   │   │   └── eldCanvas.ts      # FMCSA grid drawing logic
│   │   ├── api/tripApi.ts        # API client
│   │   └── types/trip.ts         # TypeScript interfaces
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/trips/` | Create a trip plan with HOS calculations |
| GET | `/api/trips/{id}/` | Retrieve a previously computed trip |

### Request Example

```json
POST /api/trips/
{
  "current_location": "Dallas, TX",
  "pickup_location": "Oklahoma City, OK",
  "dropoff_location": "Denver, CO",
  "current_cycle_used": 20
}
```

## Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Assumptions

- Property-carrying CMV driver
- 70-hour/8-day cycle
- No adverse driving conditions
- Average speed based on OSRM route estimates
- Fueling at least once every 1,000 miles
- 1 hour for pickup and drop-off operations
