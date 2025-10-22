// hooks/useStripePayment.js
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";

export const useStripePayment = () => {
  const stripe = useStripe();
  const elements = useElements();
  const cardElement = elements?.getElement(CardElement);

  return {
    stripe,
    elements,
    cardElement
  };
};
