'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
    MapPin,
    Search,
    Compass,
    Layers,
    Info,
    RotateCcw,
    Sliders,
    Hand,
    Move,
    ChevronDown,
    ChevronUp
} from 'lucide-react'

// Fix default Leaflet icon paths in Next.js / Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom SVG-based modern pin icons
const createCustomIcon = (color: string, type: 'main' | 'competitor' | 'nearby', labelText?: string) => {
    const isMain = type === 'main'
    const width = isMain ? 42 : 30
    const height = isMain ? 50 : 38
    
    // Clean modern pin: Crisp SVG pin shape
    // When not main: sleek solid pin with dot, NO white border (stroke="none" or stroke same color)
    const innerGlyph = isMain
        ? `<circle cx="21" cy="19" r="7.5" fill="white" />
           <circle cx="21" cy="19" r="4" fill="${color}" />`
        : `<circle cx="15" cy="14.5" r="4.5" fill="white" />`

    const strokeAttr = isMain 
        ? 'stroke="#ffffff" stroke-width="2.5"' 
        : 'stroke="none"'

    const iconHtml = `
    <div class="relative flex flex-col items-center group cursor-pointer select-none">
      <svg width="${width}" height="${height}" viewBox="0 0 ${isMain ? '42 50' : '30 38'}" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 8px rgba(0,0,0,0.45)); transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);">
        <!-- Pin Base Path -->
        <path d="${
            isMain
                ? 'M21 0C9.402 0 0 9.402 0 21C0 32.598 21 50 21 50C21 50 42 32.598 42 21C42 9.402 32.598 0 21 0Z'
                : 'M15 0C6.716 0 0 6.716 0 15C0 23.5 15 38 15 38C15 38 30 23.5 30 15C30 6.716 23.284 0 15 0Z'
        }" fill="${color}" ${strokeAttr}/>
        ${innerGlyph}
      </svg>
    </div>
    `

    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize: [width, height],
        iconAnchor: [width / 2, height],
        popupAnchor: [0, -height],
    })
}

export interface InteractiveMapPickerProps {
    lat?: number
    lng?: number
    locationName?: string
    radiusKm?: number
    competitors?: Array<{
        name: string
        lat?: number
        lng?: number
        location?: string
        distance?: string
        category?: string
        rating?: number
        source?: 'seed' | 'nearby' | string
        [key: string]: any
    }>
    nearbyPlaces?: Array<{
        name: string
        lat?: number
        lng?: number
        category?: string
        vicinity?: string
        isCafe?: boolean
        type?: string
        [key: string]: any
    }>
    isNearbyLoading?: boolean
    placeFilter?: 'coffee' | 'all'
    onPlaceFilterChange?: (filter: 'coffee' | 'all') => void
    onLocationChange: (lat: number, lng: number, name?: string) => void
    onRadiusChange?: (newRadius: number) => void
    onNearbySearch?: (lat: number, lng: number) => void
    disabled?: boolean
}

export function InteractiveMapPicker({
    lat = 13.7563,
    lng = 100.5018,
    locationName = 'กรุงเทพมหานคร',
    radiusKm = 3,
    competitors = [],
    nearbyPlaces = [],
    isNearbyLoading = false,
    placeFilter: externalPlaceFilter,
    onPlaceFilterChange,
    onLocationChange,
    onRadiusChange,
    onNearbySearch,
    disabled = false
}: InteractiveMapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<L.Map | null>(null)
    const markersLayerRef = useRef<L.LayerGroup | null>(null)
    const mainMarkerRef = useRef<L.Marker | null>(null)
    const radiusCircleRef = useRef<L.Circle | null>(null)
    const dragPreviewCircleRef = useRef<L.Circle | null>(null)
    const dragPreviewMarkerRef = useRef<L.Marker | null>(null)

    // Filter mode state: 'coffee' = only coffee shops/cafes, 'all' = include restaurants/other venues
    const [internalFilter, setInternalFilter] = useState<'coffee' | 'all'>('coffee')
    const activeFilter = externalPlaceFilter ?? internalFilter
    const setFilter = (val: 'coffee' | 'all') => {
        setInternalFilter(val)
        onPlaceFilterChange?.(val)
    }

    // Pinned coordinates
    const [pinnedLat, setPinnedLat] = useState<number>(lat)
    const [pinnedLng, setPinnedLng] = useState<number>(lng)
    const [displayLocationName, setDisplayLocationName] = useState<string>(locationName)

    // Map panning center (when user drags map away from pinned marker)
    const [mapPanCenter, setMapPanCenter] = useState<{ lat: number; lng: number } | null>(null)

    // Drag-and-drop Pegman peg state
    const [isDraggingPegman, setIsDraggingPegman] = useState<boolean>(false)
    const [dragPreviewLatLng, setDragPreviewLatLng] = useState<{ lat: number; lng: number } | null>(null)
    const [showCtrlOverlay, setShowCtrlOverlay] = useState<boolean>(false)

    // Collapsible status bar state
    const [isBarExpanded, setIsBarExpanded] = useState<boolean>(false)

    // Search and loading states
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isLocating, setIsLocating] = useState(false)
    const [showResults, setShowResults] = useState(false)
    const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets')

    // Avoid infinite loop refs
    const prevLatRef = useRef<number>(lat)
    const prevLngRef = useRef<number>(lng)
    const pinnedLatRef = useRef<number>(lat)
    const pinnedLngRef = useRef<number>(lng)
    pinnedLatRef.current = pinnedLat
    pinnedLngRef.current = pinnedLng

    // Tile layers
    const tileLayersRef = useRef<{ [key: string]: L.TileLayer }>({})

    const [isGeocoding, setIsGeocoding] = useState<boolean>(false)

    // Reverse geocode via Nominatim (with timeout and fallback)
    const reverseGeocode = useCallback(async (targetLat: number, targetLng: number) => {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 4000)
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}&zoom=16&addressdetails=1`,
                {
                    headers: { 'Accept-Language': 'th,en', 'User-Agent': 'SmartStockMap/2.0' },
                    signal: controller.signal,
                }
            )
            clearTimeout(timeoutId)
            if (!res.ok) return null
            const data = await res.json()
            if (data?.display_name) {
                // Get clean recognizable location (Subdistrict, District, Province or landmark)
                const addr = data.address || {}
                const parts = [
                    addr.suburb || addr.neighbourhood || addr.village || addr.subdistrict,
                    addr.district || addr.city_district || addr.county,
                    addr.city || addr.province || addr.state,
                ].filter(Boolean)

                const cleanName = parts.length > 0
                    ? parts.join(', ')
                    : data.display_name.split(',').slice(0, 3).join(', ')

                return { name: cleanName, fullAddress: data.display_name }
            }
            return null
        } catch (e) {
            console.error('Reverse geocode error:', e)
            return null
        }
    }, [])

    // Update parent location only when pinned coordinates truly change
    const updateParentLocation = useCallback(
        async (newLat: number, newLng: number, customName?: string) => {
            const distanceMoved = Math.hypot(newLat - prevLatRef.current, newLng - prevLngRef.current)
            if (distanceMoved < 0.0001 && !customName) {
                return
            }
            prevLatRef.current = newLat
            prevLngRef.current = newLng

            setPinnedLat(newLat)
            setPinnedLng(newLng)

            let finalName = customName || ''

            if (!finalName) {
                setIsGeocoding(true)
                setDisplayLocationName('กำลังค้นหาชื่อทำเล...')
                const geoResult = await reverseGeocode(newLat, newLng)
                setIsGeocoding(false)
                if (geoResult?.name) {
                    finalName = geoResult.name
                } else {
                    finalName = `พิกัด ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`
                }
            }

            setDisplayLocationName(finalName)
            onLocationChange(newLat, newLng, finalName)
        },
        [onLocationChange, reverseGeocode]
    )

    // Sync from parent props (lat / lng change from external source)
    useEffect(() => {
        const dist = Math.hypot(lat - pinnedLatRef.current, lng - pinnedLngRef.current)
        if (dist > 0.0002) {
            setPinnedLat(lat)
            setPinnedLng(lng)
            setDisplayLocationName(locationName)
            prevLatRef.current = lat
            prevLngRef.current = lng
            if (mapInstanceRef.current) {
                const currentZoom = mapInstanceRef.current.getZoom()
                mapInstanceRef.current.setView([lat, lng], currentZoom, { animate: true })
            }
        }
    }, [lat, lng, locationName])

    // Initialize map ONCE
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return

        const map = L.map(mapContainerRef.current, {
            center: [pinnedLat, pinnedLng],
            zoom: 14,
            zoomControl: false,
            scrollWheelZoom: false, // Require Ctrl + Scroll (like Google Maps)
        })

        // Handle Ctrl + Scroll Wheel Zoom (Google Maps style)
        const container = mapContainerRef.current
        let overlayTimer: NodeJS.Timeout

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                if (e.deltaY < 0) {
                    map.zoomIn()
                } else if (e.deltaY > 0) {
                    map.zoomOut()
                }
                setShowCtrlOverlay(false)
            } else {
                // Show hint overlay to tell user to hold Ctrl to zoom
                setShowCtrlOverlay(true)
                clearTimeout(overlayTimer)
                overlayTimer = setTimeout(() => {
                    setShowCtrlOverlay(false)
                }, 1400)
            }
        }

        container.addEventListener('wheel', handleWheel, { passive: false })

        // Standard Street layer
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map)

        // Satellite layer
        const satLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            {
                attribution: 'Tiles &copy; Esri',
                maxZoom: 18,
            }
        )

        tileLayersRef.current = { streets: osmLayer, satellite: satLayer }

        // Layer group for dynamic items
        const markersLayer = L.layerGroup().addTo(map)
        markersLayerRef.current = markersLayer

        // Zoom control in top-right
        L.control.zoom({ position: 'topright' }).addTo(map)

        // Click anywhere on map to instantly place/move store pin
        map.on('click', async (e: L.LeafletMouseEvent) => {
            await updateParentLocation(e.latlng.lat, e.latlng.lng)
            setMapPanCenter(null)
        })

        // Track when user pans map away from pin (debounce 300ms)
        let panTimer: NodeJS.Timeout
        map.on('moveend', () => {
            clearTimeout(panTimer)
            panTimer = setTimeout(() => {
                if (!mapInstanceRef.current) return
                const center = mapInstanceRef.current.getCenter()
                const distFromPin = Math.hypot(center.lat - pinnedLatRef.current, center.lng - pinnedLngRef.current)
                // If map center is > 0.003 degrees away (~300m), show "search this area" button
                if (distFromPin > 0.003) {
                    setMapPanCenter({ lat: center.lat, lng: center.lng })
                } else {
                    setMapPanCenter(null)
                }
            }, 300)
        })

        mapInstanceRef.current = map

        return () => {
            container.removeEventListener('wheel', handleWheel)
            clearTimeout(overlayTimer)
            map.remove()
            mapInstanceRef.current = null
        }
    }, []) // Only on mount

    // Drag-over and Drop handler for the Pin onto map canvas (live radius circle preview)
    const handleMapDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'

        if (!mapInstanceRef.current || !mapContainerRef.current) return
        const rect = mapContainerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const point = L.point(x, y)
        const latlng = mapInstanceRef.current.containerPointToLatLng(point)

        // Show live circle preview at current dragged cursor position
        if (dragPreviewCircleRef.current) {
            dragPreviewCircleRef.current.setLatLng([latlng.lat, latlng.lng])
            dragPreviewCircleRef.current.setRadius(radiusKm * 1000)
        } else if (mapInstanceRef.current) {
            const previewCircle = L.circle([latlng.lat, latlng.lng], {
                color: '#DC2626',
                fillColor: '#EF4444',
                fillOpacity: 0.18,
                weight: 2.5,
                dashArray: '5, 5',
                radius: radiusKm * 1000,
            }).addTo(mapInstanceRef.current)
            dragPreviewCircleRef.current = previewCircle
        }

        setDragPreviewLatLng({ lat: latlng.lat, lng: latlng.lng })
    }

    const handleMapDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDraggingPegman(false)
        setDragPreviewLatLng(null)

        // Clean up preview circle
        if (dragPreviewCircleRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(dragPreviewCircleRef.current)
            dragPreviewCircleRef.current = null
        }

        if (!mapInstanceRef.current || !mapContainerRef.current) return

        const rect = mapContainerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Convert pixel container point to Leaflet LatLng
        const point = L.point(x, y)
        const latlng = mapInstanceRef.current.containerPointToLatLng(point)

        updateParentLocation(latlng.lat, latlng.lng)
        setMapPanCenter(null)
    }

    // Switch map tile layer
    const toggleMapType = () => {
        if (!mapInstanceRef.current) return
        const next = mapType === 'streets' ? 'satellite' : 'streets'
        setMapType(next)
        if (next === 'satellite') {
            mapInstanceRef.current.removeLayer(tileLayersRef.current.streets)
            mapInstanceRef.current.addLayer(tileLayersRef.current.satellite)
        } else {
            mapInstanceRef.current.removeLayer(tileLayersRef.current.satellite)
            mapInstanceRef.current.addLayer(tileLayersRef.current.streets)
        }
    }

    // Update main marker and radius circle (NO setView call here!)
    useEffect(() => {
        if (!mapInstanceRef.current || !markersLayerRef.current) return

        const markersLayer = markersLayerRef.current

        // 1. Main draggable marker (RED PIN)
        if (mainMarkerRef.current) {
            mainMarkerRef.current.setLatLng([pinnedLat, pinnedLng])
            // Update live tooltip on main marker
            mainMarkerRef.current.unbindTooltip()
            mainMarkerRef.current.bindTooltip(`
                <div style="font-family: inherit; font-size: 11px; font-weight: 700; color: #ffffff; background: #dc2626; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(220,38,38,0.45); border: 2px solid #ffffff; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                    <span style="width: 7px; height: 7px; border-radius: 9999px; background: #ffffff; display: inline-block;"></span>
                    <span>${displayLocationName || 'ตำแหน่งที่คุณปักหมุด'}</span>
                    <span style="background: rgba(0,0,0,0.25); padding: 1px 6px; border-radius: 9999px; font-size: 10px;">รัศมี ${radiusKm} กม.</span>
                </div>
            `, {
                permanent: true,
                direction: 'top',
                offset: [0, -42],
                className: 'leaflet-custom-main-tooltip'
            })
        } else {
            const marker = L.marker([pinnedLat, pinnedLng], {
                draggable: true,
                icon: createCustomIcon('#DC2626', 'main'),
                zIndexOffset: 1000,
            })

            marker.on('dragend', async (e: any) => {
                const position = e.target.getLatLng()
                await updateParentLocation(position.lat, position.lng)
                setMapPanCenter(null)
            })

            marker.bindTooltip(`
                <div style="font-family: inherit; font-size: 11px; font-weight: 700; color: #ffffff; background: #dc2626; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(220,38,38,0.45); border: 2px solid #ffffff; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
                    <span style="width: 7px; height: 7px; border-radius: 9999px; background: #ffffff; display: inline-block;"></span>
                    <span>${displayLocationName || 'ตำแหน่งที่คุณปักหมุด'}</span>
                    <span style="background: rgba(0,0,0,0.25); padding: 1px 6px; border-radius: 9999px; font-size: 10px;">รัศมี ${radiusKm} กม.</span>
                </div>
            `, {
                permanent: true,
                direction: 'top',
                offset: [0, -42],
                className: 'leaflet-custom-main-tooltip'
            })

            marker.bindPopup(`
                <div style="font-family: inherit; min-width: 180px; padding: 2px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 9999px; background: #DC2626;"></span>
                        <b style="color: #0f172a; font-size: 14px; font-weight: 700;">ตำแหน่งที่คุณปักหมุด</b>
                    </div>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569; line-height: 1.4;">
                        ${displayLocationName || 'พิกัดที่เลือก'}
                    </p>
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 5px 8px; font-size: 11px; color: #991b1b; font-weight: 600;">
                        รัศมีวิเคราะห์: ${radiusKm} กิโลเมตร
                    </div>
                    <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 5px;">(ลากหมุดเพื่อเปลี่ยนตำแหน่งได้)</span>
                </div>
            `)

            marker.addTo(markersLayer)
            mainMarkerRef.current = marker
        }

        // 2. Radius Circle (RED CIRCLE)
        if (radiusCircleRef.current) {
            radiusCircleRef.current.setLatLng([pinnedLat, pinnedLng])
            radiusCircleRef.current.setRadius(radiusKm * 1000)
        } else {
            const circle = L.circle([pinnedLat, pinnedLng], {
                color: '#DC2626',
                fillColor: '#EF4444',
                fillOpacity: 0.12,
                weight: 2,
                dashArray: '6, 6',
                radius: radiusKm * 1000,
            }).addTo(markersLayer)
            radiusCircleRef.current = circle
        }

        // Update popup text
        if (mainMarkerRef.current) {
            mainMarkerRef.current.setPopupContent(`
                <div style="font-family: inherit; min-width: 180px; padding: 2px;">
                    <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 9999px; background: #DC2626;"></span>
                        <b style="color: #0f172a; font-size: 14px; font-weight: 700;">ตำแหน่งที่คุณปักหมุด</b>
                    </div>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569; line-height: 1.4;">
                        ${displayLocationName || 'พิกัดที่เลือก'}
                    </p>
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 5px 8px; font-size: 11px; color: #991b1b; font-weight: 600;">
                        รัศมีวิเคราะห์: ${radiusKm} กิโลเมตร
                    </div>
                    <span style="font-size: 10px; color: #94a3b8; display: block; margin-top: 5px;">(ลากหมุดเพื่อเปลี่ยนตำแหน่งได้)</span>
                </div>
            `)
        }
    }, [pinnedLat, pinnedLng, radiusKm, displayLocationName, updateParentLocation])

    // Update competitor & nearby markers whenever they change or filter changes
    useEffect(() => {
        if (!mapInstanceRef.current || !markersLayerRef.current) return
        const markersLayer = markersLayerRef.current

        // Clear only extra markers (keep mainMarker and radiusCircle)
        markersLayer.eachLayer((layer) => {
            if (layer !== mainMarkerRef.current && layer !== radiusCircleRef.current) {
                markersLayer.removeLayer(layer)
            }
        })

        // Add competitor markers with hover tooltip and click popup (BLACK PIN)
        competitors.forEach((c) => {
            if (!c.lat || !c.lng) return
            const compMarker = L.marker([c.lat, c.lng], {
                icon: createCustomIcon('#18181B', 'competitor'),
            })
            // Hover tooltip: shows shop name instantly on hover
            compMarker.bindTooltip(`
                <div style="font-family: inherit; font-size: 12px; font-weight: 600; color: #18181b; display: flex; align-items: center; gap: 5px;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #18181b;"></span>
                    <span>${c.name}</span>
                </div>
            `, {
                direction: 'top',
                offset: [0, -28],
                className: 'leaflet-custom-tooltip'
            })

            // Click popup: shows full details
            compMarker.bindPopup(`
                <div style="font-family: inherit; min-width: 170px; padding: 2px;">
                    <div style="color: #18181b; font-size: 13px; font-weight: 700; margin-bottom: 4px;">${c.name}</div>
                    <div style="font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 3px;">
                        ${c.category ? `<div>ประเภท: ${c.category}</div>` : ''}
                        ${c.distance ? `<div>ระยะทาง: ~${c.distance}</div>` : ''}
                        ${c.rating ? `<div style="font-weight: 600; color: #b45309;">คะแนน: ${c.rating} / 5</div>` : ''}
                    </div>
                </div>
            `)
            compMarker.addTo(markersLayer)
        })

        // Filter nearby places based on activeFilter
        const visibleNearby = nearbyPlaces.filter((p) => {
            if (activeFilter === 'all') return true
            // In coffee mode, only show cafes
            return p.isCafe !== false
        })

        // Add nearby landmark markers with hover tooltip (BLACK PIN)
        visibleNearby.forEach((p) => {
            if (!p.lat || !p.lng) return
            const nearbyMarker = L.marker([p.lat, p.lng], {
                icon: createCustomIcon('#18181B', 'nearby'),
            })
            // Hover tooltip: shows place name instantly on hover
            nearbyMarker.bindTooltip(`
                <div style="font-family: inherit; font-size: 12px; font-weight: 600; color: #18181b; display: flex; align-items: center; gap: 5px;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 9999px; background: #18181b;"></span>
                    <span>${p.name}</span>
                </div>
            `, {
                direction: 'top',
                offset: [0, -28],
                className: 'leaflet-custom-tooltip'
            })

            // Click popup: shows full details
            nearbyMarker.bindPopup(`
                <div style="font-family: inherit; min-width: 170px; padding: 2px;">
                    <div style="color: #18181b; font-size: 13px; font-weight: 700; margin-bottom: 4px;">${p.name}</div>
                    <div style="font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 3px;">
                        <div>${p.category || (p.isCafe !== false ? 'ร้านกาแฟ / คาเฟ่' : 'ร้านอาหาร / สถานที่ใกล้เคียง')}</div>
                        ${p.vicinity ? `<div>${p.vicinity}</div>` : ''}
                    </div>
                </div>
            `)
            nearbyMarker.addTo(markersLayer)
        })
    }, [competitors, nearbyPlaces, activeFilter])

    // Search places with Nominatim
    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        setShowResults(true)
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchQuery + ' ประเทศไทย'
                )}&limit=5&addressdetails=1`
            )
            const data = await res.json()
            setSearchResults(data)
        } catch (error) {
            console.error('Location search failed:', error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }

    // Select search result
    const handleSelectResult = (result: any) => {
        const resultLat = parseFloat(result.lat)
        const resultLng = parseFloat(result.lon)
        const name = result.display_name.split(',')[0]

        if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([resultLat, resultLng], 15, { animate: true })
        }
        updateParentLocation(resultLat, resultLng, name)
        setShowResults(false)
        setSearchQuery(name)
        setMapPanCenter(null)
    }

    // Geolocation / GPS
    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง GPS')
            return
        }

        setIsLocating(true)
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([latitude, longitude], 15, { animate: true })
                }
                await updateParentLocation(latitude, longitude)
                setIsLocating(false)
                setMapPanCenter(null)
            },
            (err) => {
                console.error('Geolocation error:', err)
                alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้ กรุณาเปิดสิทธิ์ Location')
                setIsLocating(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    // "Search this area" button action
    const handleSearchThisArea = () => {
        if (!mapPanCenter) return
        if (onNearbySearch) {
            // Fetch nearby without moving pinned store location
            onNearbySearch(mapPanCenter.lat, mapPanCenter.lng)
        } else {
            // Fallback: move pin to center
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setView([mapPanCenter.lat, mapPanCenter.lng], 14, { animate: true })
            }
            updateParentLocation(mapPanCenter.lat, mapPanCenter.lng)
        }
        setMapPanCenter(null)
    }

    // Reset view to pinned store marker
    const handleRecenterToPin = () => {
        if (mapInstanceRef.current) {
            const currentZoom = mapInstanceRef.current.getZoom()
            mapInstanceRef.current.setView([pinnedLat, pinnedLng], currentZoom, { animate: true })
        }
        setMapPanCenter(null)
    }

    const radiusOptions = [1, 1.5, 2, 3, 5, 8]

    return (
        <div className="relative w-full rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xl bg-stone-900 select-none">
            {/* Top Bar: Search & Quick Presets */}
            <div className="absolute top-4 left-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
                <div className="flex items-center gap-2">
                    <form
                        onSubmit={handleSearch}
                        className="flex-1 relative flex items-center shadow-lg rounded-xl overflow-hidden bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-700/80"
                    >
                        <Search className="w-4 h-4 ml-3 text-stone-400 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            disabled={disabled}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => searchResults.length > 0 && setShowResults(true)}
                            placeholder="ค้นหาทำเล, ย่าน, ถนน หรือชื่อสถานที่..."
                            className="w-full px-3 py-2.5 text-sm bg-transparent border-none outline-none text-stone-800 dark:text-stone-100 placeholder-stone-400"
                        />
                        {isSearching ? (
                            <div className="mr-3 w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                            <button
                                type="submit"
                                disabled={disabled}
                                className="mr-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                            >
                                ค้นหา
                            </button>
                        )}
                    </form>

                    {/* Geolocation Button */}
                    <button
                        type="button"
                        onClick={handleCurrentLocation}
                        disabled={isLocating || disabled}
                        title="ตำแหน่งปัจจุบันของคุณ"
                        className="p-2.5 bg-white/95 dark:bg-stone-900/95 hover:bg-orange-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl shadow-lg border border-stone-200/80 dark:border-stone-700/80 backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Compass className={`w-5 h-5 text-orange-600 ${isLocating ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Map Layer Switcher */}
                    <button
                        type="button"
                        onClick={toggleMapType}
                        title="สลับมุมมองดาวเทียม / แผนที่"
                        className="p-2.5 bg-white/95 dark:bg-stone-900/95 hover:bg-orange-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 rounded-xl shadow-lg border border-stone-200/80 dark:border-stone-700/80 backdrop-blur-md transition-all active:scale-95"
                    >
                        <Layers className="w-5 h-5 text-stone-600 dark:text-stone-300" />
                    </button>
                </div>

                {/* Category Filter Pills (Coffee shop vs All places) */}
                <div className="flex items-center gap-1.5 self-start bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1 rounded-xl shadow-md border border-stone-200/80 dark:border-stone-700/80 text-xs">
                    <button
                        type="button"
                        onClick={() => setFilter('coffee')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeFilter === 'coffee'
                                ? 'bg-stone-900 text-white shadow-xs'
                                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span>เฉพาะร้านกาแฟ/คาเฟ่</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeFilter === 'all'
                                ? 'bg-stone-900 text-white shadow-xs'
                                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                        }`}
                    >
                        <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                        <span>ร้านค้าทั้งหมดรอบข้าง</span>
                    </button>
                </div>

                {/* Search Dropdown Results */}
                {showResults && searchResults.length > 0 && (
                    <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-xl shadow-2xl border border-stone-200 dark:border-stone-700 overflow-hidden max-h-60 overflow-y-auto mt-1">
                        {searchResults.map((item, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSelectResult(item)}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-orange-50 dark:hover:bg-stone-800 border-b border-stone-100 dark:border-stone-800 last:border-none flex items-start gap-2.5 transition-colors"
                            >
                                <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                                <div className="text-xs">
                                    <div className="font-semibold text-stone-800 dark:text-stone-200">
                                        {item.display_name.split(',')[0]}
                                    </div>
                                    <div className="text-[10px] text-stone-500 line-clamp-1">
                                        {item.display_name}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* DRAGGABLE MAP PIN BUTTON: Clean Map Pin Icon (Top-Right) */}
            <div className="absolute top-24 right-4 z-[1000] flex flex-col items-center gap-1.5 pointer-events-auto">
                <div
                    draggable
                    onDragStart={(e) => {
                        setIsDraggingPegman(true)
                        e.dataTransfer.setData('text/plain', 'pin')
                        e.dataTransfer.effectAllowed = 'copyMove'
                    }}
                    onDragEnd={() => {
                        setIsDraggingPegman(false)
                        setDragPreviewLatLng(null)
                        if (dragPreviewCircleRef.current && mapInstanceRef.current) {
                            mapInstanceRef.current.removeLayer(dragPreviewCircleRef.current)
                            dragPreviewCircleRef.current = null
                        }
                    }}
                    title="ลากหมุดนี้ไปปักบนแผนที่ เพื่อเลือกทำเลร้านของคุณ"
                    className="group relative flex flex-col items-center justify-center w-11 h-11 bg-rose-600 hover:bg-rose-500 active:scale-90 text-white rounded-full shadow-2xl border-2 border-white cursor-grab active:cursor-grabbing transition-all hover:shadow-rose-500/50 hover:scale-105"
                >
                    {/* Clean Map Pin Icon */}
                    <MapPin className="w-6 h-6 text-white drop-shadow-md fill-white/20" />

                    {/* Tooltip Badge */}
                    <span className="absolute -left-36 top-1.5 bg-stone-900/90 text-white text-[10px] font-medium px-2.5 py-1 rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-white/10 whitespace-nowrap">
                        ลากหมุดไปปักบนแผนที่
                    </span>
                </div>
                <span className="text-[9px] font-bold text-white bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded shadow">
                    ลากปักหมุด
                </span>
            </div>

            {/* Drop Indicator & Real-Time Radius Display while dragging pin */}
            {isDraggingPegman && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1001] pointer-events-none animate-in fade-in duration-150">
                    <div className="px-5 py-2.5 bg-stone-900/95 text-white rounded-2xl shadow-2xl border border-rose-500/80 flex items-center gap-3 backdrop-blur-md">
                        <MapPin className="w-5 h-5 text-rose-500 animate-bounce" />
                        <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>กำลังลากปักหมุดร้าน</span>
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono border border-rose-500/30">
                                    วงรัศมี {radiusKm} กม.
                                </span>
                            </div>
                            <span className="text-[11px] text-stone-300">
                                {dragPreviewLatLng
                                    ? `พิกัดเล็ง: ${dragPreviewLatLng.lat.toFixed(4)}, ${dragPreviewLatLng.lng.toFixed(4)}`
                                    : 'เลื่อนเมาส์ไปยังจุดที่ต้องการแล้วปล่อยมือ'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating "Search this area" Button (appears when user pans away from pin) */}
            {mapPanCenter && !isDraggingPegman && (
                <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-[1000] flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                        type="button"
                        onClick={handleSearchThisArea}
                        disabled={isNearbyLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold rounded-full shadow-xl border border-orange-400/50 backdrop-blur-md transition-all active:scale-95 disabled:opacity-60"
                    >
                        <Search className={`w-3.5 h-3.5 ${isNearbyLoading ? 'animate-spin' : ''}`} />
                        {isNearbyLoading ? 'กำลังค้นหาร้าน...' : 'ค้นหาร้านในบริเวณนี้'}
                    </button>
                    <button
                        type="button"
                        onClick={handleRecenterToPin}
                        title="กลับไปยังร้านของคุณ"
                        className="p-2 bg-white/90 dark:bg-stone-800/90 hover:bg-white text-stone-700 dark:text-stone-200 rounded-full shadow-xl border border-stone-200 dark:border-stone-700 transition-all active:scale-95"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Map Canvas (Droppable zone) */}
            <div
                ref={mapContainerRef}
                onDragOver={handleMapDragOver}
                onDrop={handleMapDrop}
                className="w-full h-[470px] sm:h-[520px] z-0"
                style={{ background: '#1c1917' }}
            />

            {/* Google Maps style: Hold Ctrl + Scroll to zoom overlay */}
            {showCtrlOverlay && (
                <div className="absolute inset-0 z-[1002] bg-black/60 backdrop-blur-[2px] flex items-center justify-center pointer-events-none animate-in fade-in duration-150">
                    <div className="px-5 py-2.5 rounded-xl bg-stone-900/95 border border-white/20 text-white shadow-2xl flex items-center gap-2.5 text-xs font-semibold">
                        <span className="px-2 py-0.5 rounded bg-white/20 font-mono text-amber-300 text-[11px] border border-white/20">
                            Ctrl
                        </span>
                        <span>กด Ctrl ค้างไว้พร้อมเลื่อนเมาส์ (Scroll) เพื่อซูมแผนที่</span>
                    </div>
                </div>
            )}

            {/* Sleek Floating Bottom Bar (Collapsible / Compact) */}
            <div className="absolute bottom-3 left-4 right-4 z-[1000] bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-2xl overflow-hidden transition-all duration-300 pointer-events-auto">
                {/* Main Compact Bar (Always Visible) */}
                <div className="flex items-center justify-between px-3.5 py-2.5 gap-2">
                    {/* Left: Quick Location & Radius Badge */}
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                            <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-stone-900 dark:text-white truncate max-w-[130px] sm:max-w-[220px]">
                                    {displayLocationName || 'พิกัดที่เลือก'}
                                </span>
                                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-bold rounded-full shrink-0 border border-red-200/60 dark:border-red-800/60">
                                    รัศมี {radiusKm} กม.
                                </span>
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono flex items-center gap-2">
                                <span>{pinnedLat.toFixed(4)}, {pinnedLng.toFixed(4)}</span>
                                <span className="hidden sm:inline text-stone-500">• พบร้านรอบข้าง ({competitors.length + nearbyPlaces.length})</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Quick Radius Buttons + Expand Toggle */}
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                        {onRadiusChange && (
                            <div className="hidden sm:flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl">
                                {radiusOptions.slice(0, 4).map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => onRadiusChange(r)}
                                        className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                                            radiusKm === r
                                                ? 'bg-blue-600 text-white shadow-xs'
                                                : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                                        }`}
                                    >
                                        {r}k
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Dropdown Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setIsBarExpanded(!isBarExpanded)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-medium transition-all active:scale-95"
                            title={isBarExpanded ? 'ย่อแถบ' : 'ดูรายละเอียดและเลือกรัศมีเพิ่มเติม'}
                        >
                            <Sliders className="w-3.5 h-3.5 text-stone-500" />
                            <span className="hidden sm:inline">{isBarExpanded ? 'ซ่อน' : 'ปรับรัศมี'}</span>
                            {isBarExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                                <ChevronUp className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Collapsible Expanded Details Drawer */}
                {isBarExpanded && (
                    <div className="px-3.5 pb-3.5 pt-2 border-t border-stone-100 dark:border-stone-800 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                        {/* Full Radius Picker */}
                        {onRadiusChange && (
                            <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 shrink-0 mr-1 flex items-center gap-1">
                                    <Sliders className="w-3 h-3 text-stone-400" /> รัศมีสำรวจ:
                                </span>
                                {radiusOptions.map((r) => (
                                    <button
                                        key={r}
                                        type="button"
                                        onClick={() => onRadiusChange(r)}
                                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                            radiusKm === r
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                                                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                                        }`}
                                    >
                                        {r} กิโลเมตร
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Legend Chips & Helper Info */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/60 text-[11px]">
                            <div className="flex items-center gap-2 overflow-x-auto">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 font-medium">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                                    ตำแหน่งที่คุณปักหมุด
                                </div>
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium">
                                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                                    ร้านคู่แข่ง ({competitors.length})
                                </div>
                                {nearbyPlaces.length > 0 && (
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-medium">
                                        <span className="w-2.5 h-2.5 rounded-full bg-zinc-900" />
                                        ร้านจริงรอบข้าง ({nearbyPlaces.length})
                                    </div>
                                )}
                            </div>

                            <span className="text-[10px] text-stone-400 flex items-center gap-1">
                                <Hand className="w-3 h-3 text-amber-500" />
                                ชี้เมาส์ (Hover) ที่หมุดเพื่อดูชื่อร้านได้ทันที
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default InteractiveMapPicker
