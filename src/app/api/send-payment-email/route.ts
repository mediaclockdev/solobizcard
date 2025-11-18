import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { clientEmail, adminEmail, userName, month, year } = await req.json();

    if (!clientEmail || !adminEmail || !userName || !month || !year) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Configure transporter (same as your working API)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Email to client
    await transporter.sendMail({
      from: `"Your App Name" <${process.env.SMTP_USER}>`,
      to: clientEmail,
      subject: "🎉 Payment Confirmation",
      html: `
        <div style="font-family: Arial; color: #333;">
          <h3>Congratulations ${userName}!</h3>
          <p>Your payment for <strong>${month} ${year}</strong> has been successfully processed.</p>
        </div>
      `,
    });

    // Email to admin
    await transporter.sendMail({
      from: `"Your App Name" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: "📩 Client Payment Notification",
      html: `
        <div style="font-family: Arial; color: #333;">
          <h3>Payment Received</h3>
          <p>Client <strong>${userName}</strong> completed payment for <strong>${month} ${year}</strong>.</p>
        </div>
      `,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Email error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: error }),
      { status: 500 }
    );
  }
}
