"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { fetchMe } from "@/app/api";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import "../../styles/checkout.css";
import Sidebar from "../AdminSideBar";
import Navbar from "../Nav";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

const ChangeCard = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [userData, setUserData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const successToastRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await fetchMe();
        setUserData(user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (pmError) {
      setPaymentStatus(pmError.message);
      setIsProcessing(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/payment/change-card`,
        {
          userId: userData?._id,
          paymentMethodId: paymentMethod.id,
        }
      );

      if (response.data.success) {
        setPaymentStatus("Card updated successfully!");
        showToast();
      } else {
        setPaymentStatus(response.data.message || "Card update failed.");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setPaymentStatus("Error updating card: " + errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = () => {
    if (successToastRef.current) {
      const toast = new bootstrap.Toast(successToastRef.current);
      toast.show();
    }
  };

  return (
    <>
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="check-container">
            <div className="check-header">
              <h2 className="mb-4">Update Your Payment Card</h2>
              <p className="text-muted">Secure payment processed by Stripe</p>
            </div>

            <div className="row">
              <div className="col-lg-6">
                <div className="check-card-container">
                  <div className="check-card">
                    <h5 className="mb-3">Card Information</h5>

                    <form onSubmit={handleSubmit}>
                      <div className="mb-3">
                        <label className="form-label">Card Details</label>
                        <div className="check-input check-cardnumber">
                          <CardElement
                            options={{
                              style: {
                                base: {
                                  fontSize: "16px",
                                  color: "#32325d",
                                  fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                                  "::placeholder": { color: "#aab7c4" },
                                },
                                invalid: { color: "#fa755a" },
                              },
                              hidePostalCode: true,
                            }}
                          />
                        </div>
                      </div>

                      <button
                        className="btn btn-primary w-100 mt-3"
                        type="submit"
                        disabled={!stripe || isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                          </>
                        ) : (
                          "Update Card"
                        )}
                      </button>

                      {paymentStatus && (
                        <div className={`mt-3 alert ${paymentStatus.includes("successfully") ? "alert-success" : "alert-danger"}`}>
                          {paymentStatus}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={successToastRef}
        className="toast align-items-center text-white bg-success border-0 position-fixed bottom-0 end-0 m-4"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        data-bs-delay="5000"
      >
        <div className="d-flex">
          <div className="toast-body">
            <i className="bi bi-check-circle-fill me-2"></i>
            Payment method updated successfully!
          </div>
          <button
            type="button"
            className="btn-close btn-close-white me-2 m-auto"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
      </div>
    </>
  );
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);
const ChangeCardWrapper = () => (
  <Elements stripe={stripePromise}>
    <ChangeCard />
  </Elements>
);

export default ChangeCardWrapper;
