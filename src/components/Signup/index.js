// src/app/signup/page.js
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import MainResources from "../ExternalResources";
import AdminExternalResources from "../AdminExternalResources";
import countries from "world-countries";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchBasicPremiumPricing } from "../../app/api";
import registrationValidationSchema from "./validations";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import 'bootstrap/dist/js/bootstrap.bundle.min';
import { useStripePayment } from "@/lib/stripe";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const PaymentForm = ({
  formik,
  selectedPlan,
  selectedPeriod,
  price,
  originalPrice,
  discountCode,
  setDiscountCode,
  discountApplied,
  setDiscountApplied,
  discountValue,
  setDiscountValue,
  discountPercentage,
  setDiscountPercentage,
  errorMessage,
  successMessage,
  setSuccessMessage,
  setErrorMessage,
  isProcessing,
  setIsProcessing,
  setPhase,
  setPrice
}) => {
  const { stripe, elements, cardElement } = useStripePayment();
  const router = useRouter();
  const successToastRef = useRef(null);
  const errorToastRef = useRef(null);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setErrorMessage("Please enter a discount code");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/discount/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: discountCode.trim(),
            packageType: selectedPlan,
            period: selectedPeriod,
          }),
        }
      );
      const { success, data, message } = await response.json();
      console.log(success, data, message);

      if (success) {
        let discountAmount = 0;
        let percentageToSet = 0;
        // Calculate discount amount based on percentage
        discountAmount = (originalPrice * data.value) / 100;
        percentageToSet = data.value;


        // Update states
        setDiscountValue(discountAmount);
        setDiscountPercentage(percentageToSet);
        setDiscountApplied(true);
        // Update final price
        setPrice(Math.max(0, originalPrice - discountAmount));
        setErrorMessage("");
      } else {
        setErrorMessage(message || "Invalid discount token");
      }
    } catch (err) {
      setErrorMessage("Error applying discount");
    }
  };

  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setErrorMessage("Payment system not ready");
      return;
    }

    setIsProcessing(true);
    setErrorMessage("");

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setErrorMessage("Card details not complete");
        return;
      }

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (pmError) {
        setErrorMessage(pmError.message);
        setIsProcessing(false);
        return;
      }

      const registrationData = {
        ...formik.values,
        plan: selectedPlan,
        period: selectedPeriod,
        paymentMethodId: paymentMethod.id,
        discountCode: discountApplied ? discountCode : ""
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(registrationData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage(
          "Account has been created and a verification email has been sent."
        );
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('signupState');
        }
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setErrorMessage(result.message || "Signup failed");
      }
    } catch (error) {
      setErrorMessage("Payment failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="col-lg-6 mx-auto">
      <div className="d-flex justify-content-start mb-4">
        <button
          className="btn btn-outline-secondary"
          onClick={() => setPhase(2)}
        >
          Back to Plans
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Complete Your Signup</h2>

          <div className="mb-4">
            <h5>Order Summary</h5>
            <div className="d-flex justify-content-between">
              <span>Plan:</span>
              <span>
                {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                &nbsp;({selectedPeriod})
              </span>
            </div>

            <div className="d-flex justify-content-between mt-2">
              <span>Price:</span>
              <span>${originalPrice.toFixed(2)}</span>
            </div>

            {discountApplied && (
              <>
                <div className="d-flex justify-content-between text-success">
                  <span>
                    Discount ({discountPercentage}%):
                  </span>
                  <span>-${discountValue.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between fw-bold mt-2">
                  <span>Total:</span>
                  <span>${price.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Discount Code</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                disabled={discountApplied}
                placeholder="Enter discount code"
              />
              <button
                className="btn btn-outline-primary"
                type="button"
                onClick={handleApplyDiscount}
                disabled={discountApplied}
              >
                Apply
              </button>
            </div>
            {errorMessage && !discountApplied && (
              <div className="text-danger small mt-1">{errorMessage}</div>
            )}
            {successMessage && (
              <div className="alert alert-success text-center" role="alert">
                {successMessage}
              </div>
            )}

          </div>

          <div className="mb-3">
            <label className="form-label">Card Information</label>
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': { color: '#aab7c4' },
                    iconColor: '#666EE8',
                    lineHeight: '40px'
                  }
                },
                hidePostalCode: true
              }}
            />
          </div>

          {errorMessage && (
            <div className="alert alert-danger">{errorMessage}</div>
          )}

          <div className="d-grid gap-2">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCompleteSignup}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Complete Signup & Pay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Signup = () => {
  const countryList = countries.map((country) => ({
    name: country.name.common,
    code: country.cca2,
  }));

  const router = useRouter();
  const successToastRef = useRef(null);
  const [pricing, setPricing] = useState({
    basic: { perMonth: { price: 0 }, perYear: { price: 0 } },
    premium: { perMonth: { price: 0 }, perYear: { price: 0 } },
  });

  // Load saved state from localStorage
  const loadSavedState = () => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('signupState');
      if (savedState) {
        try {
          return JSON.parse(savedState);
        } catch (e) {
          console.error("Failed to parse saved state", e);
          return null;
        }
      }
    }
    return null;
  };

  const savedState = loadSavedState();

  // Initialize all states with saved values or defaults
  const [phase, setPhase] = useState(savedState?.phase || 1);
  const [isPasswordVisible, setIsPasswordVisible] = useState(savedState?.isPasswordVisible || false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(savedState?.isConfirmPasswordVisible || false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(savedState?.agreeToPrivacy || false);
  const [agreeToTerms, setAgreeToTerms] = useState(savedState?.agreeToTerms || false);
  const [selectedPlan, setSelectedPlan] = useState(savedState?.selectedPlan || null);
  const [selectedPeriod, setSelectedPeriod] = useState(savedState?.selectedPeriod || "month");
  const [discountCode, setDiscountCode] = useState(savedState?.discountCode || "");
  const [discountApplied, setDiscountApplied] = useState(savedState?.discountApplied || false);
  const [discountValue, setDiscountValue] = useState(savedState?.discountValue || 0);
  const [discountPercentage, setDiscountPercentage] = useState(savedState?.discountPercentage || 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [price, setPrice] = useState(savedState?.price || 0);
  const [originalPrice, setOriginalPrice] = useState(savedState?.originalPrice || 0);

  // Save all state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stateToSave = {
        phase,
        isPasswordVisible,
        isConfirmPasswordVisible,
        agreeToPrivacy,
        agreeToTerms,
        selectedPlan,
        selectedPeriod,
        discountCode,
        discountApplied,
        discountValue,
        discountPercentage,
        price,
        originalPrice,
        formValues: formik.values
      };
      sessionStorage.setItem('signupState', JSON.stringify(stateToSave));
    }
  }, [
    phase,
    isPasswordVisible,
    isConfirmPasswordVisible,
    agreeToPrivacy,
    agreeToTerms,
    selectedPlan,
    selectedPeriod,
    discountCode,
    discountApplied,
    discountValue,
    discountPercentage,
    price,
    originalPrice,
    null
  ]);

  // Clean up localStorage when component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('signupState');
      }
    };
  }, []);

  const frontendUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Initialize formik with saved values or defaults
  const formik = useFormik({
    initialValues: savedState?.formValues || {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      passwordConfirm: "",
      country: "",
      frontendUrl: frontendUrl,
    },
    validationSchema: registrationValidationSchema,
    onSubmit: async () => {
      // Reset previous errors
      formik.setErrors({});
      setErrorMessage("");

      try {
        const { email, username } = formik.values;

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_ENDPOINT}/auth/check-duplicates?email=${encodeURIComponent(email)}&username=${encodeURIComponent(username)}`
        );

        const result = await res.json();

        if (result.emailExists || result.usernameExists) {
          const errors = {};
          if (result.emailExists) errors.email = "This email is already in use.";
          if (result.usernameExists) errors.username = "This username is already taken.";
          formik.setErrors(errors);
          return;
        }

        // No duplicates, move to next phase
        setPhase(2);

      } catch (err) {
        setErrorMessage("Server error. Please try again.");
      }
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const pricingData = await fetchBasicPremiumPricing();
        setPricing(pricingData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, []);

  const handlePlanSelect = (plan, period = "month") => {
    setSelectedPlan(plan);
    setSelectedPeriod(period);

    let newPrice = 0;
    if (plan === "basic") {
      newPrice = period === "year"
        ? pricing.basic.perYear.price
        : pricing.basic.perMonth.price;
    } else if (plan === "premium") {
      newPrice = period === "year"
        ? pricing.premium.perYear.price
        : pricing.premium.perMonth.price;
    }

    setPrice(newPrice);
    setOriginalPrice(newPrice);
    setDiscountCode("");
    setDiscountApplied(false);
    setDiscountValue(0);
    setDiscountPercentage(0);
    setPhase(3);
  };

  return (
    <>
      <AdminExternalResources />
      <MainResources />

      <div className="container-scroller">
        <div className="container-fluid page-body-wrapper full-page-wrapper">
          <div className="content-wrapper d-flex align-items-center auth px-0">
            <div className="row w-100 mx-0">
              {phase === 1 && (
                <div className="col-lg-4 mx-auto">
                  <div className="auth-form-light text-left py-5 px-4 px-sm-5">
                    <div className="brand-logo text-center">
                      <a href="/" className="text-primary">
                        <img src="/assets/img/logo.png" alt="logo" />
                      </a>
                    </div>
                    <h4 className="text-center">New here?</h4>
                    <h6 className="font-weight-light text-center">Sign up in a few steps.</h6>

                    <form className="pt-3" onSubmit={formik.handleSubmit}>
                      {formik.errors.general && (
                        <div className="alert alert-danger">{formik.errors.general}</div>
                      )}

                      {[
                        { name: "firstName", placeholder: "First Name" },
                        { name: "lastName", placeholder: "Last Name" },
                        { name: "username", placeholder: "Username" },
                        { name: "email", placeholder: "Email", type: "email" },
                      ].map(({ name, placeholder, type = "text" }) => (
                        <div className="form-group" key={name}>
                          <input
                            type={type}
                            name={name}
                            placeholder={placeholder}
                            className="form-control form-control-lg"
                            {...formik.getFieldProps(name)}
                          />
                          {formik.touched[name] && formik.errors[name] && (
                            <div className="alert alert-danger">{formik.errors[name]}</div>
                          )}
                        </div>
                      ))}

                      <div className="form-group">
                        <select
                          name="country"
                          className="form-select form-select-lg"
                          {...formik.getFieldProps("country")}
                        >
                          <option value="">Select Country</option>
                          {countryList.map((country, index) => (
                            <option key={index} value={country.name}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                        {formik.touched.country && formik.errors.country && (
                          <div className="alert alert-danger">{formik.errors.country}</div>
                        )}
                      </div>

                      <div className="form-group" style={{ position: "relative" }}>
                        <input
                          type={isPasswordVisible ? "text" : "password"}
                          name="password"
                          className="form-control form-control-lg"
                          placeholder="Password"
                          {...formik.getFieldProps("password")}
                        />
                        <i
                          className={`fas ${isPasswordVisible ? "fa-eye-slash" : "fa-eye"}`}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "35%",
                            cursor: "pointer",
                          }}
                          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        ></i>
                        {formik.touched.password && formik.errors.password && (
                          <div className="alert alert-danger">{formik.errors.password}</div>
                        )}
                      </div>

                      <div className="form-group" style={{ position: "relative" }}>
                        <input
                          type={isConfirmPasswordVisible ? "text" : "password"}
                          name="passwordConfirm"
                          className="form-control form-control-lg"
                          placeholder="Confirm Password"
                          {...formik.getFieldProps("passwordConfirm")}
                        />
                        <i
                          className={`fas ${isConfirmPasswordVisible ? "fa-eye-slash" : "fa-eye"}`}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "20%",
                            cursor: "pointer",
                          }}
                          onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        ></i>
                        {formik.touched.passwordConfirm && formik.errors.passwordConfirm && (
                          <div className="alert alert-danger">{formik.errors.passwordConfirm}</div>
                        )}
                      </div>

                      <div className="m-3">
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            id="terms"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                            style={{ width: "1.2em", height: "1.2em" }}
                          />
                          <label className="form-check-label" htmlFor="terms">
                            I agree to the{" "}
                            <Link href="/terms-conditions" className="text-primary text-decoration-underline">
                              Terms and Conditions
                            </Link>
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input me-2"
                            type="checkbox"
                            id="privacy"
                            checked={agreeToPrivacy}
                            onChange={(e) => setAgreeToPrivacy(e.target.checked)}
                            style={{ width: "1.2em", height: "1.2em" }}
                          />
                          <label className="form-check-label" htmlFor="privacy">
                            I agree to the{" "}
                            <Link href="/privacy-policy" className="text-primary text-decoration-underline">
                              Privacy Policy
                            </Link>
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary btn-lg w-100"
                        disabled={!(agreeToTerms && agreeToPrivacy)}
                      >
                        Next
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {phase === 2 && (
                <div className="col-lg-10 mx-auto">
                  <div className="d-flex justify-content-start mb-4">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setPhase(1)}
                    >
                      Back to Registration
                    </button>
                  </div>

                  <section className="pricing section bg-light rounded p-4">
                    <div className="container">
                      <div className="text-center mb-4">
                        <h2>Choose a Plan</h2>
                        <p>Free 3-Day Trial Available</p>
                        <p className="text-muted">
                          <strong>Trial Terms:</strong> Automatic billing on the 4th day;
                          cancellation options provided.
                        </p>
                      </div>
                      <div className="row gy-3 justify-content-center">
                        {["Basic", "Premium"].map((plan, i) => (
                          <div className="col-xl-5 col-lg-5 col-md-6" key={plan}>
                            <div
                              className={`pricing-item ${plan === "Premium" ? "featured" : ""
                                } bg-white rounded shadow h-100`}
                            >
                              <h3 className="text-center">{plan}</h3>
                              <div className="d-flex justify-content-center gap-4 mb-3">
                                <div className="text-center">
                                  <h4 className="mb-0">
                                    <sup>$</sup> {plan === "Basic"
                                      ? pricing.basic.perMonth.price
                                      : pricing.premium.perMonth.price}
                                  </h4>
                                  <span className="text-muted">/ month</span>
                                </div>
                                <div className="text-center">
                                  <h4 className="mb-0">
                                    <sup>$</sup> {plan === "Basic"
                                      ? pricing.basic.perYear.price
                                      : pricing.premium.perYear.price}
                                  </h4>
                                  <span className="text-muted">/ year</span>
                                </div>
                              </div>
                              <ul className="list-unstyled mb-4">
                                <li className="mb-2">Access to Entrepreneurs Tribes</li>
                                <li className="mb-2">Customizable Business Page</li>
                                <li className="mb-2">Global Network Building</li>
                                <li className="mb-2">Startup Growth Toolkit</li>
                                {plan === "Basic" ? (
                                  <>
                                    <li className="mb-2">Higher AI Credit Cost</li>
                                    <li className="mb-2">80% Discount to Courses</li>
                                    <li className="mb-2">AI Assistant (via tokens)</li>
                                    <li className="mb-2">Technical Support</li>
                                  </>
                                ) : (
                                  <>
                                    <li className="mb-2">Full Course Access</li>
                                    <li className="mb-2">AI Assistant (capped usage)</li>
                                    <li className="mb-2">Low AI Credit Cost</li>
                                    <li className="mb-2">Faster Technical Support</li>
                                  </>
                                )}
                              </ul>
                              <div className="btn-wrap text-center mt-auto">
                                <button
                                  className="btn btn-primary btn-lg"
                                  onClick={() => handlePlanSelect(plan.toLowerCase(), 'month')}
                                >
                                  Monthly Plan
                                </button>
                                <button
                                  className="btn btn-outline-primary btn-lg mt-2"
                                  onClick={() => handlePlanSelect(plan.toLowerCase(), 'year')}
                                >
                                  Yearly Plan
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {phase === 3 && stripePromise && (
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    formik={formik}
                    selectedPlan={selectedPlan}
                    selectedPeriod={selectedPeriod}
                    price={price}
                    originalPrice={originalPrice}
                    discountCode={discountCode}
                    setDiscountCode={setDiscountCode}
                    discountApplied={discountApplied}
                    setDiscountApplied={setDiscountApplied}
                    discountValue={discountValue}
                    setDiscountValue={setDiscountValue}
                    discountPercentage={discountPercentage}
                    setDiscountPercentage={setDiscountPercentage}
                    errorMessage={errorMessage}
                    successMessage={successMessage}
                    setErrorMessage={setErrorMessage}
                    setSuccessMessage={setSuccessMessage}
                    isProcessing={isProcessing}
                    setIsProcessing={setIsProcessing}
                    setPhase={setPhase}
                    setPrice={setPrice}
                  />
                </Elements>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;