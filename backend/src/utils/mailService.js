import sgMail from "@sendgrid/mail";
import { SENDGRID_API_KEY, EMAIL_FROM, EMAIL_ENABLED } from "../configs/env.js";

sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = async ({ to, subject, text, html }) => {
    if (!EMAIL_ENABLED) {
        console.log("📧 [EMAIL DISABLED]");
        console.log({ to, subject });
        return;
    }
    try {
        await sgMail.send({
            to,
            from: {
                email: EMAIL_FROM,
                name: "CrowdSense"
            },
            subject,
            text,
            html,
        });
        console.log("✅ Email sent to:", to);
    } catch (error) {
        console.error("❌ Email error:", error.response?.body || error.message);
        throw error;
    }
};

export const sendSignUpEmail = async ({ to, name }) => {
    const subject = "Welcome to CrowdSense 🚀";

    const text = `Hi ${name},

Welcome to CrowdSense!

We're excited to have you onboard. You can now start reporting issues, exploring your area, and contributing to a smarter city.

If you have any questions, feel free to reach out.

Best regards,  
Team CrowdSense`;

    const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px;">
      
      <h2 style="color: #2c3e50; margin-bottom: 10px;">
        Welcome to CrowdSense 🚀
      </h2>
      
      <p style="font-size: 16px; color: #333;">
        Hi <strong>${name}</strong>,
      </p>

      <p style="font-size: 15px; color: #555;">
        We're excited to have you onboard! 🎉  
        CrowdSense helps you report and track real-world issues like illegal dumping and road damage—making your city smarter and cleaner.
      </p>

      <div style="margin: 25px 0; text-align: center;">
        <a href="#" 
           style="background-color: #2563eb; color: #ffffff; padding: 12px 20px; 
                  text-decoration: none; border-radius: 6px; font-weight: bold;">
          Get Started
        </a>
      </div>

      <p style="font-size: 14px; color: #666;">
        If you have any questions, just reply to this email—we're here to help.
      </p>

      <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;" />

      <p style="font-size: 13px; color: #999; text-align: center;">
        © ${new Date().getFullYear()} CrowdSense  
        <br/>
        Building smarter communities 🌍
      </p>

    </div>
  </div>
  `;

    await sendEmail({ to, subject, text, html });
};

export const sendStatusUpdateEmail = async ({
    to,
    username,
    reportId,
    description,
    previousStatus,
    newStatus,
    remark,
    location,
    updatedBy,
    updatedAt
}) => {
    const reportLink = `http://localhost:5173/reports/${reportId}`;

    const subject = `Update on Your Report #${reportId}`;

    const text = `Hi ${username},

Your reported issue has been updated.

Report ID: ${reportId}
Description: ${description}
Location: ${location}

Previous Status: ${previousStatus}
New Status: ${newStatus}

Remark: ${remark || "No additional remarks"}

Updated By: ${updatedBy}
Updated At: ${updatedAt}

View Report: ${reportLink}

Thank you for contributing to CrowdSense.

- Team CrowdSense`;

    const html = `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    <div style="max-width:600px; margin:auto; background:#ffffff; padding:25px; border-radius:10px;">
      
      <h2 style="color:#2c3e50;">📢 Report Status Update</h2>

      <p>Hi <strong>${username}</strong>,</p>

      <p>Your reported issue has been updated. Here are the latest details:</p>

      <div style="background:#f9fafb; padding:15px; border-radius:8px; margin:15px 0;">
        <p><strong>Report ID:</strong> ${reportId}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Location:</strong> ${location}</p>
      </div>

      <table style="width:100%; border-collapse: collapse; margin:15px 0;">
        <tr>
          <td style="padding:8px;"><strong>Previous Status</strong></td>
          <td style="padding:8px; color:#e67e22;">${previousStatus}</td>
        </tr>
        <tr>
          <td style="padding:8px;"><strong>New Status</strong></td>
          <td style="padding:8px; color:#27ae60;">${newStatus}</td>
        </tr>
      </table>

      <p><strong>Remark:</strong> ${remark || "No additional remarks"}</p>

      <div style="text-align:center; margin:25px 0;">
        <a href="${reportLink}" 
           style="background:#2563eb; color:#fff; padding:12px 20px; 
                  text-decoration:none; border-radius:6px; font-weight:bold;">
          View Full Report
        </a>
      </div>

      <hr style="margin:20px 0;" />

      <p style="font-size:14px; color:#555;">
        <strong>Updated By:</strong> ${updatedBy}<br/>
        <strong>Updated At:</strong> ${updatedAt}
      </p>

      <p style="font-size:14px; color:#666;">
        Thank you for helping improve your community 🌍
      </p>

      <p style="font-size:12px; color:#999; text-align:center;">
        © ${new Date().getFullYear()} CrowdSense
      </p>

    </div>
  </div>
  `;

    await sendEmail({ to, subject, text, html });
};