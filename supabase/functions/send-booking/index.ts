import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const TO_EMAIL = Deno.env.get("TO_EMAIL") ?? "kayaalbeautylounge@gmail.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "bookings@yourdomain.com"; // ← update after domain verified
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Parse form data (sent as FormData from the website)
    const formData = await req.formData();

    const name    = (formData.get("name")    as string ?? "").trim();
    const phone   = (formData.get("phone")   as string ?? "").trim();
    const service = (formData.get("service") as string ?? "").trim();
    const date    = (formData.get("date")    as string ?? "").trim();
    const time    = (formData.get("time")    as string ?? "").trim();
    const notes   = (formData.get("notes")   as string ?? "").trim();

    // Basic validation
    if (!name || !phone || !service || !date || !time) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Format date nicely
    const formattedDate = new Date(date).toLocaleDateString("en-IN", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    // Format time nicely
    const [hours, mins] = time.split(":");
    const h = parseInt(hours);
    const formattedTime = `${h % 12 || 12}:${mins} ${h >= 12 ? "PM" : "AM"}`;

    // ── 1. Save to Supabase DB ────────────────────────────────────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: dbError } = await supabase.from("bookings").insert({
      name,
      phone,
      service,
      preferred_date: date,
      preferred_time: time,
      notes: notes || null,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Don't block the email if DB fails — still try to send
    }

    // ── 2. Send email via Resend ──────────────────────────────────────────────
    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking — Kayaal</title>
</head>
<body style="margin:0;padding:0;background:#f5f2ed;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f2ed;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fafaf8;border:1px solid #d8d4ce;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#0a0a0a;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:26px;letter-spacing:0.25em;color:#fafaf8;font-weight:400;">
                KAYAAL
              </p>
              <p style="margin:8px 0 0;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#666;">
                Beauty Lounge · Kodakara
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 8px;">
              <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#888;">
                New Reservation Enquiry
              </p>
              <h1 style="margin:0 0 32px;font-family:Georgia,serif;font-size:28px;font-weight:300;color:#0a0a0a;line-height:1.2;">
                Booking Request<br><em style="font-style:italic;">Received.</em>
              </h1>
              <div style="width:40px;height:1px;background:#d8d4ce;margin-bottom:32px;"></div>
            </td>
          </tr>

          <!-- Details -->
          <tr>
            <td style="padding:0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">

                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #e8e4de;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Client Name</p>
                    <p style="margin:0;font-size:15px;color:#0a0a0a;font-weight:400;">${name}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #e8e4de;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Phone</p>
                    <p style="margin:0;font-size:15px;color:#0a0a0a;">${phone}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #e8e4de;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Service Requested</p>
                    <p style="margin:0;font-size:15px;color:#0a0a0a;">${service}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #e8e4de;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Preferred Date</p>
                    <p style="margin:0;font-size:15px;color:#0a0a0a;">${formattedDate}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #e8e4de;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Preferred Time</p>
                    <p style="margin:0;font-size:15px;color:#0a0a0a;">${formattedTime}</p>
                  </td>
                </tr>

                ${notes ? `
                <tr>
                  <td style="padding:14px 0;border-bottom:1px solid #e8e4de;">
                    <p style="margin:0 0 4px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#888;">Notes</p>
                    <p style="margin:0;font-size:15px;color:#0a0a0a;line-height:1.6;">${notes}</p>
                  </td>
                </tr>` : ""}

              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:32px 40px;">
              <a href="https://wa.me/918714872223?text=Hi+${encodeURIComponent(name)}%2C+your+booking+at+Kayaal+is+confirmed!"
                 style="display:inline-block;background:#0a0a0a;color:#fafaf8;text-decoration:none;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 28px;">
                Confirm via WhatsApp →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f2ed;padding:24px 40px;border-top:1px solid #d8d4ce;">
              <p style="margin:0;font-size:12px;color:#888;line-height:1.7;">
                Kayaal Beauty Lounge · Kodakara, Thrissur, Kerala<br>
                +91 8714 872 223 · <a href="https://instagram.com/kayaalbeautylounge" style="color:#888;">@kayaalbeautylounge</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `Kayaal Bookings <${FROM_EMAIL}>`,
        to: [TO_EMAIL],
        reply_to: phone ? undefined : undefined, // can add client email later if collected
        subject: `New Booking — ${name} · ${service} · ${formattedDate}`,
        html: emailHtml,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.text();
      console.error("Resend error:", errBody);
      return new Response(JSON.stringify({ error: "Email delivery failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
