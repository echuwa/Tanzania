const { Op } = require('sequelize');
const { BroadcastJob } = require('../models');
const whatsappService = require('./whatsappService');
const smsService = require('./smsService');

let isProcessing = false;

/**
 * Delay helper
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processes a single job
 * Strategy: Try WhatsApp first → if error 131030 (not in recipient list), fallback to SMS
 */
async function processJob(job) {
  console.log(`[JobProcessor] ⏳ Starting job ${job.id} of type "${job.job_type}"`);
  
  if (job.status === 'pending') {
    job.status = 'processing';
    await job.save();
  }

  const recipients = job.recipients;
  const startIndex = job.last_processed_index + 1;

  for (let i = startIndex; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    // Safety check in case of malformed data
    if (!recipient || !recipient.phone_number || !recipient.message) {
      console.warn(`[JobProcessor] ⚠️ Skipping malformed recipient at index ${i} for job ${job.id}`);
      job.last_processed_index = i;
      await job.save();
      continue;
    }

    let sent = false;

    // ── Try WhatsApp first ───────────────────────────────────────
    try {
      const waResult = await whatsappService.sendWhatsAppMessage(
        recipient.phone_number,
        recipient.message,
        job.job_type
      );

      if (waResult.success) {
        console.log(`[JobProcessor] ✅ WhatsApp delivered to ${recipient.phone_number}`);
        job.sent_count += 1;
        sent = true;
      } else {
        const errCode = String(waResult.error?.code || '');
        // Error 131030 = "Recipient not in allowed list" (test mode restriction)
        // Fallback to SMS in this case
        if (errCode === '131030') {
          console.warn(`[JobProcessor] ⚠️ WhatsApp 131030 for ${recipient.phone_number} — falling back to SMS`);
        } else {
          console.error(`[JobProcessor] ❌ WhatsApp failed (code ${errCode}) for ${recipient.phone_number} — no SMS fallback for this error`);
          job.failed_count += 1;
        }
      }
    } catch (err) {
      console.error(`[JobProcessor] ❌ WhatsApp error for ${recipient.phone_number}:`, err.message);
    }

    // ── SMS Fallback (only if WhatsApp was not delivered) ────────
    if (!sent) {
      try {
        console.log(`[JobProcessor] 📱 Attempting SMS fallback for ${recipient.phone_number}`);
        const smsResult = await smsService.sendSMS(
          recipient.phone_number,
          // Strip WhatsApp markdown formatting for plain SMS
          recipient.message.replace(/\*/g, '').replace(/_/g, '')
        );

        if (smsResult.success && !smsResult.mock) {
          console.log(`[JobProcessor] ✅ SMS fallback delivered to ${recipient.phone_number}`);
          job.sent_count += 1;
          sent = true;
        } else if (smsResult.mock) {
          console.log(`[JobProcessor] 📱 SMS running in MOCK mode for ${recipient.phone_number} — counted as sent`);
          job.sent_count += 1;
          sent = true;
        } else {
          console.error(`[JobProcessor] ❌ SMS fallback also failed for ${recipient.phone_number}`);
          job.failed_count += 1;
        }
      } catch (smsErr) {
        console.error(`[JobProcessor] ❌ SMS fallback error for ${recipient.phone_number}:`, smsErr.message);
        job.failed_count += 1;
      }
    }

    job.last_processed_index = i;
    await job.save();

    // 600ms delay between messages to stay safe under rate-limiting
    await delay(600);
  }

  job.status = 'completed';
  await job.save();
  console.log(`[JobProcessor] ✅ Job ${job.id} completed. Sent: ${job.sent_count}, Failed: ${job.failed_count}`);
}

/**
 * Main queue runner loop
 */
async function runQueue() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (true) {
      // Find oldest pending or processing job
      const nextJob = await BroadcastJob.findOne({
        where: {
          status: { [Op.in]: ['pending', 'processing'] }
        },
        order: [['createdAt', 'ASC']]
      });

      if (!nextJob) {
        break; // No more jobs to process
      }

      try {
        await processJob(nextJob);
      } catch (jobErr) {
        console.error(`[JobProcessor] ❌ Error processing job ${nextJob.id}:`, jobErr.message);
        nextJob.status = 'failed';
        await nextJob.save();
      }
    }
  } catch (queueErr) {
    console.error('[JobProcessor] ❌ General queue processor error:', queueErr.message);
  } finally {
    isProcessing = false;
  }
}

/**
 * Initialize / Resume processor on boot
 */
function startJobProcessor() {
  console.log('[JobProcessor] 🚀 Initializing Background Job Processor...');
  // Run asynchronously without blocking boot
  runQueue().catch(err => console.error('[JobProcessor] Boot run failed:', err.message));
}

/**
 * Enqueue a new broadcast/reminder job
 */
async function enqueueJob(message, recipients, jobType = 'broadcast') {
  const newJob = await BroadcastJob.create({
    message,
    status: 'pending',
    job_type: jobType,
    recipients,
    sent_count: 0,
    failed_count: 0,
    last_processed_index: -1
  });

  console.log(`[JobProcessor] 📥 Enqueued new job ${newJob.id} with ${recipients.length} recipients`);
  
  // Trigger processor run
  runQueue().catch(err => console.error('[JobProcessor] Queue run failed:', err.message));

  return newJob;
}

module.exports = {
  startJobProcessor,
  enqueueJob
};
