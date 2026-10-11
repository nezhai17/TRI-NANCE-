'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Radio, RefreshCw, CheckCircle, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface AuditEvent {
  id: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const ActivityStream: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setConnected(true);
        setLastSync(new Date().toLocaleTimeString());
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Poll every 15s to keep live stream synchronized
    const interval = setInterval(fetchEvents, 15000);
    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'analysis_completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'document_uploaded':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'finding_triage_updated':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatActionTitle = (event: AuditEvent) => {
    switch (event.action) {
      case 'analysis_completed':
        return `Intelligence Dossier Generated: ${event.metadata?.title || 'Filing Analysis'}`;
      case 'document_uploaded':
        return `Vault Ingestion: ${event.metadata?.title || 'Document File'}`;
      case 'finding_triage_updated':
        return `Triage Transition: Finding marked "${event.metadata?.reviewStatus || 'updated'}"`;
      default:
        return `Audit Record: ${event.action.replace(/_/g, ' ')}`;
    }
  };

  return (
    <Card className="mt-6 border border-slate-200 shadow-xs">
      <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-navy" />
          <CardTitle className="text-sm font-semibold text-brand-navy">
            Live Intelligence Activity Stream
          </CardTitle>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span>{connected ? 'Live Sync Active' : 'Disconnected'}</span>
            <span className="text-slate-400">({lastSync})</span>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchEvents().finally(() => setLoading(false));
            }}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            title="Refresh stream"
            aria-label="Refresh activity stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {events.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            No audit activity logged yet. Submitting an analysis or uploading a document will populate this live stream.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {events.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="mt-0.5">{getActionIcon(event.action)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {formatActionTitle(event)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(event.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}{' '}
                    • Resource: {event.resourceType}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
