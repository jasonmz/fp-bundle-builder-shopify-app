import { Icon } from '@shopify/polaris'
import { MinusMinor, MobilePlusMajor } from '@shopify/polaris-icons'
import React from 'react'
import styles from './ButtonQuantities.module.scss'

const ButtonQuantities = ({ onAdd, onRemove, quantity = 0 }) => {
  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.button} ${styles.leftButton}`}
        onClick={onRemove}
      >
        <Icon source={MinusMinor} />
      </div>
      <div className={styles.quantity}>{quantity}</div>
      <div className={`${styles.button} ${styles.rightButton}`} onClick={onAdd}>
        <Icon source={MobilePlusMajor} />
      </div>
    </div>
  )
}

export default ButtonQuantities