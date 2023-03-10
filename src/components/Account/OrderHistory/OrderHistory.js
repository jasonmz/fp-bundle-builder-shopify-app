import React, { useState, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  displayHeader,
  displayFooter,
  selectFaqType,
  setTokens,
  reset,
  setEmail
} from '../../../store/slices/rootSlice'
import { Link, useLocation } from 'react-router-dom'
import styles from './OrderHistory.module.scss'
import { MenuItemCard } from '../Components/MenuItemCard'
import {
  getActiveSubscriptions,
  getSubscriptionOrders,
  useUserToken
} from '../../Hooks'
import { ChevronRightMinor } from '@shopify/polaris-icons'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import utc from 'dayjs/plugin/utc'
import * as dayjs from 'dayjs'
import {
  request,
  getOrderTrackingUrl,
  buildProductArrayFromVariant,
  buildProductArrayFromId,
  findWeekDayBetween,
  getCutOffDate,
  getTodayDate,
  sortDatesArray,
  uniqueArray
} from '../../../utils'
import { Spinner } from '../../Global'
import { clearLocalStorage } from '../../../store/store'

import Toast from '../../Global/Toast'
import { SideMenu } from '../Components/SideMenu'
import WeekActions from '../Components/WeekActions'
import {
  STATUS_LOCKED,
  STATUS_PENDING,
  STATUS_SENT
} from '../../../constants/order'
import { DEFAULT_ERROR_MESSAGE } from '../../../constants/errors'

dayjs.extend(isSameOrAfter)
dayjs.extend(utc)

const useQuery = () => {
  const { search } = useLocation()
  return useMemo(() => new URLSearchParams(search), [search])
}

const OrderHistory = () => {
  if (!shopCustomer || shopCustomer.id === 0) {
    window.location = `https://${shopDomain}/account`
  }

  const state = useSelector((state) => state)
  const dispatch = useDispatch()
  const query = useQuery()
  const [active, setActive] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState({
    open: false,
    status: 'Success',
    message: ''
  })

  const todayDate = getTodayDate()

  useEffect(() => {
    dispatch(displayHeader(false))
    dispatch(displayFooter(false))
    dispatch(selectFaqType(null))

    getData()
  }, [])

  const clearState = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        clearLocalStorage()
        dispatch(reset())
        resolve('ok')
      }, 1000)
    })

  const getData = async () => {
    try {
      if (shopCustomer.email !== state.email || !state.tokens.userToken) {
        const userToken = await getToken()
        await clearState()
        await getOrdersToShow(userToken)
      } else {
        await getOrdersToShow(state.tokens.userToken)
      }
    } catch (error) {
      setError({
        open: true,
        status: 'Danger',
        message: DEFAULT_ERROR_MESSAGE
      })
    }
    dispatch(setEmail(shopCustomer?.email || ''))
  }

  const getToken = async () => {
    const tokenResponse = await useUserToken()
    if (tokenResponse.token) {
      dispatch(
        setTokens({
          ...state.tokens,
          userToken: tokenResponse.token
        })
      )
      return tokenResponse.token
    }
  }

  const getOrdersToShow = async (token) => {
    const activeWeeksArr = []
    const activeWeeksLimit = []
    const weeksMenu = []
    const subscriptionArray = {}

    const subscriptionResponse = await getActiveSubscriptions(token)

    if (subscriptionResponse.data.data) {
      for (const sub of subscriptionResponse.data.data) {
        const subscriptionOrders = await getSubscriptionOrders(token, sub.id)
        const configData = await request(
          `${process.env.PROXY_APP_URL}/bundle-api/bundles/${sub.bundle_id}/configurations`,
          {
            method: 'get',
            data: '',
            headers: { authorization: `Bearer ${token}` }
          }
        )
        if (configData.data.data.length > 0) {
          for (const config of configData.data.data) {
            for (const content of config.contents) {
              // find delivery date between range
              const deliveryDate = findWeekDayBetween(
                sub.delivery_day,
                content.deliver_after,
                content.deliver_before
              )
              const cutoffDate = getCutOffDate(deliveryDate)

              if (
                dayjs(content.deliver_before).utc().isSameOrAfter(todayDate)
              ) {
                const orderedItems = subscriptionOrders.data.data.filter(
                  (ord) =>
                    ord.bundle_configuration_content.deliver_after ===
                    content.deliver_after
                )
                const subscriptionObjKey = content.deliver_after.split('T')[0]

                if (
                  !weeksMenu.includes(
                    dayjs(content.deliver_after).format('YYYY-MM-DD')
                  )
                ) {
                  weeksMenu.push(
                    dayjs.utc(content.deliver_after).format('YYYY-MM-DD')
                  )
                  subscriptionArray[subscriptionObjKey] = {}
                  subscriptionArray[subscriptionObjKey].items = []

                  if (orderedItems.length > 0) {
                    const orderFound = orderedItems[0]
                    if (subscriptionArray[subscriptionObjKey]) {
                      let thisItemsArray = []
                      for (const order of orderedItems) {
                        const prodArr = await buildProductArrayFromVariant(
                          order.items,
                          sub.subscription_sub_type,
                          shopProducts
                        )
                        thisItemsArray = thisItemsArray.concat(prodArr)
                      }

                      subscriptionArray[subscriptionObjKey].subId = sub.id
                      subscriptionArray[subscriptionObjKey].deliveryDay =
                        sub.delivery_day
                      subscriptionArray[subscriptionObjKey].items =
                        thisItemsArray
                      subscriptionArray[subscriptionObjKey].status =
                        orderFound.platform_order_id !== null
                          ? STATUS_SENT
                          : todayDate.isSameOrAfter(cutoffDate)
                          ? STATUS_LOCKED
                          : STATUS_PENDING
                      subscriptionArray[subscriptionObjKey].subscriptionDate =
                        dayjs(subscriptionObjKey).format('YYYY-MM-DD')
                      subscriptionArray[subscriptionObjKey].queryDate =
                        content.deliver_after
                      if (orderFound.platform_order_id !== null) {
                        subscriptionArray[subscriptionObjKey].trackingUrl =
                          await getOrderTrackingUrl(
                            orderFound.platform_order_id,
                            shopCustomer
                          )
                      }
                    }
                  } else {
                    const configContentsData = await request(
                      `${process.env.PROXY_APP_URL}/bundle-api/bundles/${config.bundle_id}/configurations/${config.id}/contents/${content.id}/products?is_default=1`,
                      {
                        method: 'get',
                        data: '',
                        headers: { authorization: `Bearer ${token}` }
                      },
                      3
                    )
                    const thisProductsArray = await buildProductArrayFromId(
                      configContentsData.data.data,
                      sub.subscription_sub_type,
                      shopProducts
                    )

                    subscriptionArray[subscriptionObjKey].subId = sub.id
                    subscriptionArray[subscriptionObjKey].items =
                      subscriptionArray[subscriptionObjKey].items.concat(
                        thisProductsArray
                      )
                    subscriptionArray[subscriptionObjKey].status =
                      todayDate.isSameOrAfter(cutoffDate)
                        ? STATUS_LOCKED
                        : STATUS_PENDING
                    subscriptionArray[subscriptionObjKey].subscriptionDate =
                      dayjs(subscriptionObjKey).format('YYYY-MM-DD')
                    subscriptionArray[subscriptionObjKey].queryDate =
                      content.deliver_after
                  }
                }
              }
            }
          }
        }
      }
    }

    let count = 0
    for (const [key, value] of Object.entries(subscriptionArray)) {
      activeWeeksLimit.push(5)
      if (query.get('date') !== null) {
        if (key === query.get('date')) {
          activeWeeksArr.push(value)
        }
      } else {
        if (count < 2) {
          count++
          activeWeeksArr.push(value)
        }
      }
    }

    setActive(activeWeeksArr)
    setLoading(false)
  }

  if (loading) {
    return <Spinner label="Loading..." />
  }

  const CurrentWeek = () => (
    <div>
      {active.map((subscription, index) => (
        <div key={index} className={styles.subscriptionRow}>
          <div className={styles.menuRow}>
            <div className={styles.headerWthLink}>
              {subscription.status === 'sent' ? (
                <a
                  href={subscription.trackingUrl}
                  className={styles.primaryLink}
                >
                  Track Package
                </a>
              ) : (
                ''
              )}
            </div>
          </div>
          {subscription.items.length > 0 ? (
            <div key={index} className={styles.contentCardWrapper}>
              <div className={styles.contentCardNavigation}>
                <h3>
                  Order Delivering Week of{' '}
                  {dayjs(subscription.subscriptionDate).format('MMM DD')}
                </h3>
                <WeekActions
                  status={subscription.status}
                  date={subscription.queryDate}
                  orderId={subscription.subId}
                  displaySummary
                />
              </div>
              {subscription.items ? (
                <div className={styles.currentOrderMenu}>
                  {subscription.items.map((item, index) =>
                    index < 3 ? (
                      <MenuItemCard
                        key={index}
                        title={item.title}
                        image={item.platform_img}
                        quantity={item.quantity}
                        type={item.type}
                      />
                    ) : (
                      ''
                    )
                  )}
                  <Link
                    to={`/account?date=${dayjs(subscription.queryDate)
                      .utc()
                      .format('YYYY-MM-DD')}`}
                    className={styles.seeAllMenu}
                  >
                    See All <ChevronRightMinor />
                  </Link>
                </div>
              ) : (
                ''
              )}
            </div>
          ) : (
            ''
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="contentWrapper">
      <div className="bundleRow alignCenter">
        <div className="bundleOneThird">
          <p>
            <Link to="/account" className="primaryButton">
              Go back to Meals
            </Link>
          </p>
        </div>
        <div className="bundleTwoThirds">
          <div className="headerOffset">
            <h2>Order History</h2>
          </div>
        </div>
      </div>
      <div className="bundleRow">
        <div className="bundleOneThird">
          <SideMenu active="order-history" />
        </div>
        <div className="bundleTwoThirds">
          <div className="bundleBuilderCard">
            <CurrentWeek />
          </div>
          <div className="bundleBuilderCard">
            <div className={styles.contentCardWrapper}>
              <div className={styles.contentCardNavigation}>
                <h3>Past Orders</h3>
                <p></p>
              </div>
              <table className={styles.orderHistoryTable}>
                <thead className={styles.orderHistoryTableHeaders}>
                  <tr>
                    <th>Order Date</th>
                    <th>Order Total</th>
                    <th>Meals Names</th>
                  </tr>
                </thead>
                <tbody>
                  {shopCustomer.orders.map((order, index) =>
                    index < 5 ? (
                      <tr key={index}>
                        <td>{dayjs(order.orderDate).format('MM/DD/YYYY')}</td>
                        <td>{order.orderTotal}</td>
                        <td className={styles.orderMealNames}>
                          <p className={styles.orderMealNamesText}>
                            {order.lineItems.map(
                              (item) => `${decodeURI(item.title)},`
                            )}
                          </p>
                          <a
                            href={order.orderLink}
                            className={styles.orderMealNamesLink}
                          >
                            See All Meals
                          </a>
                        </td>
                      </tr>
                    ) : (
                      <tr key={index}>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
              <a href={`/account`} className={styles.orderHistoryMoreLink}>
                See More{' '}
              </a>
            </div>
          </div>
        </div>
      </div>
      {error.open ? (
        <Toast
          open={error.open}
          status={error.status}
          message={error.message}
          autoDelete
          handleClose={closeAlert}
        />
      ) : (
        ''
      )}
    </div>
  )
}

export default OrderHistory
