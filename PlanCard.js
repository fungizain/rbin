import React, { useState, useEffect } from "react";
import { lstrings } from "@/utils/constants";

const showPriceItem = (item, ind) => (
  <span
    key={ind}
    className={/\d/.test(item) ? "plan__price__money" : "plan__price__text"}
  >
    {/\d/.test(item) ? "$" + item : item}
  </span>
);

const showPriceSpan = (priceItems) => {
  if (!Array.isArray(priceItems))
    return <span className="plan__price__money">{priceItems}</span>;
  else return <>{priceItems.map((item, ind) => showPriceItem(item, ind))}</>;
};

export default function PlanCard({ plan, isPremium, isYear, history }) {
  const { id, title, price, priceYr, desc, items, recom } = plan;
  const [buttVisible, setButtVisible] = useState(false);
  const [buttClickable, setButtClickble] = useState(true);
  const [buttText, setButtText] = useState("");

  const onClick = () => {
    if (id !== 3) history.push(`/brand/upgradePlanPay?id=${id}`);
    else location.href = "mailto:business@popared.com";
  };

  useEffect(() => {
    if (isPremium === null) return;
    if (isPremium === 0) {
      setButtVisible(true);
      if (id === 0) {
        setButtClickble(false);
        setButtText(lstrings.up.inuse);
      } else if (id === 3) setButtText(lstrings.up.reachourteam);
      else setButtText(lstrings.up.subscribenow);
    } else if (isPremium === 3) {
      if (id === 3) {
        setButtVisible(true);
        setButtClickble(false);
        setButtText(lstrings.up.inuse);
      } else setButtVisible(false);
    } else {
      if (id < isPremium) setButtVisible(false);
      else {
        setButtVisible(true);
        if (id === isPremium) {
          isYear ? setButtClickble(false) : null;
          setButtText(lstrings.up.inuse);
        } else {
          id === 3
            ? setButtText(lstrings.up.reachourteam)
            : setButtText(lstrings.up.subscribenow);
        }
      }
    }
  }, [isPremium, isYear]);

  return (
    <div
      className={
        id === 3
          ? "upgrade__plan__tgt"
          : buttVisible
          ? "upgrade__plan__react"
          : "upgrade__plan"
      }
    >
      <div className="upgrade__plan__body">
        {recom && <div className="plan__recom">{recom}</div>}
        <div className="plan__title">{title}</div>
        <div className="plan__price">
          <div className="plan__price__monthly">{showPriceSpan(price)}</div>
          <div className="plan__price__yearly">
            {showPriceSpan(priceYr)}{" "}
            <span className="plan__price__desc">{desc}</span>
          </div>
        </div>
        <ul className="plan__items">
          {items.map((item, ind) => (
            <li key={ind} className="plan__item">
              {item}
            </li>
          ))}
        </ul>
      </div>
      {buttVisible ? (
        <div
          className={
            id === 3
              ? "upgrade__butt__tgt"
              : buttClickable
              ? "upgrade__butt__react"
              : "upgrade__butt"
          }
          onClick={buttClickable ? onClick : null}
        >
          {buttVisible && buttText.toUpperCase()}
        </div>
      ) : null}
    </div>
  );
}
