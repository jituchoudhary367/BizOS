const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const withBusiness = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  const { data: profile } = await supabase.from('profiles').select('business_id, role').eq('id', user.id).single();
  req.user = user;
  req.businessId = profile?.business_id;
  req.userRole = profile?.role;
  next();
};

// POST /attendance/checkin
app.post('/attendance/checkin', withBusiness, async (req, res) => {
  try {
    const { location } = req.body;
    const checkin = {
      business_id: req.businessId,
      staff_id: req.user.id,
      checkin_at: new Date().toISOString(),
      location: location || null,
    };
    const { data, error } = await supabase.from('attendance').insert(checkin).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /attendance/checkout
app.post('/attendance/checkout', withBusiness, async (req, res) => {
  try {
    const { location } = req.body;
    // Find latest checkin without checkout
    const { data: last } = await supabase.from('attendance').select('*').eq('staff_id', req.user.id).eq('business_id', req.businessId).order('checkin_at', { ascending: false }).limit(1).single();
    if (!last) return res.status(404).json({ error: 'No checkin found' });
    const { data, error } = await supabase.from('attendance').update({ checkout_at: new Date().toISOString(), checkout_location: location || null }).eq('id', last.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /attendance
app.get('/attendance', withBusiness, async (req, res) => {
  try {
    const { staff_id, month } = req.query;
    let query = supabase.from('attendance').select('*').eq('business_id', req.businessId).order('checkin_at', { ascending: false });
    if (staff_id) query = query.eq('staff_id', staff_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /tasks
app.post('/tasks', withBusiness, async (req, res) => {
  try {
    const { title, description, assignee_id, due_date } = req.body;
    const { data, error } = await supabase.from('tasks').insert({ business_id: req.businessId, title, description, assignee_id, due_date, status: 'open' }).select().single();
    if (error) throw error;
    // Create notification
    await supabase.from('notifications').insert({ business_id: req.businessId, type: 'task', recipient_id: assignee_id, payload: JSON.stringify({ task_id: data.id, title }), created_at: new Date().toISOString() });
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /tasks/:id/status
app.patch('/tasks/:id/status', withBusiness, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['open', 'in_progress', 'done', 'overdue'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const { data, error } = await supabase.from('tasks').update({ status }).eq('id', req.params.id).eq('business_id', req.businessId).select().single();
    if (error) throw error;
    // Notify assignee
    await supabase.from('notifications').insert({ business_id: req.businessId, type: 'task_update', recipient_id: data.assignee_id, payload: JSON.stringify({ task_id: data.id, status }), created_at: new Date().toISOString() });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// basic health
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'BizOS Staff Service' }));

const PORT = process.env.STAFF_PORT || 3004;
app.listen(PORT, () => console.log(`👥 Staff Service running on port ${PORT}`));
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../../.env' });

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Middleware: extract business context ──────────────────
const withBusiness = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id, role')
    .eq('id', user.id)
    .single();

  req.user = user;
  req.businessId = profile?.business_id;
  req.userRole = profile?.role;
  next();
};

// ═══════════════════════════════════════════════════════════
//  STAFF MEMBERS CRUD
// ═══════════════════════════════════════════════════════════

// ─── GET /staff ───────────────────────────────────────────
app.get('/staff', withBusiness, async (req, res) => {
  try {
    const { department, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('staff_members')
      .select('*', { count: 'exact' })
      .eq('business_id', req.businessId)
      .eq('is_active', true)
      .order('full_name')
      .range(offset, offset + limit - 1);

    if (department) query = query.eq('department', department);
    if (search) query = query.ilike('full_name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /staff/:id ───────────────────────────────────────
app.get('/staff/:id', withBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff_members')
      .select('*, attendance(date, check_in, check_out, status)')
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Staff member not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /staff ──────────────────────────────────────────
app.post('/staff', withBusiness, async (req, res) => {
  try {
    const { full_name, phone, designation, department, salary, join_date } = req.body;

    const { data, error } = await supabase
      .from('staff_members')
      .insert({
        business_id: req.businessId,
        full_name,
        phone,
        designation,
        department,
        salary: salary || 0,
        join_date: join_date || new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /staff/:id ─────────────────────────────────────
app.patch('/staff/:id', withBusiness, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff_members')
      .update(req.body)
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  ATTENDANCE
// ═══════════════════════════════════════════════════════════

// ─── POST /attendance/checkin ─────────────────────────────
app.post('/attendance/checkin', withBusiness, async (req, res) => {
  try {
    const { staff_id, location_lat, location_lng } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    // Check if already checked in today
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('staff_id', staff_id)
      .eq('date', today)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    // Determine if late (after 9:30 AM IST)
    const istHour = new Date().getUTCHours() + 5;
    const istMin = new Date().getUTCMinutes() + 30;
    const totalMinutes = (istHour * 60 + istMin) % (24 * 60);
    const isLate = totalMinutes > 9 * 60 + 30;

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        business_id: req.businessId,
        staff_id,
        date: today,
        check_in: now,
        status: isLate ? 'late' : 'present',
        location_lat,
        location_lng,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /attendance/checkout ────────────────────────────
app.post('/attendance/checkout', withBusiness, async (req, res) => {
  try {
    const { staff_id, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('staff_id', staff_id)
      .eq('date', today)
      .single();

    if (!existing) {
      return res.status(400).json({ error: 'No check-in found for today' });
    }

    // Detect half day (less than 4 hours)
    const checkIn = new Date(existing.check_in);
    const checkOut = new Date(now);
    const hoursWorked = (checkOut - checkIn) / (1000 * 60 * 60);
    const status = hoursWorked < 4 ? 'half_day' : existing.status;

    const { data, error } = await supabase
      .from('attendance')
      .update({ check_out: now, status, notes })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /attendance ──────────────────────────────────────
app.get('/attendance', withBusiness, async (req, res) => {
  try {
    const { staff_id, month, year } = req.query;
    const m = month || new Date().getMonth() + 1;
    const y = year || new Date().getFullYear();
    const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
    const endDate = `${y}-${String(m).padStart(2, '0')}-31`;

    let query = supabase
      .from('attendance')
      .select('*, staff_members(full_name, designation)')
      .eq('business_id', req.businessId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (staff_id) query = query.eq('staff_id', staff_id);

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate stats
    const stats = {
      total_days: data.length,
      present: data.filter(a => a.status === 'present').length,
      late: data.filter(a => a.status === 'late').length,
      absent: data.filter(a => a.status === 'absent').length,
      half_day: data.filter(a => a.status === 'half_day').length,
    };

    res.json({ data, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  TASKS
// ═══════════════════════════════════════════════════════════

// ─── GET /tasks ───────────────────────────────────────────
app.get('/tasks', withBusiness, async (req, res) => {
  try {
    const { status, assigned_to, priority, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('tasks')
      .select('*, staff_members!tasks_assigned_to_fkey(full_name)', { count: 'exact' })
      .eq('business_id', req.businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (priority) query = query.eq('priority', priority);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── POST /tasks ──────────────────────────────────────────
app.post('/tasks', withBusiness, async (req, res) => {
  try {
    const { title, description, assigned_to, priority = 'medium', due_date } = req.body;

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        business_id: req.businessId,
        title,
        description,
        assigned_to,
        assigned_by: req.user.id,
        priority,
        due_date,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify assigned staff
    if (assigned_to) {
      const { data: staff } = await supabase
        .from('staff_members')
        .select('profile_id')
        .eq('id', assigned_to)
        .single();

      if (staff?.profile_id) {
        await supabase.from('notifications').insert({
          business_id: req.businessId,
          profile_id: staff.profile_id,
          title: `New task: ${title}`,
          body: description || 'A new task has been assigned to you.',
          type: 'action',
          action_url: '/app/staff',
        });
      }
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── PATCH /tasks/:id/status ──────────────────────────────
app.patch('/tasks/:id/status', withBusiness, async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['todo', 'in_progress', 'done', 'overdue'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const updateData = { status };
    if (status === 'done') updateData.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('business_id', req.businessId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /stats ───────────────────────────────────────────
app.get('/stats', withBusiness, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [staffCount, todayAttendance, pendingTasks] = await Promise.all([
      supabase.from('staff_members').select('*', { count: 'exact', head: true })
        .eq('business_id', req.businessId).eq('is_active', true),
      supabase.from('attendance').select('status')
        .eq('business_id', req.businessId).eq('date', today),
      supabase.from('tasks').select('*', { count: 'exact', head: true })
        .eq('business_id', req.businessId).in('status', ['todo', 'in_progress']),
    ]);

    const present = (todayAttendance.data || []).filter(a => ['present', 'late'].includes(a.status)).length;

    res.json({
      total_staff: staffCount.count || 0,
      present_today: present,
      absent_today: (staffCount.count || 0) - present,
      pending_tasks: pendingTasks.count || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'BizOS Staff Service' });
});

const PORT = process.env.STAFF_PORT || 3004;
app.listen(PORT, () => console.log(`👥 Staff Service running on port ${PORT}`));
