import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { cart, settings } from '../../../../utils'
import styles from './SubTotal.module.scss'

const SubTotal = ({
  entreePrice,
  breakfastPrice,
  shippingPrice,
  entreesQuantity,
  breakfastsQuantity,
  backgroundImage = null
}) => {
  const [total, setTotal] = useState(0)
  const state = useSelector((state) => state)
  const cartUtility = cart(state)
  const hideShippingPrice = settings().display().hideShippingPrice;
  const discountFeatureEnable = settings().display().discountFeatureEnable;

  useEffect(() => {
    const subTotal = cartUtility.calculateSubTotal(
      entreePrice,
      breakfastPrice,
      entreesQuantity,
      breakfastsQuantity,
      shippingPrice
    )

    setTotal(subTotal)
  }, [entreePrice, breakfastPrice, entreesQuantity])

  const getBreakfastsPrice = () =>
    isNaN(breakfastPrice) ? breakfastPrice : breakfastPrice
  const getMealsPrice = () => entreePrice
  const getBreakfastsQuantity = () =>
    isNaN(breakfastPrice) ? '' : `(x${Number(breakfastsQuantity)})`
  const getMealsQuantity = () => `(x${Number(entreesQuantity)})`

  const shippingAndDiscountText = discountFeatureEnable ? 'Shipping and discounts calculated at checkout.' : 'Shipping calculated at checkout.';
  const items = hideShippingPrice ? [
    {
      label: `Price Per Meal ${getMealsQuantity()}`,
      price: getMealsPrice()
    },
    {
      label: `Price Per Breakfast ${getBreakfastsQuantity()}`,
      price: getBreakfastsPrice()
    },
    {
      label: shippingAndDiscountText,
      price: shippingPrice
    }

  ] : [
    {
      label: `Price Per Meal ${getMealsQuantity()}`,
      price: getMealsPrice()
    },
    {
      label: `Price Per Breakfast ${getBreakfastsQuantity()}`,
      price: getBreakfastsPrice()
    },
    {
      label:
        process.env.STORE_SETTINGS_KEY === 'cse'
          ? 'Overnight Shipping'
          : 'Shipping',
      price: shippingPrice
    }
  ]
  const displayRow = state.subTypeEntree
  return (
    <div className={styles.wrapper}>
      {backgroundImage ? (
        <div
          className={styles.image}
          style={{ backgroundImage: `url(${backgroundImage})` }}
        >
          &nbsp;
        </div>
      ) : (
        <div>&nbsp;</div>
      )}
      {items.map((item, index) =>
        isNaN(item.price) ? null : (
          <div key={index} className={styles.lineItem}>
            <div className={ discountFeatureEnable && item.label === shippingAndDiscountText ? styles.label+' '+styles.colorRed : styles.label}>{item.label}</div>
            { item.price <= 0 ? '' : (
              <div className={styles.price}>
                {`$${Number.parseFloat(item.price).toFixed(2)}`}
              </div>
            ) }
          </div>
        )
      )}
      <div className={styles.divider}>&nbsp;</div>
      <div className={`${styles.lineItem} ${styles.lineItemTotal}`}>
        <div className={styles.label}>Weekly Total</div>
        <div className={styles.totalPrice}>
          ${Number.parseFloat(total).toFixed(2)}
        </div>
      </div>
    </div>
  )
}

export default SubTotal
