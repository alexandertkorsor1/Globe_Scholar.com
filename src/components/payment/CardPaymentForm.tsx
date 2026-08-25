import React, { useState } from 'react';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

interface CardPaymentFormProps {
  amount: number;
  paymentType: string;
  applicationId: string;
  onSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
}

export const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  amount,
  paymentType,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setErrorMessage('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(
        error.message || 'Your card payment could not be completed.'
      );
      setProcessing(false);
      return;
    }

    if (
      paymentIntent &&
      ['succeeded', 'processing'].includes(paymentIntent.status)
    ) {
      onSuccess(paymentIntent.id);
      return;
    }

    setErrorMessage(
      'Payment was not completed. Please check your card details and try again.'
    );

    setProcessing(false);
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '16px',
        border: '1px solid #d8dee8',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '22px',
          borderBottom: '3px solid #174f91',
        }}
      >
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
          }}
        >
          CARD
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        <div
          style={{
            marginBottom: '20px',
            fontSize: '14px',
            color: '#64748b',
          }}
        >
          {paymentType.replace(/_/g, ' ')} payment — ${amount.toFixed(2)} USD
        </div>

        <PaymentElement
          options={{
            layout: 'accordion',
          }}
        />

        {errorMessage && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '8px',
              background: '#fef2f2',
              color: '#b91c1c',
              fontSize: '14px',
            }}
          >
            {errorMessage}
          </div>
        )}

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '24px',
            fontSize: '15px',
            color: '#111827',
          }}
        >
          <input type="checkbox" required />

          <span>
            I agree with the{' '}
            <a href="/privacy-policy" target="_blank" rel="noreferrer">
              Privacy Policy
            </a>
          </span>
        </label>

        <button
          type="submit"
          disabled={!stripe || !elements || processing}
          style={{
            width: '100%',
            marginTop: '24px',
            padding: '17px',
            border: 0,
            borderRadius: '8px',
            background: processing ? '#94a3b8' : '#2563eb',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 700,
            cursor: processing ? 'not-allowed' : 'pointer',
          }}
        >
          {processing
            ? 'PROCESSING PAYMENT...'
            : `PAY $${amount.toFixed(2)} NOW`}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          style={{
            display: 'block',
            margin: '18px auto 0',
            background: 'none',
            border: 0,
            textDecoration: 'underline',
            color: '#475569',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};
