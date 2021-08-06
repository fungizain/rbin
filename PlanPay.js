import React, { useEffect, useReducer } from "react";
import { getUrlParam } from "@/utils";
import { lstrings } from "@/utils/constants";
import moment from "moment";
import assert from "assert";
import { loadStripe } from "@stripe/stripe-js";
import PayLeftCard from "./PayLeftCard";
import PayRightCard from "./PayRightCard";
import "./planPay.scss";
import { message, Spin } from "antd";

import axios from "axios";
const stripePromise = loadStripe(
  "pk_test_51H812zE8nBld2orWqnA0T1ss4RdsjNCCP4ZXsx60s1NnjDVBrUF3hPatLZ9hmk6xdLrAlZjxf30A5q3HCbZB0Pzz00XG4qxHaq"
);
const reqData = axios.create({
  baseURL: "http://10.0.1.3:8092/api",
  headers: {
    Accept: "application/json",
    "Content-type": "application/json; charset=utf-8",
  },
});

const planCharges = [
  { yearly: 629, monthly: 699 },
  { yearly: 1999, monthly: 2499 },
];

const tsToDateL = (timestamp) => moment.unix(timestamp).format("YYYY-MM-DD");
const tsToDateR = (timestamp) => moment.unix(timestamp).format("DD-MM-YYYY");

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_SUBDATA":
      return { ...state, subLoading: false, subData: action.payload };
    case "SET_PERIOD":
      return {
        ...state,
        subLoading: true,
        pageData: { ...state.pageData, isYear: action.payload },
      };
    case "SET_COUPON":
      return {
        ...state,
        couponLoading: true,
        pageData: { ...state.pageData, coupon: action.payload },
      };
    case "RESET_COUPON_DATA":
      return {
        ...state,
        couponLoading: false,
        couponData: {},
        pageData: { ...state.pageData, coupon: "" },
      };
    case "FETCH_USER_SUCC":
      return { ...state, userLoading: false, userData: action.payload };
    case "FETCH_USER_FAIL":
      return { ...state, userLoading: false, error: action.payload };
    case "FETCH_PRO_SUCC":
      return { ...state, proLoading: false, proration: action.payload };
    case "FETCH_PRO_FAIL":
      return { ...state, error: action.payload };
    case "FETCH_COUPON_SUCC":
      return { ...state, couponLoading: false, couponData: action.payload };
    case "FETCH_COUPON_FAIL":
      return { ...state, error: action.payload };
    case "FETCH_EXISTING_DISCOUNT":
      return { ...state, existingDiscount: action.payload };
    default:
      return state;
  }
};

export default function PlanPay({ history }) {
  // const stripePromise = loadStripe(stripeToken);
  const userId = sessionStorage.getItem("userId");
  const lang = lstrings.getLanguage();

  const planId = getUrlParam("id") || "";
  const charges = planCharges[planId - 1];
  const today = moment().unix();

  const initialState = {
    pageData: { lang, planId, today, isYear: true, coupon: "" },
    userData: {},
    userLoading: true,
    proration: {},
    proLoading: true,
    subData: {},
    subLoading: true,
    couponData: {},
    couponLoading: false,
    existingDiscount: {},
    error: "",
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const showCharge = (price, currShow = false, isYear = null) => {
    let isNegative = price < 0;
    if (isNegative) price *= -1;
    let res = "$" + price / 100;
    res = currShow ? "USD " + res : res;
    res = isNegative ? "- " + res : res;
    if (isYear !== null) {
      let duration = isYear ? lstrings.duration_y : lstrings.duration_m;
      res = lang === "en" ? res + "/" + duration : duration + res;
    }
    return res;
  };

  const handleCouponEvent = (coupon) => {
    if (coupon === "") dispatch({ type: "RESET_COUPON_DATA" });
    else if (coupon === state.pageData.coupon) return;
    else dispatch({ type: "SET_COUPON", payload: coupon });
  };

  const onCheckout = async () => {
    if (state.subLoading) return;
    const { email, cusId, subId } = state.userData;
    const { lang, coupon } = state.pageData;
    let rdata = { id: userId, email, plan: state.subData.newSub.plan, lang };
    if (cusId !== null) rdata = { ...rdata, cusId };
    if (subId !== null) rdata = { ...rdata, subId };
    if (coupon !== "") rdata = { ...rdata, coupon };

    let link = subId === null ? "/checkout-create" : "/checkout-upgrade";
    let resp = await fetch("http://10.0.1.3:8092/api" + link, {
      headers: { "Content-type": "application/json" },
      method: "POST",
      body: JSON.stringify(rdata),
    });
    let session = await resp.json();
    if (session.url) {
      location.href = session.url;
    } else if (session.code === 200) {
      let stripe = await stripePromise;
      let result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });
      if (result.error) {
        message.error(result.error.message);
      }
    }
  };

  // fetch user details
  useEffect(() => {
    reqData
      .get("retrieve-user-stripe-details?id=" + userId)
      .then((resp) => {
        let { email, cusId, isPm, subId, subInterval } = resp.data;
        // for canceled subscription -> isYear = null
        let isYear = null;
        if (subId) isYear = subInterval === "year" ? true : false;
        let payload = { userId, email, cusId, isPm, subId, isYear };
        dispatch({ type: "FETCH_USER_SUCC", payload });
      })
      .catch((err) => dispatch({ type: "FETCH_USER_FAIL" }));
  }, []);

  // fetch proration/discount details of user
  useEffect(() => {
    const { planId } = state.pageData;
    const { isPm, isYear, subId } = state.userData;
    if (state.userLoading || isPm > planId) return;
    const revIsYear = parseInt(planId) === isPm ? true : false;
    let prorationPlan =
      (planId === "1" ? "G" : "B") + (isYear ^ revIsYear ? "Y" : "M");
    if (!state.userData.subId)
      dispatch({ type: "FETCH_PRO_SUCC", payload: {} });
    else {
      reqData
        .post("/checkout-preview", {
          id: userId,
          plan: prorationPlan,
          subId,
        })
        .then((resp) => {
          assert.ok(resp.data.proration);
          if (resp.data.existingDiscount !== undefined)
            dispatch({
              type: "FETCH_EXISTING_DISCOUNT",
              payload: resp.data.existingDiscount,
            });
          dispatch({ type: "FETCH_PRO_SUCC", payload: resp.data.proration });
        })
        .catch((err) => {
          dispatch({ type: "FETCH_PRO_FAIL", payload: err });
        });
    }
  }, [state.userLoading]);

  // calculate new subscription data
  useEffect(() => {
    if (state.proLoading) return;
    const { planId, today, isYear } = state.pageData;
    const selectedPlan = (planId === "1" ? "G" : "B") + (isYear ? "Y" : "M");
    const period = isYear ? "years" : "months";
    let end = moment.unix(today).add(1, period).unix();

    let [preSub, newSub] = [{}, {}];
    let price = isYear ? charges.yearly * 12 : charges.monthly;
    newSub = { price, start: today, end, plan: selectedPlan };

    // check previous discount existence
    if (Object.keys(state.existingDiscount).length !== 0) {
      const { amountOff, percentOff } = state.existingDiscount;
      let discount =
        amountOff !== null ? amountOff : (price * percentOff) / 100;
      discount = Math.round(Math.min(discount, price));
      newSub = { ...newSub, discount };
    }

    // check if proration exist
    if (state.userData.subId !== null) {
      const { newSubPrice, preSubRemain, preSubStart, newSubEnd, plan } =
        state.proration;
      preSub = { price: preSubRemain, start: preSubStart, end: today };
      if (plan === selectedPlan)
        newSub = { ...newSub, price: newSubPrice, end: newSubEnd };
    }
    const payload =
      Object.keys(preSub).length === 0 ? { newSub } : { preSub, newSub };
    dispatch({ type: "SET_SUBDATA", payload });
  }, [state.pageData.isYear, state.proLoading]);

  // check coupon validation && discount amount
  useEffect(() => {
    const { coupon } = state.pageData;
    if (state.subLoading || !coupon) return;
    const { email } = state.userData;
    const { plan } = state.subData.newSub;
    reqData
      .post("validate-coupon", { email, plan, coupon })
      .then((resp) =>
        dispatch({ type: "FETCH_COUPON_SUCC", payload: resp.data })
      )
      .catch((err) => dispatch({ type: "FETCH_COUPON_FAIL" }));
  }, [state.pageData.coupon, state.subLoading]);

  console.log(state);

  return (
    <div className="pay">
      <div className="pay__title">{lstrings.up.paytitle}</div>
      <div className="pay__body">
        <div className="pay__card__left">
          <Spin spinning={state.userLoading}>
            <PayLeftCard
              state={state}
              charges={charges}
              dispatch={dispatch}
              showCharge={showCharge}
              tsToDate={tsToDateL}
              onCheckout={onCheckout}
            />
          </Spin>
        </div>
        <div className="pay__card__right">
          <div className="card__right__header">
            <div className="card__title__right">{lstrings.up.selectplan}</div>
            <div
              className="card__backbutt"
              onClick={() => {
                history.push("/brand/upgradePlan");
              }}
            >
              {lstrings.up.changeplan}
            </div>
          </div>
          {state.subLoading ? (
            <Spin
              spinning={state.subLoading}
              className="card__right__loading"
            />
          ) : (
            <PayRightCard
              state={state}
              charges={charges}
              tsToDate={tsToDateR}
              showCharge={showCharge}
              handleCouponEvent={handleCouponEvent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
