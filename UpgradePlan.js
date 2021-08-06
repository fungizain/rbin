import React, { useState, useEffect } from "react";
import moment from "moment";
import { lstrings } from "@/utils/constants";
import PlanCard from "./PlanCard";
import "./upgradePlan.scss";
// import request, { baseURL } from "@/request.js";

import axios from "axios";
const reqData = axios.create({
  baseURL: "http://10.0.1.3:8092/api",
  headers: {
    Accept: "application/json",
    "Content-type": "application/json; charset=utf-8",
  },
});
// reqData.interceptors.request.use(
//   (config) => {
//     const userId = sessionStorage.getItem("userId");
//     const lang = sessionStorage.getItem("lang");
//     const email = sessionStorage.getItem("email");
//     config.headers = { id: userId, lang, email };
//     return config;
//   },
//   (error) => {
//     console.log(error); // for debug
//     Promise.reject(error);
//   }
// );

export default function UpgradePlan({ history }) {
  const userId = sessionStorage.getItem("userId");
  const lang = lstrings.getLanguage();

  const [isPremium, setIsPremium] = useState(null);
  const [isYear, setIsYear] = useState(null);

  const priceSpan = (price) => {
    return lang === "en"
      ? ["USD", price, "/" + lstrings.up.mo]
      : [lstrings.up.mo + "USD", price, ""];
  };

  const descSpan =
    lang === "en" ? ["", lstrings.up.ms_mo] : [lstrings.up.ms_mo, ""];

  const plans = [
    {
      id: 0,
      title: lstrings.up.trial,
      price: lstrings.up.free,
      items: [
        lstrings.up.cardli1,
        lstrings.up.cardli2,
        lstrings.up.cardli3_t,
        lstrings.up.cardli4,
        lstrings.up.cardli5,
      ],
    },
    {
      id: 1,
      title: lstrings.up.growth,
      price: priceSpan(6.99),
      priceYr: priceSpan(6.29),
      desc: descSpan,
      items: [
        lstrings.up.cardli1,
        lstrings.up.cardli2,
        lstrings.up.cardli3,
        lstrings.up.cardli4,
        lstrings.up.cardli6,
        lstrings.up.cardli5_1,
      ],
    },
    {
      id: 2,
      title: lstrings.up.boost,
      price: priceSpan(24.99),
      priceYr: priceSpan(19.99),
      desc: descSpan,
      items: [
        lstrings.up.cardli1,
        lstrings.up.cardli2,
        lstrings.up.cardli3,
        lstrings.up.cardli4,
        lstrings.up.cardli6,
        lstrings.up.cardli7,
        lstrings.up.cardli7_1,
      ],
      recom: lstrings.up.recommended,
    },
    {
      id: 3,
      title: lstrings.up.together,
      price: lang === "en" ? lstrings.up.t_mplanforu_en : null,
      desc: lstrings.up.t_mplanforu,
      items: [
        lstrings.up.cardli8,
        lstrings.up.cardli9,
        lstrings.up.cardli10,
        lstrings.up.cardli11,
        lstrings.up.cardli12,
      ],
    },
  ];

  useEffect(() => {
    reqData
      .get("retrieve-user-stripe-details?id=" + userId)
      .then((resp) => {
        let { isPm, subInterval } = resp.data;
        setIsPremium(isPm);
        setIsYear(subInterval === "year" ? true : false);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <div className="upgrade">
      <h3 className="upgrade__title">{lstrings.up.title}</h3>
      <div className="upgrade__desc">
        {lstrings.up.desc1}
        <br />
        {lstrings.up.desc2} {lstrings.up.desc3}
      </div>
      <div className="upgrade__plans">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isPremium={isPremium}
            isYear={isYear}
            history={history}
          />
        ))}
      </div>
    </div>
  );
}
