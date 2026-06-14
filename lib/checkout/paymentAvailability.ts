/**
 * Payment availability for Russia storefront.
 * Stripe removed — YooKassa integration arrives in Step 6.
 */

export type PaymentAvailability = {
  enabled: boolean;
  reason?: string;
  actionHint?: string;
};

export type PaymentMethodsAvailability = {
  stripe: PaymentAvailability;
};

export type CheckoutState = {
  hasDeliveryDistrict: boolean;
  isFormValid: boolean;
  isLoading: boolean;
  /** When false, checkout/payment must not proceed (152-FZ personal data consent). */
  hasPersonalDataConsent?: boolean;
  firstIncompleteHint?: string;
  messages?: {
    selectDeliveryArea?: string;
    processing?: string;
    paymentUnavailable?: string;
    personalDataConsentRequired?: string;
  };
};

const PAYMENT_UNAVAILABLE =
  'Online payment is being set up. Please contact us to complete your order.';

export function getPaymentAvailability(state: CheckoutState): PaymentMethodsAvailability {
  const {
    hasDeliveryDistrict,
    isFormValid,
    isLoading,
    hasPersonalDataConsent,
    firstIncompleteHint,
    messages,
  } = state;

  const selectDeliveryArea = messages?.selectDeliveryArea ?? 'Select a delivery area to continue';
  const processing = messages?.processing ?? 'Processing...';
  const paymentUnavailable = messages?.paymentUnavailable ?? PAYMENT_UNAVAILABLE;
  const personalDataConsentRequired =
    messages?.personalDataConsentRequired ??
    'Please confirm consent to personal data processing.';

  if (isLoading) {
    return { stripe: { enabled: false, reason: processing } };
  }

  if (!hasDeliveryDistrict) {
    return {
      stripe: { enabled: false, reason: selectDeliveryArea, actionHint: 'Choose district first' },
    };
  }

  if (!isFormValid && firstIncompleteHint) {
    return {
      stripe: { enabled: false, reason: firstIncompleteHint, actionHint: 'Complete required fields' },
    };
  }

  if (hasPersonalDataConsent === false) {
    return {
      stripe: {
        enabled: false,
        reason: personalDataConsentRequired,
        actionHint: 'Confirm personal data consent',
      },
    };
  }

  return {
    stripe: { enabled: false, reason: paymentUnavailable },
  };
}

export function canCheckout(_availability: PaymentMethodsAvailability): boolean {
  return false;
}
