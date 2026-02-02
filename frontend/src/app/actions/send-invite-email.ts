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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const { error } = await resend.emails.send({
      from: 'Side A <noreply@resend.dev>',
      to: toEmail,
      subject: `You've been invited to a vinyl collection on Side A`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #4A3728; font-size: 28px; margin-bottom: 24px;">You're invited!</h1>
          <p style="color: #4A3728; font-size: 16px; line-height: 1.6;">
            ${inviterName} has invited you to join their vinyl collection <strong>"${collectionName}"</strong> on Side A.
          </p>
          <p style="color: #4A3728; font-size: 16px; line-height: 1.6; margin-top: 16px;">
            Side A is a place to catalog your vinyl records, log your listening sessions, and share your collection with others.
          </p>
          <a href="${appUrl}/login" style="display: inline-block; background-color: #C75D2C; color: #FFF9F5; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; margin-top: 24px;">
            Accept Invitation
          </a>
          <p style="color: #4A3728; opacity: 0.6; font-size: 14px; margin-top: 32px;">
            When you sign up or log in with ${toEmail}, you'll automatically have access to the collection.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send invite email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('Failed to send invite email:', err)
    return { success: false, error: 'Failed to send email' }
  }
}
