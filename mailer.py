import smtplib
import sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

if len(sys.argv) < 3:
    print("Please provide both backend and frontend URLs as arguments.")
    sys.exit(1)

backend_url = sys.argv[1]
frontend_url = sys.argv[2]

sender_email = "maiayman21102001@gmail.com"
sender_password = "ocla pthl wdbb efyo"
receiver_email = "maiayman21102001@gmail.com"

msg = MIMEMultipart()
msg["From"] = f'"Assessment Recruitment System" <{sender_email}>'
msg["To"] = receiver_email
msg["Subject"] = "🚀 System Started: New Tunnel Links Generated"

html = f"""\
<html>
  <body>
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4CAF50;">✅ System successfully restarted and rebuilt!</h2>
        <p>Your Cloudflare Tunnels have generated new live URLs:</p>
        <table style="width: 100%; max-width: 600px; border-collapse: collapse; margin-top: 20px;">
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">🌍 Frontend URL</td>
                <td style="padding: 10px; border: 1px solid #ddd;"><a href="{frontend_url}" target="_blank">{frontend_url}</a></td>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd; background-color: #f9f9f9; font-weight: bold;">⚙️ Backend URL</td>
                <td style="padding: 10px; border: 1px solid #ddd;"><a href="{backend_url}" target="_blank">{backend_url}</a></td>
            </tr>
        </table>
        <p style="margin-top: 30px; font-size: 12px; color: #888;">This is an automated message from your server's auto-rebuild script.</p>
    </div>
  </body>
</html>
"""

msg.attach(MIMEText(html, "html"))

try:
    server = smtplib.SMTP("smtp.gmail.com", 587)
    server.starttls()
    server.login(sender_email, sender_password)
    server.sendmail(sender_email, receiver_email, msg.as_string())
    server.quit()
    print("Email sent successfully!")
except Exception as e:
    print(f"Error sending email: {e}")
    sys.exit(1)
