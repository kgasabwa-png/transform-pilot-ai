import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  signupUrl?: string
  promoCode?: string
}

const WaitlistInvite = ({
  signupUrl = 'https://nyvloai.com/auth?next=/pricing',
  promoCode = 'EARLY50',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You're off the Nyvlo waitlist — 50% off your first 3 months</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>You're in.</Heading>
        <Text style={text}>
          Thanks for waiting. Nyvlo is now open — it listens to your meetings,
          remembers what you promised, and drafts the follow-ups so nothing falls
          through.
        </Text>
        <Text style={text}>
          As an early supporter, here's <strong>50% off your first 3 months</strong> of
          Nyvlo Pro. Use this code at checkout:
        </Text>
        <Section style={codeBox}>
          <Text style={codeText}>{promoCode}</Text>
        </Section>
        <Section style={{ textAlign: 'center', marginTop: '28px' }}>
          <Button href={signupUrl} style={cta}>
            Claim your spot
          </Button>
        </Section>
        <Text style={small}>
          Free tier is also live (10 captures a month, no card needed) if you want
          to kick the tires first.
        </Text>
        <Text style={signature}>— Keila, founder</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WaitlistInvite,
  subject: "You're off the Nyvlo waitlist — 50% off inside",
  displayName: 'Waitlist invite',
  previewData: { promoCode: 'EARLY50', signupUrl: 'https://nyvloai.com/auth?next=/pricing' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '28px', fontWeight: 600, color: '#0a0a0a', margin: '0 0 12px' }
const text = { fontSize: '15px', lineHeight: '1.6', color: '#1f1f1f', margin: '0 0 14px' }
const small = { fontSize: '13px', lineHeight: '1.5', color: '#6b6b6b', margin: '28px 0 0' }
const signature = { fontSize: '14px', color: '#1f1f1f', margin: '20px 0 0' }
const codeBox = {
  backgroundColor: '#f5f5f7',
  borderRadius: '10px',
  padding: '18px 20px',
  textAlign: 'center' as const,
  margin: '8px 0',
}
const codeText = {
  fontSize: '22px',
  fontWeight: 600,
  letterSpacing: '0.18em',
  color: '#0a0a0a',
  margin: 0,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
}
const cta = {
  backgroundColor: '#0a0a0a',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '12px 22px',
  fontSize: '15px',
  fontWeight: 500,
  textDecoration: 'none',
  display: 'inline-block',
}
