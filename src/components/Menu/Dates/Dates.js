import dayjs from 'dayjs'
import React, { useEffect, useState } from 'react'
import { TOAST_INITIAL_STATE } from '../../../constants/toasts'
import { formatUTCDate, getTodayDate } from '../../../utils'
import Toast from '../../Global/Toast'

import styles from './Dates.module.scss'

const TOTAL_WEEKS_LIMIT = 6
const DATE_FORMAT = 'YYYY-MM-DD'

const Dates = ({ bundle, configurations, onClick }) => {
  const todayDate = getTodayDate()
  const [error, setError] = useState(TOAST_INITIAL_STATE)
  const [weeks, setWeeks] = useState([])
  const [activeWeekId, setActiveWeekId] = useState(0)

  useEffect(() => {
    if (bundle.id) {
      getDates()
    }
  }, [bundle, configurations])

  const getDates = async () => {
    if (!configurations && !bundle.id) {
      return
    }

    const currentWeeks = []
    const wasDateIncluded = (date) =>
      currentWeeks.find(
        (w) => w.deliverBefore === formatUTCDate(date, DATE_FORMAT)
      )

    for (const configuration of configurations) {
      for (const content of configuration.contents) {
        if (
          dayjs.utc(content.deliver_after).isSameOrAfter(todayDate) &&
          currentWeeks.length < TOTAL_WEEKS_LIMIT
        ) {
          if (!wasDateIncluded(content.deliver_before)) {
            currentWeeks.push({
              id: currentWeeks.length + 1,
              deliverAfter: formatUTCDate(content.deliver_after, DATE_FORMAT),
              deliverBefore: formatUTCDate(content.deliver_before, DATE_FORMAT)
            })
          }
        }
      }
    }

    if (currentWeeks.length > 0) {
      setWeeks(currentWeeks)
      handleSelectWeek(currentWeeks[0])
    }
  }

  const handleSelectWeek = (week) => {
    onClick(week)
    setActiveWeekId(week.id)
  }

  return (
    <>
      <div className={styles.wrapper}>
        {weeks.map((week) => (
          <div
            key={week.id}
            className={`${styles.item} ${
              week.id === activeWeekId && styles.activeWeek
            }`}
            onClick={() => handleSelectWeek(week)}
          >
            <div className={styles.month}>
              {formatUTCDate(week.deliverAfter, 'MMM')}
            </div>
            <div className={styles.date}>
              {formatUTCDate(week.deliverAfter, 'DD')}-
              {formatUTCDate(week.deliverBefore, 'DD')}
            </div>
          </div>
        ))}
      </div>
      {error.open ? (
        <Toast
          open={error.open}
          status={error.status}
          message={error.message}
          autoDelete
          handleClose={() => setError(TOAST_INITIAL_STATE)}
        />
      ) : (
        ''
      )}
    </>
  )
}

export default Dates
