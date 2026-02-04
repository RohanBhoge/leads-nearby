declare namespace google.maps {
    class Map {
        constructor(mapDiv: Element | null, opts?: MapOptions);
        setCenter(latLng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
        panTo(latLng: LatLng | LatLngLiteral): void;
        addListener(eventName: string, handler: (this: Map, event: MapMouseEvent) => void): MapsEventListener;
    }
    class Marker {
        constructor(opts?: MarkerOptions);
        setPosition(latLng: LatLng | LatLngLiteral): void;
        getPosition(): LatLng | null;
        setMap(map: Map | null): void;
        addListener(eventName: string, handler: (this: Marker, event: { latLng: LatLng }) => void): MapsEventListener;
    }
    class Circle {
        constructor(opts?: CircleOptions);
        setCenter(latLng: LatLng | LatLngLiteral): void;
        setRadius(radius: number): void;
        setMap(map: Map | null): void;
    }
    class Geocoder {
        geocode(request: GeocoderRequest, callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void): void;
    }
    namespace places {
        class AutocompleteService {
            getPlacePredictions(request: AutocompletionRequest, callback: (predictions: AutocompletePrediction[] | null, status: PlacesServiceStatus) => void): void;
        }
        class PlacesService {
            constructor(attrContainer: HTMLDivElement | null);
            getDetails(request: PlaceDetailsRequest, callback: (result: PlaceResult | null, status: PlacesServiceStatus) => void): void;
        }
        enum PlacesServiceStatus {
            OK = 'OK',
            ZERO_RESULTS = 'ZERO_RESULTS',
            // ... others
        }
    }
    namespace Animation {
        const DROP: any;
    }

    interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
        streetViewControl?: boolean;
        mapTypeControl?: boolean;
        fullscreenControl?: boolean;
    }
    interface MarkerOptions {
        position: LatLng | LatLngLiteral;
        map?: Map;
        draggable?: boolean;
        animation?: any;
    }
    interface CircleOptions {
        strokeColor?: string;
        strokeOpacity?: number;
        strokeWeight?: number;
        fillColor?: string;
        fillOpacity?: number;
        map?: Map;
        center?: LatLng | LatLngLiteral;
        radius?: number;
    }
    interface LatLng {
        lat(): number;
        lng(): number;
    }
    interface LatLngLiteral {
        lat: number;
        lng: number;
    }
    interface MapMouseEvent {
        latLng: LatLng;
    }
    interface MapsEventListener {
        remove(): void;
    }
    interface GeocoderRequest {
        address?: string;
        location?: LatLng | LatLngLiteral;
        placeId?: string;
    }
    interface GeocoderResult {
        formatted_address: string;
        geometry: {
            location: LatLng;
        };
    }
    type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | string;

    interface AutocompletionRequest {
        input: string;
        componentRestrictions?: { country: string | string[] };
    }
    interface AutocompletePrediction {
        description: string;
        place_id: string;
    }
    interface PlaceDetailsRequest {
        placeId: string;
        fields?: string[];
    }
    interface PlaceResult {
        geometry?: {
            location?: LatLng;
        };
    }
}

interface Window {
    google: typeof google;
}
