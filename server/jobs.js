const cron = require('node-cron');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const db = require('./db');
const emailConfig = require('./email.config');

function unsubscribeToken(email) {
  return crypto.createHmac('sha256', process.env.UNSUBSCRIBE_SECRET || 'rentinvoicestogo-unsub')
    .update(email.toLowerCase()).digest('hex');
}

function getTransporter() {
  return nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: false,
    auth: { user: emailConfig.user, pass: emailConfig.pass },
  });
}

function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function nextInvoiceNumber(userId) {
  const { rows } = await db.query('SELECT invoice_number FROM invoices WHERE user_id = $1', [userId]);
  const max = rows.reduce((m, inv) => {
    const n = parseInt(inv.invoice_number.replace(/\D/g, ''), 10);
    return isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `RENT-${String(max + 1).padStart(3, '0')}`;
}

async function runDailyJobs() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthStr = todayStr.slice(0, 7); // "2026-03"
  const dayOfMonth = today.getDate();

  console.log(`[Jobs] Running daily jobs for ${todayStr}`);

  // 1. Mark unpaid invoices past their due date as overdue, applying late fee if set
  const { rows: nowOverdue } = await db.query(
    `SELECT * FROM invoices WHERE status = 'unpaid' AND due_date < $1`,
    [todayStr]
  );

  for (const inv of nowOverdue) {
    const items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items;

    // Look up client's late fee
    const { rows: clientRows } = await db.query(
      'SELECT late_fee FROM clients WHERE user_id = $1 AND name = $2',
      [inv.user_id, inv.client_name]
    );
    const lateFee = clientRows[0]?.late_fee || 0;

    // Append late fee line if > 0 and not already present
    const alreadyHasLateFee = items.some(it => it.description === 'Late Fee');
    if (lateFee > 0 && !alreadyHasLateFee) {
      items.push({ description: 'Late Fee', quantity: 1, unit_price: lateFee, amount: lateFee });
      const newTotal = items.reduce((s, it) => s + (it.amount || 0), 0);
      await db.query(
        `UPDATE invoices SET status = 'overdue', items = $1, total = $2 WHERE id = $3`,
        [JSON.stringify(items), newTotal, inv.id]
      );
    } else {
      await db.query(`UPDATE invoices SET status = 'overdue' WHERE id = $1`, [inv.id]);
    }
  }

  if (nowOverdue.length > 0) console.log(`[Jobs] Marked ${nowOverdue.length} invoice(s) as overdue`);

  // 2. Send overdue reminders (once per invoice)
  const { rows: overdueInvoices } = await db.query(`
    SELECT i.* FROM invoices i
    WHERE i.status = 'overdue' AND i.reminder_sent_at IS NULL AND i.client_email != ''
  `);

  if (overdueInvoices.length > 0 && emailConfig.user && emailConfig.pass) {
    const transporter = getTransporter();
    for (const inv of overdueInvoices) {
      try {
        await transporter.sendMail({
          from: emailConfig.from || emailConfig.user,
          to: inv.client_email,
          subject: `Overdue: Invoice ${inv.invoice_number} — ${fmt(inv.total)} Past Due`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
              <div style="font-size:20px;font-weight:700;color:#2563eb;margin-bottom:16px;">RentInvoicesToGo</div>
              <div style="background:#fee2e2;border-radius:8px;padding:16px;margin-bottom:20px;">
                <div style="font-weight:700;color:#7f1d1d;font-size:15px;">Invoice Overdue</div>
                <div style="color:#991b1b;font-size:13px;margin-top:4px;">This invoice was due on ${inv.due_date} and has not been marked as paid.</div>
              </div>
              <p style="font-size:14px;color:#1a1d23;">Hi ${inv.client_name},</p>
              <p style="font-size:14px;color:#374151;">Invoice <strong>${inv.invoice_number}</strong> for <strong>${fmt(inv.total)}</strong> was due on <strong>${inv.due_date}</strong> and remains unpaid. Please arrange payment as soon as possible.</p>
              ${inv.notes ? `<p style="font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:12px;">${inv.notes}</p>` : ''}
              <p style="font-size:12px;color:#9ca3af;margin-top:24px;">If you believe this is an error, please contact your landlord directly.</p>
            </div>`,
        });
        await db.query('UPDATE invoices SET reminder_sent_at = NOW() WHERE id = $1', [inv.id]);
        console.log(`[Jobs] Sent overdue reminder for invoice ${inv.invoice_number} to ${inv.client_email}`);
      } catch (err) {
        console.error(`[Jobs] Failed to send reminder for invoice ${inv.id}:`, err.message);
      }
    }
  }

  // 3. Generate recurring invoices for clients whose recurring_day matches today
  const { rows: recurringClients } = await db.query(`
    SELECT c.*, u.plan FROM clients c
    JOIN users u ON u.id = c.user_id
    WHERE c.recurring_enabled = true AND c.recurring_day = $1
  `, [dayOfMonth]);

  for (const client of recurringClients) {
    try {
      // Skip if invoice for this client already exists this month
      const { rows: existing } = await db.query(
        `SELECT id FROM invoices WHERE user_id = $1 AND client_name = $2 AND date_created LIKE $3`,
        [client.user_id, client.name, `${monthStr}%`]
      );
      if (existing.length > 0) continue;

      // Enforce free tier limit
      if (client.plan === 'free') {
        const { rows } = await db.query('SELECT COUNT(*) as count FROM invoices WHERE user_id = $1', [client.user_id]);
        if (parseInt(rows[0].count) >= 5) {
          console.log(`[Jobs] Skipping recurring invoice for user ${client.user_id} — free tier limit reached`);
          continue;
        }
      }

      const invoiceNumber = await nextInvoiceNumber(client.user_id);
      const dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 30);
      const dueDateStr = dueDate.toISOString().slice(0, 10);

      const items = JSON.stringify([{
        description: 'Monthly Rent',
        quantity: 1,
        unit_price: client.monthly_rent,
        amount: client.monthly_rent,
      }]);

      await db.query(`
        INSERT INTO invoices
          (user_id, invoice_number, client_name, client_email, client_address, date_created, due_date, status, items, total, notes, property_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid', $8, $9, '', '')
      `, [client.user_id, invoiceNumber, client.name, client.email || '', client.address || '', todayStr, dueDateStr, items, client.monthly_rent]);

      console.log(`[Jobs] Created recurring invoice ${invoiceNumber} for ${client.name} (user ${client.user_id})`);

      // Email the invoice to the tenant if they have an email and haven't opted out
      if (client.email && emailConfig.user && emailConfig.pass) {
        const optout = await db.query('SELECT 1 FROM email_optouts WHERE email = $1', [client.email.toLowerCase()]);
        if (!optout.rows[0]) {
          const appUrl = process.env.APP_URL || 'http://localhost:5173';
          const unsubLink = `${appUrl}/api/unsubscribe?email=${encodeURIComponent(client.email)}&token=${unsubscribeToken(client.email)}`;
          const parsedItems = JSON.parse(items);
          const itemRows = parsedItems.map(it => `
            <tr>
              <td style="padding:10px 14px;border-bottom:1px solid #e2e5ea;font-size:13px;">${it.description || '—'}</td>
              <td style="padding:10px 14px;border-bottom:1px solid #e2e5ea;font-size:13px;text-align:right;">${it.quantity}</td>
              <td style="padding:10px 14px;border-bottom:1px solid #e2e5ea;font-size:13px;text-align:right;">${fmt(it.unit_price)}</td>
              <td style="padding:10px 14px;border-bottom:1px solid #e2e5ea;font-size:13px;text-align:right;font-weight:500;">${fmt(it.amount)}</td>
            </tr>`).join('');

          const html = `
            <div style="font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;background:#f7f8fa;padding:24px;">
              <div style="background:#fff;border:1px solid #e2e5ea;border-radius:8px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
                  <tr>
                    <td style="vertical-align:top;">
                      <span style="font-size:22px;font-weight:700;color:#2563eb;letter-spacing:-0.5px;">&#127968; RentInvoicesToGo</span>
                      <div style="font-size:20px;font-weight:700;margin-top:8px;color:#1a1d23;">${invoiceNumber}</div>
                    </td>
                    <td style="vertical-align:top;text-align:right;">
                      <span style="display:inline-block;padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;letter-spacing:0.3px;text-transform:uppercase;background:#fef3c7;color:#92400e;">unpaid</span>
                      <div style="margin-top:10px;font-size:13px;color:#6b7280;">
                        <div>Invoice Date: <strong style="color:#1a1d23;">${todayStr}</strong></div>
                        <div style="margin-top:2px;">Payment Due: <strong style="color:#1a1d23;">${dueDateStr}</strong></div>
                      </div>
                    </td>
                  </tr>
                </table>
                <div style="margin-bottom:32px;">
                  <div style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Bill To</div>
                  <div style="font-weight:600;font-size:14px;color:#1a1d23;">${client.name}</div>
                  ${client.address ? `<div style="font-size:13px;color:#6b7280;margin-top:2px;">${client.address}</div>` : ''}
                  <div style="font-size:13px;color:#6b7280;margin-top:2px;">${client.email}</div>
                </div>
                <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                  <thead>
                    <tr style="background:#f7f8fa;">
                      <th style="padding:10px 14px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid #e2e5ea;">Description</th>
                      <th style="padding:10px 14px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid #e2e5ea;">Qty</th>
                      <th style="padding:10px 14px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid #e2e5ea;">Unit Price</th>
                      <th style="padding:10px 14px;text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid #e2e5ea;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${itemRows}</tbody>
                </table>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;margin-top:16px;">
                  <div style="display:flex;gap:48px;font-size:16px;font-weight:700;border-top:2px solid #e2e5ea;padding-top:8px;">
                    <span style="color:#1a1d23;">Total Due</span>
                    <span style="color:#1a1d23;">${fmt(client.monthly_rent)}</span>
                  </div>
                </div>
              </div>
              <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e5ea;text-align:center;">
                <p style="font-size:11px;color:#9ca3af;margin:0;">
                  This invoice was sent on behalf of your landlord via RentInvoicesToGo.<br>
                  <a href="${unsubLink}" style="color:#9ca3af;">Unsubscribe</a> from future invoice emails.
                </p>
              </div>
            </div>`;

          try {
            const transporter = getTransporter();
            await transporter.sendMail({
              from: emailConfig.from || emailConfig.user,
              to: client.email,
              subject: `Rental Invoice ${invoiceNumber} — ${fmt(client.monthly_rent)} Due ${dueDateStr}`,
              html,
            });
            console.log(`[Jobs] Emailed invoice ${invoiceNumber} to ${client.email}`);
          } catch (emailErr) {
            console.error(`[Jobs] Failed to email invoice ${invoiceNumber}:`, emailErr.message);
          }
        }
      }
    } catch (err) {
      console.error(`[Jobs] Failed to create recurring invoice for client ${client.id}:`, err.message);
    }
  }
}

function startJobs() {
  // Run daily at 1:00 AM EST (6:00 AM UTC)
  cron.schedule('0 6 * * *', runDailyJobs);
  console.log('[Jobs] Daily job scheduler started');
}

module.exports = { startJobs };
