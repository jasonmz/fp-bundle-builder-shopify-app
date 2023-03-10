import React from 'react'
import { getNextWeekDay } from '../../../utils'
import styles from './Review.module.scss'

const ReviewDeliveryDay = ({ date }) => (
  <>
    Delivery Day:{' '}
    <span className={styles.deliveryDate}>
      <span className={styles.date}>{getNextWeekDay(date).format('dddd')}</span>
    </span>
  </>
)

export default ReviewDeliveryDay
