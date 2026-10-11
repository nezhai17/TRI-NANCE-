'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2,
  Network,
  Search,
  ExternalLink,
  ShieldAlert,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { VisualizationShell } from './VisualizationShell';
import { SEVERITY_COLORS } from './chart-tokens';

interface EntityProfile {
  id: string;
  name: string;
  role: 'Issuer / Subject' | 'Auditor / Assurance' | 'Lender / Creditor' | 'Regulatory Authority' | 'Counterparty';
  mentionCount: number;
  dossiers: Array<{ id: string; title: string }>;
  highestSeverity: string;
}

interface EntityRelationshipNetworkProps {
  entities: EntityProfile[];
  onSelectEntity?: (entityId: string) => void;
  selectedEntityId?: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  'Issuer / Subject': '#2563EB', // Blue
  'Auditor / Assurance': '#8B5CF6', // Purple
  'Lender / Creditor': '#059669', // Emerald
  'Regulatory Authority': '#DC2626', // Red
  'Counterparty': '#D97706', // Amber
};

export const EntityRelationshipNetwork: React.FC<EntityRelationshipNetworkProps> = ({
  entities,
  onSelectEntity,
  selectedEntityId,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);

  // Compute graph nodes and links (co-occurrences across filings)
  const { nodes, links } = useMemo(() => {
    // Take top 16 most prominent entities for a clean, legible topology
    const topEntities = entities.slice(0, 16);
    const count = topEntities.length;
    if (count === 0) return { nodes: [], links: [] };

    const width = 600;
    const height = 360;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.38;

    const nodeList = topEntities.map((ent, idx) => {
      // Position nodes in an elliptical constellation around center
      const angle = (idx / count) * 2 * Math.PI - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + (radius * 0.8) * Math.sin(angle);
      return {
        ...ent,
        x: Math.round(x),
        y: Math.round(y),
        color: ROLE_COLORS[ent.role] || '#3B82F6',
        size: Math.max(14, Math.min(26, 12 + ent.dossiers.length * 3)),
      };
    });

    const linkList: Array<{
      source: typeof nodeList[0];
      target: typeof nodeList[0];
      sharedCount: number;
    }> = [];

    // Form links between entities that share filings
    for (let i = 0; i < nodeList.length; i++) {
      for (let j = i + 1; j < nodeList.length; j++) {
        const a = nodeList[i];
        const b = nodeList[j];
        const shared = a.dossiers.filter((ad) => b.dossiers.some((bd) => bd.id === ad.id)).length;
        if (shared > 0) {
          linkList.push({ source: a, target: b, sharedCount: shared });
        }
      }
    }

    return { nodes: nodeList, links: linkList };
  }, [entities]);

  const activeId = hoveredEntityId || selectedEntityId;

  return (
    <VisualizationShell
      title="Corporate Counterparty & Regulatory Topology"
      subtitle="Interactive institutional network linking issuers, auditors, lenders, and regulators"
      badge="Network Graph"
      infoExplanation="Visualizes co-occurrence across financial dossiers. Lines represent shared disclosures. Click any node to open the entity's exposure profile."
      sourceContext={`${nodes.length} entities | ${links.length} cross-filing relationships`}
      actions={
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
            className="p-1 rounded text-slate-500 hover:text-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
            className="p-1 rounded text-slate-500 hover:text-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="p-1 rounded text-slate-500 hover:text-slate-800"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      <div className="relative h-80 w-full overflow-hidden flex items-center justify-center bg-slate-50/50 rounded-xl border border-slate-100">
        {nodes.length === 0 ? (
          <div className="text-center text-xs text-slate-400">No entities indexed yet.</div>
        ) : (
          <svg
            viewBox="0 0 600 360"
            className="w-full h-full select-none"
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease' }}
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="netGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#E2E8F0" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="600" height="360" fill="url(#netGrid)" />

            {/* Links / Edges */}
            <g className="links">
              {links.map((link, idx) => {
                const isHighlighted =
                  activeId && (link.source.id === activeId || link.target.id === activeId);
                return (
                  <line
                    key={`link-${idx}`}
                    x1={link.source.x}
                    y1={link.source.y}
                    x2={link.target.x}
                    y2={link.target.y}
                    stroke={isHighlighted ? '#4F46E5' : '#CBD5E1'}
                    strokeWidth={isHighlighted ? 2.5 : Math.min(3, 1 + link.sharedCount * 0.5)}
                    strokeOpacity={isHighlighted ? 0.9 : 0.4}
                    strokeDasharray={link.source.role === 'Regulatory Authority' ? '3 3' : undefined}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {nodes.map((node) => {
                const isSelected = selectedEntityId === node.id;
                const isHovered = hoveredEntityId === node.id;
                const isLinked =
                  activeId &&
                  links.some(
                    (l) =>
                      (l.source.id === activeId && l.target.id === node.id) ||
                      (l.target.id === activeId && l.source.id === node.id)
                  );
                const isFocused = isSelected || isHovered || isLinked;

                return (
                  <g
                    key={node.id}
                    className="cursor-pointer transition-transform"
                    onMouseEnter={() => setHoveredEntityId(node.id)}
                    onMouseLeave={() => setHoveredEntityId(null)}
                    onClick={() => onSelectEntity && onSelectEntity(node.id)}
                  >
                    {/* Focus Glow */}
                    {isFocused && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={node.size + 6}
                        fill={node.color}
                        fillOpacity={0.2}
                      />
                    )}

                    {/* Main Node Circle */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.size}
                      fill={node.color}
                      stroke={isSelected ? '#0A0F1D' : '#FFFFFF'}
                      strokeWidth={isSelected ? 3 : 2}
                      className="shadow-sm transition-all"
                    />

                    {/* Severity Pip */}
                    {node.highestSeverity === 'critical' && (
                      <circle
                        cx={node.x + node.size * 0.7}
                        cy={node.y - node.size * 0.7}
                        r={4.5}
                        fill="#DC2626"
                        stroke="#FFFFFF"
                        strokeWidth={1.5}
                      />
                    )}

                    {/* Node Label */}
                    <text
                      x={node.x}
                      y={node.y + node.size + 11}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight={isFocused ? 'bold' : 'normal'}
                      fill={isFocused ? '#0F172A' : '#475569'}
                      className="pointer-events-none tracking-tight font-sans"
                    >
                      {node.name.length > 15 ? node.name.slice(0, 13) + '..' : node.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      {/* Legend Strip */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            Issuer / Subject
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            Auditor
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Lender
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            Regulator
          </span>
        </div>
        <span className="text-slate-400 font-mono">Click node to inspect entity exposure profile</span>
      </div>
    </VisualizationShell>
  );
};
