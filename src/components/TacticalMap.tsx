'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type {
  IncidentCategory,
  IncidentReport,
  InferenceSourceType,
  TriageSeverity,
} from '@/types/incident';

interface TacticalMapProps {
  incidents: IncidentReport[];
  selectedIncidentId: string | null;
  onSelectIncident: (id: string) => void;
}

const SEVERITY_COLORS: Record<TriageSeverity, string> = {
  CRITICAL: '#DC2626',
  HIGH: '#D97706',
  MEDIUM: '#2563EB',
  LOW: '#15803D',
};

const SOURCE_BADGE_COLORS: Record<InferenceSourceType, string> = {
  ON_DEVICE: '#15803D',
  IN_CLOUD: '#1D4ED8',
  SIMULATED: '#B45309',
};

const CATEGORY_SHORT_TAG: Record<IncidentCategory, string> = {
  MEDICAL: 'MED',
  INFRASTRUCTURE: 'INF',
  EVACUATION_SOS: 'SOS',
  LOGISTICS: 'LOG',
};

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export default function TacticalMap({
  incidents,
  selectedIncidentId,
  onSelectIncident,
}: TacticalMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-7.61, 110.39],
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    incidents.forEach((incident) => {
      const color = SEVERITY_COLORS[incident.severity];
      const sourceColor = SOURCE_BADGE_COLORS[incident.inferenceSource];
      const isSelected = incident.id === selectedIncidentId;
      const tag = CATEGORY_SHORT_TAG[incident.category];

      const markerIcon = L.divIcon({
        className: 'resqpulse-marker-wrapper',
        html: `<div style="
          display:inline-flex;
          align-items:center;
          gap:4px;
          padding:4px 8px;
          border-radius:6px;
          background:${isSelected ? '#0F172A' : '#FFFFFF'};
          color:${isSelected ? '#FFFFFF' : '#0F172A'};
          border:2px solid ${color};
          font-family:monospace;
          font-size:11px;
          font-weight:700;
          box-shadow:0 2px 6px rgba(15,23,42,0.25);
          white-space:nowrap;
        ">
          <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${color};"></span>
          <span>${tag} ${incident.urgencyScore}/10</span>
        </div>`,
        iconSize: [88, 28],
        iconAnchor: [44, 14],
      });

      const marker = L.marker([incident.latitude, incident.longitude], {
        icon: markerIcon,
      });

      const safeSummary = escapeHtml(incident.structuredSummary);
      const safeSector = escapeHtml(incident.sectorName);
      const safeSource = escapeHtml(incident.inferenceSource);
      const safeRoad = escapeHtml(incident.accessRoadStatus);

      marker.bindPopup(
        `<div style="min-width:210px;font-family:sans-serif;line-height:1.4;">
          <div style="font-size:11px;font-weight:700;color:${color};margin-bottom:2px;">
            ${escapeHtml(incident.category)} | ${escapeHtml(incident.severity)}
          </div>
          <div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:4px;">
            ${safeSector}
          </div>
          <div style="font-size:12px;color:#334155;margin-bottom:6px;">
            ${safeSummary}
          </div>
          <div style="font-size:11px;color:#475569;font-family:monospace;">
            Road: ${safeRoad} | <span style="color:${sourceColor};font-weight:700;">${safeSource}</span>
          </div>
        </div>`
      );

      marker.on('click', () => {
        onSelectIncident(incident.id);
      });

      marker.addTo(layerGroup);

      if (isSelected) {
        map.panTo([incident.latitude, incident.longitude], { animate: true });
      }
    });
  }, [incidents, selectedIncidentId, onSelectIncident]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <div
        ref={containerRef}
        className="h-[290px] w-full"
        role="region"
        aria-label="Mount Merapi tactical crisis map"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
        <span className="font-semibold">Tactical Corridor Map (Merapi - Central Java)</span>
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" /> Critical
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]" /> High
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" /> Medium
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#15803D]" /> Low
          </span>
        </div>
      </div>
    </div>
  );
}
