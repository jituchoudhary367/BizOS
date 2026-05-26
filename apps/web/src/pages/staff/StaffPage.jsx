import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Check, Clock, AlertCircle, MapPin, Calendar } from 'lucide-react';
import { getInitials, formatDate, formatRelativeDate } from '../../lib/formatters';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabaseClient';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

const DEMO_STAFF = [
  { id: 's1', name: 'Ramesh Gupta', role: 'Sales Manager', phone: '+919988776655', status: 'present', checkin: '09:12', salary: 25000 },
  { id: 's2', name: 'Sita Devi', role: 'Cashier', phone: '+919977665544', status: 'present', checkin: '09:45', salary: 15000 },
  { id: 's3', name: 'Arvind Kumar', role: 'Delivery Boy', phone: '+919966554433', status: 'late', checkin: '10:30', salary: 12000 },
  { id: 's4', name: 'Priya Shah', role: 'Accounts', phone: '+919955443322', status: 'absent', checkin: null, salary: 20000 },
  { id: 's5', name: 'Mohit Singh', role: 'Warehouse', phone: '+919944332211', status: 'present', checkin: '08:55', salary: 13000 },
];

const DEMO_TASKS = [
  { id: 't1', title: 'Collect payment from Amit Traders', assignee: 'Ramesh Gupta', status: 'in_progress', priority: 'high', due: '2026-05-22' },
  { id: 't2', title: 'Deliver cement to Bodakdev site', assignee: 'Arvind Kumar', status: 'in_progress', priority: 'high', due: '2026-05-22' },
  { id: 't3', title: 'Reconcile May invoices', assignee: 'Priya Shah', status: 'todo', priority: 'medium', due: '2026-05-25' },
  { id: 't4', title: 'Count paint stock in warehouse B', assignee: 'Mohit Singh', status: 'todo', priority: 'low', due: '2026-05-23' },
  { id: 't5', title: 'Update price list for cement', assignee: 'Sita Devi', status: 'done', priority: 'medium', due: '2026-05-20' },
];

const STATUS_COLORS = {
  present: 'text-success bg-success/10',
  late: 'text-warning bg-warning/10',
  absent: 'text-danger bg-danger/10',
  half_day: 'text-warning bg-warning/10',
};

const TASK_PRIORITY = {
  high: 'badge-danger',
  medium: 'badge-warning',
  low: 'badge-neutral',
};

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [staff, setStaff] = useState(DEMO_STAFF);
  const [attendanceMap, setAttendanceMap] = useState({});

  const loadStaff = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];

    const [{ data: staffRows }, { data: attendanceRows }] = await Promise.all([
      supabase
        .from('staff_members')
        .select('id, full_name, phone, designation, department, salary, join_date, is_active, created_at')
        .eq('is_active', true)
        .order('full_name', { ascending: true }),
      supabase
        .from('attendance')
        .select('staff_id, date, check_in, check_out, status')
        .eq('date', today),
    ]);

    if (staffRows?.length) setStaff(staffRows);
    else setStaff(DEMO_STAFF);

    const nextAttendanceMap = (attendanceRows || []).reduce((acc, row) => {
      acc[row.staff_id] = row;
      return acc;
    }, {});
    setAttendanceMap(nextAttendanceMap);
  }, []);

  useRealtimeTable('staff_members', {
    queryKey: ['staff_members'],
    onInsert: loadStaff,
    onUpdate: loadStaff,
    onDelete: loadStaff,
  });

  useRealtimeTable('attendance', {
    queryKey: ['attendance'],
    onInsert: loadStaff,
    onUpdate: loadStaff,
    onDelete: loadStaff,
  });

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const liveStaff = staff.map((member) => {
    const attendance = attendanceMap[member.id];
    const status = attendance?.status || member.status || 'present';
    return {
      ...member,
      name: member.full_name || member.name,
      role: member.designation || member.role,
      checkin: attendance?.check_in ? new Date(attendance.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : member.checkin,
      status,
    };
  });

  const presentCount = liveStaff.filter((member) => member.status === 'present').length;
  const lateCount = liveStaff.filter((member) => member.status === 'late').length;
  const absentCount = liveStaff.filter((member) => member.status === 'absent').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Staff</h1>
        <button className="btn-primary text-sm"><Plus size={16} /> Add staff</button>
      </div>

      <div className="flex gap-1 mb-6 bg-surface rounded-lg p-1 w-fit border border-surface-border">
        {['attendance', 'tasks', 'payroll'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${activeTab === tab ? 'bg-brand-500 text-white' : 'text-text-tertiary hover:text-text-secondary'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'attendance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-text-secondary">Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <div className="flex gap-3 text-xs text-text-tertiary">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success" /> Present: {presentCount}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Late: {lateCount}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" /> Absent: {absentCount}</span>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStaff.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/10 text-brand-400 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{s.name}</p>
                    <p className="text-[11px] text-text-tertiary">{s.role}</p>
                  </div>
                  <span className={`badge text-[11px] capitalize ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                </div>
                {s.checkin && (
                  <p className="text-[11px] text-text-tertiary mt-3 flex items-center gap-1">
                    <Clock size={11} /> Checked in at {s.checkin} AM
                  </p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'tasks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex justify-end mb-4">
            <button className="btn-ghost text-sm"><Plus size={14} /> New task</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {['todo', 'in_progress', 'done'].map((col) => (
              <div key={col}>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">
                  {col === 'todo' ? 'To do' : col === 'in_progress' ? 'In progress' : 'Done'}
                </p>
                <div className="space-y-3">
                  {DEMO_TASKS.filter(t => t.status === col).map(task => (
                    <div key={task.id} className="card p-3">
                      <p className="text-xs text-text-primary mb-2">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <span className={`badge text-[10px] ${TASK_PRIORITY[task.priority]}`}>{task.priority}</span>
                        <span className="text-[11px] text-text-tertiary">{formatDate(task.due)}</span>
                      </div>
                      <p className="text-[11px] text-text-tertiary mt-1.5">{task.assignee}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'payroll' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5">
          <table className="data-table">
            <thead><tr><th>Staff</th><th>Role</th><th>Salary</th><th>Status</th></tr></thead>
            <tbody>
              {liveStaff.map(s => (
                <tr key={s.id}>
                  <td className="text-text-primary text-xs">{s.name}</td>
                  <td className="text-xs text-text-tertiary">{s.role}</td>
                  <td className="font-mono text-xs">₹{s.salary.toLocaleString('en-IN')}/mo</td>
                  <td><span className="badge badge-neutral text-[11px]">Pending</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
