import express, { Request, Response } from 'express';
import { Resend } from 'resend';

const router = express.Router();

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) throw new Error('RESEND_API_KEY not set');
const resend = new Resend(resendApiKey);

router.post('/', async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  try {
    const emailResponse = await resend.emails.send({
      from: `"${name}" <${email}>`,
      to: [process.env.CONTACT_EMAIL_TO!],
      subject: `New Contact Form Submission from ${name}`,
      html: `<p>Name: ${name}</p><p>Email: ${email}</p><p>Message: ${message}</p>`,
    });
    res.status(200).json({ message: 'Message sent successfully', emailResponse });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send email', error: err });
  }
});

export default router;
