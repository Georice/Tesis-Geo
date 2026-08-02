import nodemailer from 'nodemailer';

export type EmailSendResult = {
  sent: boolean;
  reason?: string;
};

export class EmailService {
  async sendPasswordResetCode(input: {
    toEmail: string;
    nombre: string;
    codigo: string;
  }): Promise<EmailSendResult> {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.log(
        `[email:dev] Codigo de recuperacion GeoRice para ${input.toEmail} (${input.nombre}): ${input.codigo}`,
      );
      return { sent: false, reason: 'SMTP no configurado' };
    }

    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = (process.env.SMTP_SECURE ?? 'false') === 'true' || port === 465;
    const fromEmail = process.env.SMTP_FROM_EMAIL || user;
    const fromName = process.env.SMTP_FROM_NAME || 'GeoRice';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: input.toEmail,
      subject: 'Codigo de recuperacion de contrasena - GeoRice',
      text: [
        `Hola ${input.nombre},`,
        '',
        `Tu codigo de recuperacion es: ${input.codigo}`,
        '',
        'Este codigo vence en 24 horas. Si no solicitaste este cambio, ignora este mensaje.',
      ].join('\n'),
      html: `
        <p>Hola <strong>${input.nombre}</strong>,</p>
        <p>Tu codigo de recuperacion es:</p>
        <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${input.codigo}</p>
        <p>Este codigo vence en 24 horas. Si no solicitaste este cambio, ignora este mensaje.</p>
      `,
    });

    return { sent: true };
  }
}