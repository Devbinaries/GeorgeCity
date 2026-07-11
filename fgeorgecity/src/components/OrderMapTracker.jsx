import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, Compass, AlertCircle, RefreshCw } from 'lucide-react';
import  {getAuthToken}  from '../hooks/useAuth';

export default function OrderMapTracker({ order, isDriver = false, onStatusChange }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [wsStatus, setWsStatus] = useState('connecting');
  const [driverLoc, setDriverLoc] = useState({
    lat: order.driver_latitude ? parseFloat(order.driver_latitude) : null,
    lng: order.driver_longitude ? parseFloat(order.driver_longitude) : null
  });
  const [simulating, setSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const markerRef = useRef(null);
  const routeLineRef = useRef(null);
  const directionsRendererRef = useRef(null);

  // Default coordinate helpers (George, South Africa)
  const pickupLat = order.produced_by_latitude ? parseFloat(order.produced_by_latitude) : -33.9608;
  const pickupLng = order.produced_by_longitude ? parseFloat(order.produced_by_longitude) : 22.4616;
  const deliveryLat = order.latitude ? parseFloat(order.latitude) : -33.9500;
  const deliveryLng = order.longitude ? parseFloat(order.longitude) : 22.4800;

  // Initialize WebSocket for real-time tracking
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // e.g. localhost:5173 (Vite) -> proxied to localhost:8000 for ws?
    // Wait, Vite config proxies "api/" but ws might need direct port 8000 in dev
    const wsUrl = `ws://localhost:8000/ws/track/${order.id}/`;

    console.log(`Connecting to tracking WebSocket: ${wsUrl}`);
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setWsStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket received:", data);
        if (data.latitude && data.longitude) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          setDriverLoc({ lat, lng });
          
          // Update marker on Google Map if loaded
          if (markerRef.current) {
            markerRef.current.setPosition({ lat, lng });
          }
        }
      } catch (err) {
        console.error("Error parsing socket message:", err);
      }
    };

    socket.onclose = () => {
      setWsStatus('disconnected');
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
      setWsStatus('error');
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [order.id]);

  // Handle Geolocation watch for Drivers
  useEffect(() => {
    if (isDriver && (order.status === 'ASSIGNED' || order.status === 'PICKED_UP') && !simulating) {
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Update local state
            setDriverLoc({ lat, lng });

            // Send to WebSocket
            sendLocation(lat, lng);
          },
          (err) => {
            console.error("Geolocation error:", err);
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isDriver, order.status, simulating]);

  // Send coordinates via WebSocket helper
  const sendLocation = (lat, lng, statusVal = null) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        latitude: lat,
        longitude: lng,
        status: statusVal
      }));
    }
  };

  // Simulation loop
  useEffect(() => {
    let interval = null;
    if (simulating) {
      interval = setInterval(() => {
        setSimulationProgress((prev) => {
          const next = prev + 0.05;
          if (next >= 1.0) {
            setSimulating(false);
            // Auto mark as delivered when reaching destination in simulation if needed
            sendLocation(deliveryLat, deliveryLng, 'DELIVERED');
            if (onStatusChange) onStatusChange('DELIVERED');
            return 1.0;
          }

          // Interpolate current position along path
          // If status is ASSIGNED: heading from somewhere to Pickup (Farm)
          // If status is PICKED_UP: heading from Pickup to Dropoff (Consumer)
          let currentLat, currentLng;
          if (order.status === 'ASSIGNED') {
            // Driver is traveling to Farm. Let's start from a point slightly offset and move to Farm
            const startLat = pickupLat - 0.015;
            const startLng = pickupLng - 0.015;
            currentLat = startLat + (pickupLat - startLat) * next;
            currentLng = startLng + (pickupLng - startLng) * next;
          } else {
            // Traveling from Farm to Delivery
            currentLat = pickupLat + (deliveryLat - pickupLat) * next;
            currentLng = pickupLng + (deliveryLng - pickupLng) * next;
          }

          setDriverLoc({ lat: currentLat, lng: currentLng });
          sendLocation(currentLat, currentLng);
          return next;
        });
      }, 1000);
    } else {
      setSimulationProgress(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [simulating, order.status]);

  // Load Google Maps API
  useEffect(() => {
    // First retrieve maps config
    const token = getAuthToken();
    fetch('/api/maps/config/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(config => {
        const apiKey = config.google_maps_api_key || "";
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places"]
        });

        loader.load().then((google) => {
          setLoading(false);
          initMap(google);
        }).catch((e) => {
          console.error("Google Maps load failed:", e);
          setLoadError(e);
          setLoading(false);
        });
      })
      .catch(err => {
        console.error("Failed to load maps config:", err);
        setLoadError(err);
        setLoading(false);
      });
  }, [order.id]);

  // Initialize Map
  const initMap = (google) => {
    if (!mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: pickupLat, lng: pickupLng },
      zoom: 13,
      styles: [
        {
          "featureType": "administrative",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#444444" }]
        },
        {
          "featureType": "landscape",
          "elementType": "all",
          "stylers": [{ "color": "#f2f2f2" }]
        },
        {
          "featureType": "poi",
          "elementType": "all",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "road",
          "elementType": "all",
          "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
        },
        {
          "featureType": "road.highway",
          "elementType": "all",
          "stylers": [{ "visibility": "simplified" }]
        },
        {
          "featureType": "road.arterial",
          "elementType": "labels.icon",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "transit",
          "elementType": "all",
          "stylers": [{ "visibility": "off" }]
        },
        {
          "featureType": "water",
          "elementType": "all",
          "stylers": [{ "color": "#c5cae9" }, { "visibility": "on" }]
        }
      ]
    });

    setMap(mapInstance);

    // Setup Directions Service
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map: mapInstance,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#4f46e5",
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    });

    directionsRendererRef.current = directionsRenderer;

    // Draw route
    directionsService.route({
      origin: { lat: pickupLat, lng: pickupLng },
      destination: { lat: deliveryLat, lng: deliveryLng },
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(result);
      } else {
        console.error("Directions request failed due to " + status);
      }
    });

    // Create custom markers
    // Pickup Marker (Green)
    new google.maps.Marker({
      position: { lat: pickupLat, lng: pickupLng },
      map: mapInstance,
      title: `Pickup: ${order.produced_by_name || 'Farm'}`,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#10b981',
        fillOpacity: 1.0,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      }
    });

    // Destination Marker (Red)
    new google.maps.Marker({
      position: { lat: deliveryLat, lng: deliveryLng },
      map: mapInstance,
      title: `Delivery: ${order.deliver_to}`,
      icon: {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#ef4444',
        fillOpacity: 1.0,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      }
    });

    // Driver Marker (Indigo Circle with arrow direction)
    const driverLocLat = driverLoc.lat || pickupLat;
    const driverLocLng = driverLoc.lng || pickupLng;
    const driverMarkerInstance = new google.maps.Marker({
      position: { lat: driverLocLat, lng: driverLocLng },
      map: mapInstance,
      title: "Driver Location",
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#4f46e5',
        fillOpacity: 1.0,
        strokeWeight: 2,
        strokeColor: '#ffffff'
      }
    });

    markerRef.current = driverMarkerInstance;
  };

  const startSimulation = () => {
    setSimulating(true);
  };

  const stopSimulation = () => {
    setSimulating(false);
  };

  // Helper for rendering connection badge
  const renderWsBadge = () => {
    const badges = {
      connected: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><span className="h-1.5 w-1.5 mr-1 rounded-full bg-green-500"></span>Live GPS Connected</span>,
      connecting: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><RefreshCw className="animate-spin h-3 w-3 mr-1" />Connecting...</span>,
      disconnected: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />GPS Disconnected</span>,
      error: <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />GPS Error</span>
    };
    return badges[wsStatus] || badges.disconnected;
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* Tracker Header */}
      <div className="bg-indigo-900 text-white p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Navigation className="h-5 w-5 animate-pulse text-indigo-400" />
            Real-time Order Tracker #{order.id}
          </h2>
          <p className="text-xs text-indigo-200">
            Pickup: <span className="font-semibold text-white">{order.produced_by_name || 'Farm'}</span> ➔ Delivery: <span className="font-semibold text-white">{order.deliver_to}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {renderWsBadge()}
          {isDriver && (order.status === 'ASSIGNED' || order.status === 'PICKED_UP') && (
            <button
              onClick={simulating ? stopSimulation : startSimulation}
              className={`px-3 py-1 rounded-lg text-xs font-semibold shadow transition-all ${
                simulating 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {simulating ? 'Stop Simulation' : 'Simulate Drive'}
            </button>
          )}
        </div>
      </div>

      {/* Map Content */}
      <div className="relative w-full h-[400px]">
        {/* Loader Overlays */}
        {loading && (
          <div className="absolute inset-0 bg-indigo-50/50 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <RefreshCw className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
            <p className="text-sm font-semibold text-indigo-900">Loading Map API...</p>
          </div>
        )}

        {/* Fallback/Mock Map if API fails to load or no API key */}
        {loadError ? (
          <div className="absolute inset-0 bg-indigo-50 flex flex-col items-center justify-center p-6 text-center z-0">
            <Compass className="h-16 w-16 text-indigo-400 animate-spin mb-4" style={{ animationDuration: '6s' }} />
            <h3 className="text-lg font-semibold text-indigo-900 mb-1">Simulated Map Mode</h3>
            <p className="text-xs text-indigo-600 max-w-sm mb-4">
              Google Maps could not be loaded. Running with simulated radar routing dashboard.
            </p>

            {/* SVG Path Route Visualizer */}
            <div className="w-full max-w-md h-40 bg-white rounded-xl shadow-inner border border-indigo-100 flex items-center justify-center relative overflow-hidden">
              <svg className="w-4/5 h-16" viewBox="0 0 200 40">
                {/* Route Path Line */}
                <path 
                  d="M 20 20 C 60 40, 140 0, 180 20" 
                  fill="none" 
                  stroke="#e2e8f0" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                />
                <path 
                  d="M 20 20 C 60 40, 140 0, 180 20" 
                  fill="none" 
                  stroke="#4f46e5" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                  strokeDasharray="200"
                  strokeDashoffset={200 - (simulating ? simulationProgress * 200 : (order.status === 'PICKED_UP' ? 100 : (order.status === 'DELIVERED' ? 200 : 0)))}
                  className="transition-all duration-1000 ease-out"
                />

                {/* Pickup node */}
                <circle cx="20" cy="20" r="8" fill="#10b981" />
                <text x="20" y="35" fontSize="8" textAnchor="middle" fill="#047857" fontWeight="bold">Pickup</text>

                {/* Destination node */}
                <circle cx="180" cy="20" r="8" fill="#ef4444" />
                <text x="180" y="35" fontSize="8" textAnchor="middle" fill="#b91c1c" fontWeight="bold">Dropoff</text>

                {/* Driver Node */}
                {(driverLoc.lat || simulating) && (
                  <circle 
                    cx={20 + (180 - 20) * (simulating ? simulationProgress : (order.status === 'PICKED_UP' ? 0.5 : (order.status === 'DELIVERED' ? 1.0 : 0.05)))}
                    cy={20 + (order.status === 'PICKED_UP' ? 2 : 0)}
                    r="6" 
                    fill="#4f46e5" 
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-1000 animate-bounce"
                  />
                )}
              </svg>
            </div>
            
            {/* Simulation controls */}
            {simulating && (
              <div className="mt-4 text-xs font-semibold text-indigo-900 bg-indigo-100/50 px-3 py-1.5 rounded-full">
                Driving: {Math.round(simulationProgress * 100)}% complete
              </div>
            )}
          </div>
        ) : (
          /* Actual Google Map container */
          <div ref={mapRef} className="w-full h-full" />
        )}
      </div>

      {/* Tracker Info Footer */}
      <div className="bg-gray-50 p-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Status</span>
          <span className={`text-sm font-bold mt-1 px-2.5 py-0.5 rounded-full ${
            order.status === 'DELIVERED' 
              ? 'bg-green-100 text-green-800' 
              : order.status === 'PICKED_UP' 
              ? 'bg-blue-100 text-blue-800'
              : order.status === 'ASSIGNED'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {order.status}
          </span>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pickup</span>
          <p className="text-sm font-bold text-gray-800 mt-1 truncate px-2">{order.produced_by_name || 'Farm'}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Destination</span>
          <p className="text-sm font-bold text-gray-800 mt-1 truncate px-2">{order.deliver_to}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Driver</span>
          <p className="text-sm font-bold text-gray-800 mt-1 truncate px-2">{order.driver_username || 'Assigning...'}</p>
        </div>
      </div>
    </div>
  );
}
