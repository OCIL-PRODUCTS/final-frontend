import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_PUBLIC_KEY);  // Use your Stripe public key

const ChangeCardModal = ({ userId, setShowChangeCardModal, setPayments }) => {
  const [error, setError] = useState('');
  const stripe = useStripe();
  const elements = useElements();

  const handleCardChange = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);

    // Create payment method from card details
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });

    if (error) {
      setError(error.message);
      return;
    }

    // Call the API to update the payment method
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/payment/change-card`, {
        userId: userId,
        paymentMethodId: paymentMethod.id,
      });
      alert("Payment method updated successfully.");
      setShowChangeCardModal(false);  // Close modal
    } catch (error) {
      console.error("Error updating payment method:", error);
      alert("Failed to update payment method.");
    }
  };

  return (
    <form id="payment-form" onSubmit={handleCardChange}>
      <CardElement />
      <button type="submit" className="btn btn-primary mt-3" disabled={!stripe}>
        Save Card
      </button>
      {error && <div className="alert alert-danger mt-2">{error}</div>}
    </form>
  );
};
