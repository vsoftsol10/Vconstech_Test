import express from 'express';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { sendEmail } from '../utils/mailer.js';
import { generatePassword } from '../utils/generatePassword.js';
import { processPricingPurchaseSuccess } from '../services/subscriptionSyncService.js';

const router = express.Router();

// ⚠️ IMPORTANT: uses express.raw() — must be registered BEFORE express.json() in server.js
router.post(
  '/razorpay',
  express.raw({ type: 'application/json' }),
  async (req, res) => {

    // ── 1. Verify Razorpay signature ─────────────────────────────────────────
    const signature = req.headers['x-razorpay-signature'];

    if (!signature) {
      console.error('[Webhook] ❌ No signature header');
      return res.status(400).json({ error: 'Missing signature' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body)
      .digest('hex');

    if (signature !== expected) {
      console.error('[Webhook] ❌ Invalid signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // ── 2. Parse and filter event ─────────────────────────────────────────────
    let payload;
    try {
      payload = JSON.parse(req.body.toString());
    } catch {
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }

    if (payload.event !== 'payment.captured') {
      console.log(`[Webhook] ⏭️ Ignored event: ${payload.event}`);
      return res.status(200).json({ status: 'ignored' });
    }

    // ── 3. Extract customer data from notes ───────────────────────────────────
    const payment = payload.payload.payment.entity;
    const notes   = payment.notes || {};

    const name          = notes.name        || 'Unknown';
    const email         = payment.email     || notes.email || '';
    const phoneNumber   = payment.contact   || notes.phone || '';
    const companyName   = notes.companyName || 'Unknown Company';
    const city          = notes.city        || 'Unknown';
    const address       = notes.address     || 'Unknown';
    const userPackage   = notes.package     || 'Basic';
    const customMembers = notes.customMembers || null;
    const userId        = notes.userId || null;
    const customerId    = notes.customerId || null;
    const crmCustomerId = notes.crmCustomerId || null;
    const erpCustomerId = notes.erpCustomerId || null;
    const purchaseFlow  = notes.purchaseFlow || null;
    const hasExistingErpReference = Boolean(userId || customerId || crmCustomerId || erpCustomerId);
    const paymentId     = payment.id;
    const orderId       = payment.order_id || null;
    const amount        = payment.amount / 100; // paise → rupees

    console.log(`[Webhook] ✅ Payment captured: ${paymentId} | ${email} | ₹${amount}`);

    // ── 4. Prevent duplicate processing ──────────────────────────────────────
    const alreadyProcessed = await prisma.paymentNotification.findUnique({
      where: { paymentId },
    });

    if (alreadyProcessed) {
      console.log(`[Webhook] ⚠️ Already processed: ${paymentId}`);
      return res.status(200).json({ status: 'already processed' });
    }

    if (hasExistingErpReference) {
      let activationResult;
      try {
        activationResult = await processPricingPurchaseSuccess({
          purchaseFlow,
          userId,
          customerId,
          crmCustomerId,
          erpCustomerId,
          email,
          plan: userPackage,
          name,
          companyName,
          phone: phoneNumber,
          paymentId,
          orderId
        });
      } catch (err) {
        console.error('[Webhook] Existing ERP subscription activation failed:', err.message);
        return res.status(err.statusCode || 500).json({
          error: err.message,
          details: err.details
        });
      }

      try {
        await prisma.paymentNotification.create({
          data: {
            title: 'Subscription activated via payment',
            message: `${name} from ${companyName} paid Rs ${amount} and the existing ERP account was activated with ${userPackage} plan.`,
            customerName: name,
            customerEmail: email,
            companyName,
            plan: userPackage,
            amount,
            paymentId,
          },
        });
      } catch (err) {
        console.error('[Webhook] Failed to save payment notification:', err.message);
      }

      console.log(`[Webhook] Existing ERP subscription handled for payment ${paymentId}`);
      return res.status(200).json({
        status: 'ok',
        activation: activationResult.status,
        userId: activationResult.user?.userId
      });
    }

    // ── 5. Check if user already exists ──────────────────────────────────────
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log(`[Webhook] ⚠️ User already exists: ${email}`);
      return res.status(200).json({ status: 'user already exists' });
    }

    // ── 6. Generate a plain-text password ────────────────────────────────────
    const plainPassword = generatePassword();

    // ── 7. Call your existing /api/superadmin/create-user internally ──────────
    let createResult;
    try {
      const createRes = await fetch('http://localhost:5001/api/superadmin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password:     plainPassword,
          phoneNumber,
          companyName,
          city,
          address,
          package:      userPackage,
          customMembers: customMembers ? parseInt(customMembers) : undefined,
          role:         'Admin', // first user of the company gets Admin role
        }),
      });

      createResult = await createRes.json();

      if (!createResult.success) {
        console.error('[Webhook] ❌ Create user failed:', createResult.error);
        return res.status(500).json({ error: createResult.error });
      }

      console.log(`[Webhook] ✅ User created in ERP: ${email}`);

    } catch (err) {
      console.error('[Webhook] ❌ Internal fetch error:', err.message);
      return res.status(500).json({ error: 'Failed to create user in ERP' });
    }

    // ── 8. Save PaymentNotification to DB (SuperAdmin dashboard bell) ─────────
    try {
      await prisma.paymentNotification.create({
        data: {
          title:         'New user registered via payment',
          message:       `${name} from ${companyName} paid ₹${amount} and was auto-registered with ${userPackage} plan.`,
          customerName:  name,
          customerEmail: email,
          companyName,
          plan:          userPackage,
          amount,
          paymentId,
        },
      });
    } catch (err) {
      console.error('[Webhook] ❌ Failed to save payment notification:', err.message);
    }

    // ── 9. Email SuperAdmin ───────────────────────────────────────────────────
    await sendEmail({
      to:      process.env.SUPERADMIN_EMAIL,
      subject: `New user registered — ${name} (${companyName})`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#1a1a1a">New user auto-registered after payment</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr style="background:#f9f9f9">
              <td style="padding:10px 14px;color:#666;width:40%">Name</td>
              <td style="padding:10px 14px;font-weight:500">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#666">Email</td>
              <td style="padding:10px 14px">${email}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px 14px;color:#666">Phone</td>
              <td style="padding:10px 14px">${phoneNumber}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#666">Company</td>
              <td style="padding:10px 14px">${companyName}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px 14px;color:#666">Plan</td>
              <td style="padding:10px 14px">${userPackage}${customMembers ? ` (${customMembers} members)` : ''}</td>
            </tr>
            <tr>
              <td style="padding:10px 14px;color:#666">Amount paid</td>
              <td style="padding:10px 14px;font-weight:500">₹${amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr style="background:#f9f9f9">
              <td style="padding:10px 14px;color:#666">Payment ID</td>
              <td style="padding:10px 14px;font-size:12px">${paymentId}</td>
            </tr>
          </table>
          <p style="margin-top:20px;font-size:13px;color:#888">
            User has been auto-created in the ERP with Admin role. No action needed.
          </p>
        </div>
      `,
    });

    // ── 10. Email customer their login credentials ─────────────────────────────
    await sendEmail({
      to:      email,
      subject: 'Welcome to Vconstech ERP — Your account is ready',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#1a1a1a">Welcome to Vconstech, ${name}!</h2>
          <p style="color:#444">Your payment was successful and your ERP account has been created.</p>

          <div style="background:#fff8e1;border:1px solid #ffbe01;border-radius:10px;padding:20px;margin:20px 0">
            <p style="margin:0 0 10px;font-size:14px;color:#666">Your login details:</p>
            <p style="margin:6px 0;font-size:14px"><strong>URL:</strong> <a href="http://localhost:5001">http://localhost:5001</a></p>
            <p style="margin:6px 0;font-size:14px"><strong>Email:</strong> ${email}</p>
            <p style="margin:6px 0;font-size:14px"><strong>Password:</strong>
              <code style="background:#ffef99;padding:3px 8px;border-radius:4px;font-size:13px">${plainPassword}</code>
            </p>
          </div>

          <p style="color:#888;font-size:13px">Please change your password after your first login.</p>
           <p style="color:#888;font-size:13px">Plan: <strong>${userPackage}</strong>${customMembers ? ` | Members: ${customMembers}` : ''}</p>
        </div>
      `,
    });

    console.log(`[Webhook] ✅ All done for payment ${paymentId}`);
    return res.status(200).json({ status: 'ok' });
  }
);

export default router;
