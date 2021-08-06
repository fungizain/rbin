import React, { useState } from "react";
import { CloseCircleFilled, CloseOutlined, TagFilled } from "@ant-design/icons";
import { Input, Button } from "antd";
import { lstrings } from "@/utils/constants";

const subscriptionList = (inputList, preSub = false) => {
  return (
    <div
      className={
        preSub
          ? "card__subscription card__subscription__pre"
          : "card__subscription"
      }
    >
      {inputList.map(({ desc, outc, subDesc, isMoney }, ind) => (
        <div key={ind} className="subscription__item">
          <div className="subscription__item__desc">
            {desc}
            {subDesc ? (
              <div className="subscription__item__postscript">{subDesc}</div>
            ) : null}
          </div>
          <div
            className={`subscription__item__content ${
              isMoney ? "subscription__item__money" : ""
            }`}
          >
            {outc}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function PayRightCard(props) {
  const { state, showCharge, tsToDate, handleCouponEvent } = props;
  const {
    couponData,
    couponLoading,
    proration,
    pageData: { lang, planId, isYear: pageIsYear, coupon: pageCoupon },
    subData: { preSub, newSub },
    userData: { isYear: userIsYear },
  } = state;

  const [coupon, setCoupon] = useState(pageCoupon);

  const period = pageIsYear ? "year" : "month";
  const subPlan = planId === "1" ? lstrings.up.growth : lstrings.up.boost;
  const planDesc = subPlan.toUpperCase() + (lang === "en" ? " " : "");
  const planSubDesc = lstrings.up.planDesc;

  const prePayRemain = proration?.startingBalance + preSub?.price;
  const discount =
    -1 * newSub.discount ||
    (couponData?.valid ? -1 * couponData.discountAmount : null);
  const discountValid = newSub?.discount || couponData?.valid;
  let total = newSub.price;
  total += prePayRemain ? prePayRemain : 0;
  total += discount ? discount : 0;
  total = total > 0 ? total : 0;

  const checkList = [
    {
      desc: lstrings.up.plan[0] + planDesc + lstrings.up.plan[1],
      outc: showCharge(newSub.price, true),
      subDesc: preSub && pageIsYear === userIsYear ? planSubDesc : undefined,
      isMoney: true,
    },
    {
      desc: lstrings.up.billStartDate,
      outc: tsToDate(newSub.start).toUpperCase(),
    },
    {
      desc: lstrings.up.nextBillDate,
      outc: tsToDate(newSub.end).toUpperCase(),
    },
  ];

  const discountList = [];

  if (prePayRemain) {
    discountList.push({
      desc: lstrings.up.billSubtotal,
      outc: showCharge(prePayRemain, true),
      isMoney: true,
    });
  }

  if (discount) {
    const percentOff =
      state.existingDiscount?.percentOff || couponData?.percentOff;
    discountList.push({
      desc:
        (state.existingDiscount?.coupon || coupon) +
        (percentOff ? `(-${percentOff}%)` : "") +
        " applied",
      outc: showCharge(discount, true),
      isMoney: true,
    });
  }

  const onCouponClick = (e) => {
    e.preventDefault();
    handleCouponEvent(coupon);
  };

  const onResetClick = () => {
    setCoupon("");
    handleCouponEvent("");
  };

  return (
    <>
      <div className="card__right__planSelected">{subPlan.toUpperCase()}</div>
      <div className="card__right__body">
        {subscriptionList(checkList)}
        {discountList.length > 0 ? subscriptionList(discountList, true) : null}
      </div>
      <div className="card__right__footer subscription__item">
        <div className="subscription__item__desc">
          <div className="subscription__total">{lstrings.up.billTotal}</div>
          <div className="subscription__item__postscript">
            ({lstrings.up.billTotalDesc[0]}
            {lang === "en" ? " " + period + " " : ""}
            {lstrings.up.billTotalDesc[1]})
          </div>
        </div>
        <div className="subscription__item__content">
          <div className="subscription__total">{showCharge(total, true)}</div>
        </div>
      </div>
      <div className="card__coupon">
        <span className="coupon__title">Promo Code</span>
        <form className="coupon__form" onSubmit={onCouponClick}>
          <Input
            className="coupon__input"
            placeholder="enter promotion code here"
            disabled={discountValid}
            allowClear
            onChange={(e) => setCoupon(e.target.value)}
            onClear={onResetClick}
            addonBefore={<TagFilled className="coupon__icon" />}
            {...{ value: coupon }}
          />
          {discountValid !== true ? (
            <Button
              className="coupon__butt"
              type="submit"
              disabled={Boolean(discountValid)}
              loading={couponLoading}
              onClick={onCouponClick}
            >
              Enter
            </Button>
          ) : (
            <Button
              className="coupon__butt__reset"
              type="link"
              onClick={onResetClick}
              icon={<CloseCircleFilled className="coupon__icon" />}
            >
              Remove
            </Button>
          )}
        </form>
        <span
          className={
            discountValid === false
              ? "coupon__warning"
              : "coupon__warning__hidden"
          }
        >
          Invalid Promo Code!
        </span>
      </div>
    </>
  );
}
