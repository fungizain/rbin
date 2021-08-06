import React from "react";
import { lstrings } from "@/utils/constants";

export default function PayLeftCard(props) {
  const { charges, state, dispatch, showCharge, tsToDate, onCheckout } = props;
  const {
    pageData: { planId, today, isYear: pageIsYear },
    userLoading,
    userData: { isPm, isYear: userIsYear },
  } = state;

  const plans = [
    {
      isYear: true,
      period: lstrings.up.billyear,
      charge: showCharge(charges.yearly, false, false),
    },
    {
      isYear: false,
      period: lstrings.up.billmonth,
      charge: showCharge(charges.monthly, false, false),
    },
  ];

  return (
    <>
      <div className="card__title__left">{lstrings.up.chooseubillcycle}</div>
      <div className="card__plans">
        {plans.map((plan, ind) => {
          const isSelectedOn = plan.isYear === pageIsYear;
          const cannotSelectedOn =
            userIsYear != null && planId == isPm && !plan.isYear;
          return userLoading ? (
            <div className="card__plan" key={ind}>
              Loading
            </div>
          ) : (
            <div
              key={ind}
              className={
                isSelectedOn
                  ? "card__plan card__selected"
                  : cannotSelectedOn
                  ? "card__plan"
                  : "card__plan__react"
              }
              onClick={
                isSelectedOn || cannotSelectedOn
                  ? null
                  : () => dispatch({ type: "SET_PERIOD", payload: plan.isYear })
              }
            >
              {plan.period}
              <div className="plan__price">{plan.charge}</div>
              {plan.isYear ? (
                <div className="plan__discount">
                  {lstrings.up.save} {planId}0%
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="card__checkoutbutt" onClick={onCheckout}>
        {lstrings.up.confirmandproceedtopayment}
      </div>
      <div className="card__postscript">
        {lstrings.up.payagent1_f + tsToDate(today) + lstrings.up.payagent1_a}
      </div>
    </>
  );
}
