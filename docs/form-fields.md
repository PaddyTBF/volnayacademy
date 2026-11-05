# Questionnaire data dictionary

Verified against the public Google Form on 2026-11-05. All questionnaire fields are available to authorized database operators, not to public website readers.

| Database column | Visitor-facing label | Google Forms field | Required |
|---|---|---|---|
| `full_name` | Name | `entry.174957854` | Yes |
| `phone` | Phone number | `entry.1983000286` | Yes |
| `email` | Email | `entry.491185921` | No |
| `instagram_handle` | Instagram handle | `entry.709092237` | No |
| `linkedin_profile` | LinkedIn | `entry.1380447704` | No |
| `real_estate_goals` | What are your goals in real estate? | `entry.21922786` | No |
| `contact_preference` | Best way to reach you | `entry.686903170` | No |
| `skool_interest` | Are you interested in joining the Volnay Academy community on Skool? | `entry.2120816330` | No |
| `community_must_have` | What would make it something you had to be a part of? | `entry.922802930` | No |
| `ricky_feedback` | Any feedback for Ricky on today's talk? | `entry.549558920` | No |

Operational fields: `id` (retry UUID), `created_at` (database timestamp), `event_code` (fixed event marker or `unattributed`), `page_path` (fixed landing path), `analytics_consent`, `advertising_consent`, `consent_version`, and server-derived `is_test`.

No raw URL, referrer, IP address, browser fingerprint, access token, or arbitrary UTM string is stored with questionnaire responses. Database infrastructure may separately maintain its normal access logs.

No form answer is deliberately sent as a PostHog event property or Meta advanced-matching value. The entire form is excluded from autocapture and masked in replay; manual form events contain only fixed event names/source labels.
