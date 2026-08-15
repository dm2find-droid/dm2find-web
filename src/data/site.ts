/**
 * Site-wide constants. Anything that appears in more than one place lives here,
 * so changing it is one edit rather than a grep.
 */

/** Booking link behind every "Book a walkthrough" CTA.
 *  Deliberately a plain link, not the cal.com embed script: an embed loads
 *  third-party JS on page view, which would break the "no third-party requests
 *  until you ask" property that /platform claims. A link sends nothing to
 *  cal.com until the visitor clicks. */
export const BOOKING_URL = 'https://cal.com/martijnh/15min';

export const SALES_EMAIL = 'sales@dm2find.ai';
