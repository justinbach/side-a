'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteEmail({
  toEmail,
  inviterName,
  collectionName,
}: {
  toEmail: string
  inviterName: string
  collectionName: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log('RESEND_API_KEY not set, skipping email')
    return { success: true, skipped: true }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://side-a-frontend.vercel.app'

  try {
    await resend.emails.send({
      from: 'Side A <noreply@resend.dev>',
      to: toEmail,
      subject: `${inviterName} invited you to their vinyl collection`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #5D4E37; font-size: 28px; margin-bottom: 24px;">You're invited! 🎵</h1>

          <p style="color: #5D4E37; font-size: 16px; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join their vinyl record collection <strong>"${collectionName}"</strong> on Side A.
          </p>

          <p style="color: #5D4E37; font-size: 16px; line-height: 1.6;">
            Side A is a shared vinyl collection tracker. You'll be able to browse the collection, add new records, log plays, and leave notes.
          </p>

          <a href="${appUrl}/signup" style="display: inline-block; background-color: #C75D2C; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 24px 0;">
            Join the Collection
          </a>

          <p style="color: #8B7D6B; font-size: 14px; margin-top: 32px;">
            Sign up with this email address (${toEmail}) and you'll automatically have access to the shared collection.
          </p>
        </div>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Failed to send invite email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}
