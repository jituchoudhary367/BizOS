import { useState, useEffect } from 'react';
import { MessageSquare, Repeat } from 'lucide-react';
import DataTable from '../../components/shared/DataTable';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { apiClient } from '../../lib/apiClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '../../store';

const DEMO_MESSAGES = [
  { id: 'w0001', from: '+919876543210', body: 'Need 50 bags UltraTech cement at site', received_at: new Date().toISOString(), handled: false },
  { id: 'w0002', from: '+919812345678', body: 'Send price list for plywood 18mm', received_at: new Date(Date.now() - 3600000).toISOString(), handled: false },
  { id: 'w0003', from: '+919900112233', body: 'Can you deliver 200ft PVC pipe tomorrow?', received_at: new Date(Date.now() - 7200000).toISOString(), handled: true },
];

export default function WhatsAppPage() {
  const soundEnabled = useNotificationStore(state => state.soundEnabled);
  const { isFlashing } = useRealtimeTable('whatsapp_messages', { queryKey: ['whatsapp_messages'], sound: soundEnabled });
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [selected, setSelected] = useState(null);
  const [composerText, setComposerText] = useState('');
  const [conversation, setConversation] = useState([]); // simple in-memory history for demo
  const queryClient = useQueryClient();

  const replyMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/notifications/whatsapp/send', payload),
    onSuccess: () => queryClient.invalidateQueries(['whatsapp_messages'])
  });

  const convertMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/orders', payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries(['whatsapp_messages']);
      setMessages((m) => m.map(msg => msg.id === payload._messageId ? { ...msg, handled: true } : msg));
      return {}; 
    },
    onError: () => {
      queryClient.invalidateQueries(['whatsapp_messages']);
    },
    onSettled: () => queryClient.invalidateQueries(['whatsapp_messages']),
  });

  const columns = [
    { header: 'From', accessor: 'from', render: (r) => <span className="font-mono text-xs">{r.from}</span> },
    { header: 'Message', accessor: 'body', render: (r) => <div className="text-xs text-text-primary">{r.body}</div> },
    { header: 'Received', accessor: 'received_at', render: (r) => <span className="text-[11px] text-text-tertiary">{new Date(r.received_at).toLocaleString()}</span> },
    { header: 'Actions', accessor: 'actions', render: (r) => (
      <div className="flex gap-2">
        <button
          onClick={() => {
            const text = window.prompt('Reply message');
            if (!text) return;
            replyMutation.mutate({ to: r.from, text });
          }}
          className="btn-ghost text-xs"
        >
          Reply
        </button>
        <button
          onClick={() => {
            // convert to order: simple optimistic flow
            const items = [{ product_id: null, quantity: 1, unit_price: 0 }];
            convertMutation.mutate({ customer_phone: r.from, items, _messageId: r.id });
          }}
          className="btn-primary text-xs flex items-center gap-2"
        >
          <MessageSquare size={12} /> Convert
        </button>
      </div>
    )},
  ];

  const openConversation = (msg) => {
    setSelected(msg);
    // load conversation from backend (fallback to demo)
    const load = async () => {
      try {
        const resp = await apiClient.get('/whatsapp/conversations', { phone: msg.from });
        if (resp && resp.data) {
          setConversation(resp.data);
          return;
        }
      } catch (e) {
        // ignore and fallback to demo
      }

      setConversation([
        { id: 'm1', from: msg.from, text: msg.body, ts: msg.received_at },
        { id: 'm2', from: 'me', text: 'Thanks — confirm quantity and delivery address?', ts: new Date().toISOString() },
      ]);
    };
    load();
  };

  const sendReply = () => {
    if (!selected || !composerText) return;
    replyMutation.mutate({ to: selected.from, text: composerText });
    // optimistic append to conversation
    setConversation((c) => [...c, { id: `local-${Date.now()}`, from: 'me', text: composerText, ts: new Date().toISOString() }]);
    setComposerText('');
  };

  return (
    <div className="grid lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">WhatsApp</h1>
            <p className="text-xs text-text-tertiary mt-0.5">Incoming customer messages — reply or convert to orders.</p>
          </div>
        </div>

        <div className="card p-5">
          <DataTable
            columns={columns}
            data={messages}
            searchable
            onRowClick={openConversation}
            rowClassName={(row) => (isFlashing?.(row.id) ? 'flash-update' : (row.handled ? 'opacity-60' : ''))}
          />
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="card p-4 h-full flex flex-col">
          <h3 className="text-sm font-medium text-text-primary mb-3">Conversation</h3>
          {!selected && (
            <div className="text-xs text-text-tertiary">Select a message to open the conversation and reply.</div>
          )}

          {selected && (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                {conversation.map((m) => (
                  <div key={m.id} className={`p-2 rounded-md ${m.from === 'me' ? 'bg-brand-500/10 self-end' : 'bg-surface-raised self-start'}`}>
                    <div className="text-[13px] text-text-primary">{m.text}</div>
                    <div className="text-[11px] text-text-tertiary mt-1">{new Date(m.ts).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="mt-auto">
                <textarea value={composerText} onChange={(e) => setComposerText(e.target.value)} className="input mb-2" rows={3} placeholder="Write a reply..." />
                <div className="flex gap-2">
                  <button onClick={sendReply} className="btn-primary text-sm">Send reply</button>
                  <button onClick={() => convertMutation.mutate({ customer_phone: selected.from, items: [{ product_id: null, quantity: 1, unit_price: 0 }], _messageId: selected.id })} className="btn-ghost text-sm">Convert to order</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
