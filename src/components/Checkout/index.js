"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { fetchMe, fetchBasicPremiumPricing } from "@/app/api";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import "../../styles/checkout.css";
import Sidebar from "../AdminSideBar";
import Navbar from "../Nav";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

const PaymentCard = () => {
  const [isInAppMySite, setIsInAppMySite] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent || '';

    if (ua.includes("APICodeVersion")) {
      setIsInAppMySite(true);
    }
  }, []);
  if (isInAppMySite) {
    return (
      <div className="container-scroller d-flex justify-content-center align-items-center vh-100">
        <div className="text-center p-5 rounded shadow bg-light">
          <img src="/assets/img/logo.png" alt="logo" style={{ maxWidth: "150px", marginBottom: "20px" }} />
          <h4>Signup Unavailable</h4>
          <p className="text-muted">
            Signup is not available in this environment. Please visit our website in a browser to register an account.
          </p>
        </div>
      </div>
    );
  }
  const stripe = useStripe();
  const elements = useElements();
  const searchParams = useSearchParams();
  const initialPackage = searchParams.get("package") || "basic";
  const queryPrice = parseFloat(searchParams.get("price")) || 0;
  const courseId = searchParams.get("id") || "";
  const queryTokens = searchParams.get("tokens") || 0;

  const [packageType, setPackageType] = useState(initialPackage);
  const [price, setPrice] = useState(initialPackage === "course" ? queryPrice : 0);
  const [period, setPeriod] = useState("month");
  const [userData, setUserData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [approvedCode, setApprovedCode] = useState("");
  const [discountError, setDiscountError] = useState("");
  const [discountInfo, setDiscountInfo] = useState(null);
  const successToastRef = useRef(null);
  console.log(discountCode);
  const showToast = () => {
    if (successToastRef.current) {
      const toast = new bootstrap.Toast(successToastRef.current);
      toast.show();
    }
  };

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

  useEffect(() => {
    const courseLikePackages = ["course", "small", "large", "custom"];

    if (courseLikePackages.includes(packageType)) {
      setPrice(queryPrice);
    } else {
      const updatePricing = async (pkgType, selectedPeriod) => {
        try {
          const pricingData = await fetchBasicPremiumPricing();
          if (pkgType === "basic") {
            const selectedPrice =
              selectedPeriod === "year"
                ? pricingData.basic.perYear.price
                : pricingData.basic.perMonth.price;
            setPrice(selectedPrice);
          } else if (pkgType === "premium") {
            const selectedPrice =
              selectedPeriod === "year"
                ? pricingData.premium.perYear.price
                : pricingData.premium.perMonth.price;
            setPrice(selectedPrice);
          }
        } catch (error) {
          console.error("Error fetching pricing:", error);
        }
      };

      updatePricing(packageType, period);
    }
  }, [packageType, period, queryPrice]);

  const handlePeriodChange = (e) => {
    const selectedPeriod = e.target.value;
    setPeriod(selectedPeriod);
  };

  const applyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/payment/validate-discount`,
        {
          token: discountCode,
          packageType,
          period: period,
          userId: userData?.username
        }
      );

      if (response.data.success) {
        setDiscountApplied(response.data.discount.value);
        setDiscountInfo(response.data.for);
        setApprovedCode(discountCode);
        setDiscountError("");
      } else {
        setDiscountError(response.data.message || "Invalid discount code");
        setDiscountApplied(0);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error applying discount";
      setDiscountError(errorMessage);
      setDiscountApplied(0);
    }
  };

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
      const finalPrice = getFinalPrice();
      const amountInCents = Math.round(finalPrice * 100);

      // Prepare payment data
      const paymentData = {
        amount: amountInCents,
        packageType,
        paymentMethodId: paymentMethod.id,
        userId: userData?._id,
        price: finalPrice,
        discountToken: approvedCode
      };

      // Add specific parameters based on package type
      if (["basic", "premium"].includes(packageType)) {
        paymentData.period = period;
      } else if (["small", "large", "custom"].includes(packageType)) {
        paymentData.tokens = queryTokens;
      } else if (packageType === "course") {
        paymentData.courseId = courseId;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/payment/create-payment-intent`,
        paymentData
      );

      // Handle subscription response differently
      if (["basic", "premium"].includes(packageType)) {
        // For subscriptions, we get success message directly
        if (response.data.success) {
          setConfirmed(true);
          setPaymentStatus("Subscription activated successfully!");
          showToast();
          setTimeout(() => {
            window.location.href = "/profile";
          }, 3000);
        } else {
          setPaymentStatus(response.data.message || "Subscription setup failed");
        }
      } else {
        // For non-subscriptions, confirm payment with clientSecret
        // For non-subscriptions, confirm payment with clientSecret
        const { clientSecret, paymentIntentId, message } = response.data;

        if (getFinalPrice() === 0 || !clientSecret) {
          // No payment needed — success
          setConfirmed(true);
          showToast();
          setTimeout(() => {
            window.location.href = "/profile";
          }, 3000);
          return;
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          clientSecret,
          { payment_method: paymentMethod.id }
        );

        if (confirmError) {
          setPaymentStatus(confirmError.message);
        } else if (paymentIntent.status === "succeeded") {
          setConfirmed(true);
          setPaymentStatus("Payment successful!");
          showToast();
          setTimeout(() => {
            window.location.href = "/profile";
          }, 3000);
        }

      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setPaymentStatus("Error processing payment: " + errorMessage);
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getDiscountMessage = () => {
    const messages = [];

    // Subscription discounts for courses
    if (packageType === "course") {
      if (userData?.subscription === "premium") {
        messages.push("100% discount (Premium member)");
      } else if (userData?.subscription === "basic") {
        messages.push("80% discount (Basic member)");
      }
    }

    // Coupon discounts
    if (discountApplied > 0) {
      messages.push(`${discountApplied}% discount (Coupon)`);
    }

    return messages.length > 0 ? messages.join(" + ") : null;
  };

  const getFinalPrice = () => {
    let finalPrice = price;

    // Apply subscription discounts for courses
    if (packageType === "course") {
      if (userData?.subscription === "premium") {
        finalPrice = 0;
      } else if (userData?.subscription === "basic") {
        finalPrice = price; // 80% off
      }
    }

    // Apply coupon discount
    if (discountApplied > 0) {
      finalPrice = finalPrice * (1 - discountApplied / 100);
    }

    return finalPrice;
  };

  const renderPackageDetails = () => {
    if (packageType === "course") {
      return (
        <div className="package-details">
          <h4>Course Purchase</h4>
          <p>Course ID: {courseId}</p>
        </div>
      );
    }

    return (
      <div className="package-details">
        <h4>{packageType.charAt(0).toUpperCase() + packageType.slice(1)} Package</h4>
        {["basic", "premium"].includes(packageType) ? (
          <p>Billing Period: {period === "month" ? "Monthly" : "Yearly"}</p>
        ) : (
          <p>Tokens: {queryTokens}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="container-fluid page-body-wrapper">
        <Sidebar />
        <div className="main-panel">
          <div className="check-container">
            <div className="check-header">
              <h2 className="mb-4">Complete Your Payment</h2>
              <p className="text-muted">Secure payment processed by Stripe</p>
            </div>

            <div className="row">
              <div className="col-lg-6">
                <div className="check-card-container">
                  <div className="check-card">
                    <h5 className="mb-3">Payment Information</h5>

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
                                  "::placeholder": { color: "#aab7c4" }
                                },
                                invalid: { color: "#fa755a" }
                              },
                              hidePostalCode: true
                            }}
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Discount Code</label>
                        <div className="input-group">
                          <input
                            type="text"
                            className={`form-control ${discountError ? "is-invalid" : ""}`}
                            value={discountCode}
                            onChange={(e) => setDiscountCode(e.target.value)}
                            placeholder="Enter discount code"
                          />
                          <button
                            className="btn btn-outline-secondary"
                            type="button"
                            onClick={applyDiscount}
                            disabled={!discountCode.trim()}
                          >
                            Apply
                          </button>
                          {discountError && (
                            <div className="invalid-feedback">{discountError}</div>
                          )}
                        </div>
                      </div>

                      {["basic", "premium"].includes(packageType) && (
                        <div className="mb-3">
                          <label className="form-label">Billing Period</label>
                          <div className="d-flex gap-3">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                id="month"
                                name="billingPeriod"
                                value="month"
                                checked={period === "month"}
                                onChange={handlePeriodChange}
                              />
                              <label className="form-check-label" htmlFor="month">
                                Monthly
                              </label>
                            </div>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                id="year"
                                name="billingPeriod"
                                value="year"
                                checked={period === "year"}
                                onChange={handlePeriodChange}
                              />
                              <label className="form-check-label" htmlFor="year">
                                Yearly
                              </label>
                            </div>
                          </div>
                        </div>
                      )}

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
                          `Pay $${getFinalPrice().toFixed(2)}`
                        )}
                      </button>

                      {paymentStatus && (
                        <div className={`mt-3 alert ${paymentStatus.includes("successful") || paymentStatus.includes("activated") ? "alert-success" : "alert-danger"}`}>
                          {paymentStatus}
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className="check-receipt">
                  <div className="receipt-header">
                    <h4>Order Summary</h4>
                  </div>

                  {renderPackageDetails()}

                  <div className="price-breakdown">
                    <div className="d-flex justify-content-between">
                      <span>Subtotal:</span>
                      <span>${price.toFixed(2)}</span>
                    </div>

                    {getDiscountMessage() && (
                      <div className="d-flex justify-content-between text-success">
                        <span>Discount:</span>
                        <span>{getDiscountMessage()}</span>
                      </div>
                    )}

                    <div className="d-flex justify-content-between mt-2 total-row">
                      <strong>Total:</strong>
                      <strong>${getFinalPrice().toFixed(2)}</strong>
                    </div>
                  </div>

                  <div className="security-info mt-4">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-shield-lock me-2 text-success"></i>
                      <span>Secure SSL encryption</span>
                    </div>
                    <div className="d-flex align-items-center">
                      <i className="bi bi-credit-card me-2 text-success"></i>
                      <span>Card details never stored on our servers</span>
                    </div>
                  </div>

                  <div className="payment-methods mt-4">
                    <p className="text-muted small">We accept:</p>
                    <div className="d-flex gap-2">
                      <i className="bi bi-credit-card-2-front fs-4 text-muted"></i>
                      <i className="bi bi-paypal fs-4 text-primary"></i>
                      <i className="bi bi-google-pay fs-4 text-success"></i>
                      <i className="bi bi-apple fs-4 text-dark"></i>
                    </div>
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
            Payment successful! Redirecting to profile...
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
const PaymentCardWrapper = () => (
  <Elements stripe={stripePromise}>
    <PaymentCard />
  </Elements>
);

export default PaymentCardWrapper;