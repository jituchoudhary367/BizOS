import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Play, Pause, AlertCircle, CheckCircle, Clock, Activity, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatRelativeDate } from '../../lib/formatters';

const AGENTS = [
  {
    id: 'a1',
    name: 'Order Intake Agent',
    description: 'Parses WhatsApp/voice messages → creates orders, confirms with customer, updates inventory.',
    status: 'active',
    mode: 'auto',
    metrics: { processed: 347, today: 12, accuracy: 97.4 },
    last_run: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: 'a2',
    name: 'Collections Agent',
    description: 'Monitors overdue invoices → sends WhatsApp reminders, escalates high-risk accounts.',
    status: 'active',
    mode: 'auto',
    metrics: { processed: 89, today: 3, accuracy: 100 },
    last_run: new Date(Date.now() - 35 * 60000).toISOString(),
  },
  {
    id: 'a3',
    name: 'Inventory Monitor',
    description: 'Tracks stock levels, triggers reorder alerts, drafts purchase orders.',
    status: 'active',
    mode: 'supervised',
    metrics: { processed: 128, today: 8, accuracy: 99.2 },
    last_run: new Date(Date.now() - 15 * 60000).toISOString(),
  },
  {
    id: 'a4',
    name: 'Invoice Generator',
    description: 'Generates GST-compliant invoices from confirmed orders. Sends PDFs via WhatsApp.',
    status: 'idle',
    mode: 'supervised',
    metrics: { processed: 212, today: 7, accuracy: 100 },
    last_run: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: 'a5',
    name: 'AI CFO Agent',
    description: 'Analyzes cashflow, profitability, identifies cost reduction opportunities. Daily reports.',
    status: 'idle',
    mode: 'supervised',
    metrics: { processed: 62, today: 1, accuracy: null },
    last_run: new Date(Date.now() - 240 * 60000).toISOString(),
  },
  {
    id: 'a6',
    name: 'Procurement Agent',
    description: 'Monitors low stock, creates POs, negotiates with suppliers, tracks deliveries.',
    status: 'idle',
    mode: 'manual',
    metrics: { processed: 18, today: 0, accuracy: null },
    last_run: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const STATUS_CONFIG = {
  active: { color: 'text-success', bg: 'bg-success/10', label: 'Running', icon: Activity },
  idle: { color: 'text-text-tertiary', bg: 'bg-surface-hover', label: 'Idle', icon: Clock },
  error: { color: 'text-danger', bg: 'bg-danger/10', label: 'Error', icon: AlertCircle },
};

const MODE_CONFIG = {
  auto: { label: 'Autopilot', class: 'badge-success' },
  supervised: { label: 'Supervised', class: 'badge-info' },
  manual: { label: 'Manual', class: 'badge-neutral' },
};

export default function AgentsPage() {
  const [agentStates, setAgentStates] = useState(
    AGENTS.reduce((acc, a) => ({ ...acc, [a.id]: a.status }), {})
  );

  const toggleAgent = (id) => {
    setAgentStates(prev => ({
      ...prev,
      [id]: prev[id] === 'active' ? 'idle' : 'active',
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Agent Control</h1>
          <p className="text-sm text-text-tertiary mt-0.5">Manage your autonomous AI agents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-success animate-ping" />
            <span className="text-xs text-success font-medium">3 agents running</span>
          </div>
        </div>
      </div>

      {/* Overview row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-text-primary font-mono">847</p>
          <p className="text-xs text-text-tertiary mt-1">Total tasks completed</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-success font-mono">31</p>
          <p className="text-xs text-text-tertiary mt-1">Tasks today</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-brand-400 font-mono">98.7%</p>
          <p className="text-xs text-text-tertiary mt-1">Overall accuracy</p>
        </div>
      </div>

      {/* Agent cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {AGENTS.map((agent) => {
          const currentStatus = agentStates[agent.id];
          const statusCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.idle;
          const StatusIcon = statusCfg.icon;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('card p-5 transition-all duration-300', currentStatus === 'active' && 'border-success/20')}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', statusCfg.bg)}>
                    <Bot size={20} className={statusCfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-text-primary">{agent.name}</p>
                      <span className={`badge text-[10px] ${MODE_CONFIG[agent.mode].class}`}>
                        {MODE_CONFIG[agent.mode].label}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary leading-relaxed">{agent.description}</p>
                  </div>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => toggleAgent(agent.id)}
                  className={cn(
                    'p-2 rounded-lg transition-all duration-200 flex-shrink-0',
                    currentStatus === 'active' ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-surface-hover text-text-tertiary hover:text-text-secondary'
                  )}
                >
                  {currentStatus === 'active' ? <Pause size={16} /> : <Play size={16} />}
                </button>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-surface-border">
                <div>
                  <p className="text-lg font-semibold font-mono text-text-primary">{agent.metrics.processed}</p>
                  <p className="text-[11px] text-text-tertiary">Total tasks</p>
                </div>
                <div>
                  <p className="text-lg font-semibold font-mono text-text-primary">{agent.metrics.today}</p>
                  <p className="text-[11px] text-text-tertiary">Today</p>
                </div>
                {agent.metrics.accuracy && (
                  <div>
                    <p className="text-lg font-semibold font-mono text-success">{agent.metrics.accuracy}%</p>
                    <p className="text-[11px] text-text-tertiary">Accuracy</p>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <StatusIcon size={12} className={statusCfg.color} />
                  <span className={cn('text-[11px] font-medium', statusCfg.color)}>{statusCfg.label}</span>
                  <span className="text-[11px] text-text-disabled ml-1">{formatRelativeDate(agent.last_run)}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
