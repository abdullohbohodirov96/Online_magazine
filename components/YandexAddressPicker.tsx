'use client';

import React, { useEffect, useRef, useState } from 'react';

interface LocationData {
  address: string;
  yandexAddress: string;
  latitude: number;
  longitude: number;
}

interface YandexAddressPickerProps {
  initialAddress?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  onChange: (data: LocationData) => void;
}

export default function YandexAddressPicker({
  initialAddress = '',
  initialLatitude = 41.311081, // Tashkent center
  initialLongitude = 69.240562,
  onChange
}: YandexAddressPickerProps) {
  const [address, setAddress] = useState(initialAddress);
  const [coords, setCoords] = useState<[number, number]>([initialLatitude, initialLongitude]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingMap, setLoadingMap] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const placemarkRef = useRef<any>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSelectingSuggestionRef = useRef(false);

  // Sync initialAddress prop changes
  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      setAddress(initialAddress);
    }
  }, [initialAddress]);

  // Load Yandex Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '';
    const scriptId = 'yandex-maps-api-script';
    
    const initYmaps = () => {
      const ymaps = (window as any).ymaps;
      if (!ymaps) return;

      ymaps.ready(() => {
        setLoadingMap(false);
        if (!mapRef.current || mapInstanceRef.current) return;

        // Initialize map
        const map = new ymaps.Map(mapRef.current, {
          center: coords,
          zoom: 15,
          controls: ['zoomControl']
        });
        mapInstanceRef.current = map;

        // Initialize draggable placemark
        const placemark = new ymaps.Placemark(coords, {
          balloonContent: address || 'Место доставки'
        }, {
          preset: 'islands#redDotIconWithCaption',
          draggable: true
        });
        placemarkRef.current = placemark;
        map.geoObjects.add(placemark);

        // Map Click Event
        map.events.add('click', (e: any) => {
          const newCoords = e.get('coords') as [number, number];
          updatePin(newCoords, true);
        });

        // Placemark Drag Event
        placemark.events.add('dragend', () => {
          const newCoords = placemark.geometry.getCoordinates() as [number, number];
          updatePin(newCoords, true);
        });
      });
    };

    if (!(window as any).ymaps) {
      const existingScript = document.getElementById(scriptId);
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=' + apiKey + '&lang=ru_RU';
        script.onload = initYmaps;
        document.head.appendChild(script);
      } else {
        existingScript.addEventListener('load', initYmaps);
      }
    } else {
      initYmaps();
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        } catch (e) {
          console.error('Error destroying map:', e);
        }
      }
    };
  }, []);

  // Update Placemark Position and Geocode Address
  const updatePin = (newCoords: [number, number], shouldGeocode: boolean, customAddress?: string) => {
    setCoords(newCoords);
    
    const ymaps = (window as any).ymaps;
    if (!ymaps) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(newCoords, 16);
    }

    if (!placemarkRef.current && mapInstanceRef.current) {
      const placemark = new ymaps.Placemark(newCoords, {
        balloonContent: customAddress || address || 'Место доставки'
      }, {
        preset: 'islands#redDotIconWithCaption',
        draggable: true
      });
      placemarkRef.current = placemark;
      mapInstanceRef.current.geoObjects.add(placemark);

      placemark.events.add('dragend', () => {
        const dragCoords = placemark.geometry.getCoordinates() as [number, number];
        updatePin(dragCoords, true);
      });
    } else if (placemarkRef.current) {
      placemarkRef.current.geometry.setCoordinates(newCoords);
    }

    if (shouldGeocode) {
      ymaps.geocode(newCoords).then((res: any) => {
        const firstGeoObject = res.geoObjects.get(0);
        const geocodedAddress = firstGeoObject ? firstGeoObject.getAddressLine() : '';
        setAddress(geocodedAddress);
        onChange({
          address: geocodedAddress,
          yandexAddress: geocodedAddress,
          latitude: newCoords[0],
          longitude: newCoords[1]
        });
      });
    } else if (customAddress) {
      setAddress(customAddress);
      onChange({
        address: customAddress,
        yandexAddress: customAddress,
        latitude: newCoords[0],
        longitude: newCoords[1]
      });
    }
  };

  // Autocomplete Suggestions Query via ymaps.geocode
  const handleInputChange = (val: string) => {
    setAddress(val);
    onChange({
      address: val,
      yandexAddress: val,
      latitude: coords[0],
      longitude: coords[1]
    });

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      const ymaps = (window as any).ymaps;
      if (!ymaps) return;

      const searchQuery = val.toLowerCase().includes('toshkent') || val.toLowerCase().includes('ташкент')
        ? val
        : 'Toshkent, ' + val;

      console.log('YANDEX SEARCH QUERY', searchQuery);

      ymaps.geocode(searchQuery, { results: 5 }).then((res: any) => {
        const geoObjects = res.geoObjects.toArray();
        const results = geoObjects.map((obj: any) => ({
          displayName: obj.getAddressLine(),
          value: obj.getAddressLine(),
          coords: obj.geometry.getCoordinates()
        }));

        console.log('YANDEX SUGGESTIONS', results);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      }).catch((err: any) => {
        console.error('Yandex geocode error:', err);
      });
    }, 500);
  };

  // Perform AutoSelect on Blur or Enter
  const performAutoSelect = (query: string) => {
    const ymaps = (window as any).ymaps;
    if (!ymaps || !query.trim() || query.trim().length < 3) return;

    const searchQuery = query.toLowerCase().includes('toshkent') || query.toLowerCase().includes('ташкент')
      ? query
      : 'Toshkent, ' + query;

    console.log('YANDEX SEARCH QUERY [AUTOSELECT]', searchQuery);

    ymaps.geocode(searchQuery, { results: 1 }).then((res: any) => {
      const firstGeoObject = res.geoObjects.get(0);
      if (firstGeoObject) {
        const selectedAddress = firstGeoObject.getAddressLine();
        const firstCoords = firstGeoObject.geometry.getCoordinates() as [number, number];
        updatePin(firstCoords, false, selectedAddress);
      }
    }).catch((err: any) => {
      console.error('Auto select geocode error:', err);
    });
  };

  // Handle Suggestion Item Click
  const handleSuggestionClick = (item: any) => {
    setShowSuggestions(false);
    setSuggestions([]);
    if (item.coords) {
      updatePin(item.coords, false, item.value);
    }
  };

  // Handle Key Down (Enter key support)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0]);
      } else {
        performAutoSelect(address);
      }
      setShowSuggestions(false);
    }
  };

  // Detect My Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером');
      return;
    }

    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords: [number, number] = [latitude, longitude];
        updatePin(newCoords, true);
        setLocating(false);
      },
      (err) => {
        console.error('Error detecting location:', err);
        setError('Не удалось определить местоположение. Пожалуйста, найдите адрес на карте.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-input"
            value={address}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!isSelectingSuggestionRef.current) {
                  performAutoSelect(address);
                }
                setShowSuggestions(false);
                isSelectingSuggestionRef.current = false;
              }, 250);
            }}
            placeholder="Введите улицу, дом, ориентир..."
            style={{ width: '100%', boxSizing: 'border-box' }}
          />

          {showSuggestions && suggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: 'var(--radius-md, 8px)',
                boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
                maxHeight: '240px',
                overflowY: 'auto',
                zIndex: 9999,
                marginTop: '5px',
              }}
            >
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSuggestionClick(item)}
                  onMouseDown={() => {
                    isSelectingSuggestionRef.current = true;
                  }}
                  style={{
                    padding: '0.6rem 1rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border, #e2e8f0)',
                    color: 'var(--foreground, #0f172a)'
                  }}
                >
                  📍 {item.displayName}
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={locating}
          style={{
            padding: '0.65rem',
            borderRadius: 'var(--radius-md, 8px)',
            border: '1px solid var(--primary-color, #10b981)',
            backgroundColor: 'transparent',
            color: 'var(--primary-color, #10b981)',
            cursor: 'pointer',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '42px',
            width: '42px',
            flexShrink: 0
          }}
          title="Определить мое местоположение"
        >
          {locating ? '⏳' : '📍'}
        </button>
      </div>

      {error && (
        <div style={{ color: 'var(--danger, #ef4444)', fontSize: '0.75rem', marginTop: '4px', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '220px',
          borderRadius: 'var(--radius-md, 8px)',
          overflow: 'hidden',
          marginTop: '10px',
          border: '1px solid var(--border, #e2e8f0)',
          backgroundColor: 'var(--muted-light, #f1f5f9)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--muted, #64748b)',
          fontSize: '0.9rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        {loadingMap && <span>Загрузка интерактивной карты...</span>}
      </div>
    </div>
  );
}
