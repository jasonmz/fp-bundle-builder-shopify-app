import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
    displayHeader,
    displayFooter,
    selectFaqType,
    setTokens
  } from '../../../store/slices/rootSlice'
import { Link, Redirect, useLocation } from 'react-router-dom'
import { SideMenu } from '../Components/SideMenu'
import styles from './PlanSettings.module.scss'
import { MenuItemCard } from '../Components/MenuItemCard'
import { useUserToken } from '../../Hooks';
import {
  ChevronRightMinor
} from '@shopify/polaris-icons';
import * as dayjs from 'dayjs';
import { request } from '../../../utils';
import { Spinner } from '../../Global';
import { DeliveryDayModal } from '../Components/DeliveryDayModal';

function useQuery () {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

const PlanSettings = () => {

  if(!shopCustomer || shopCustomer.id === 0){
    window.location = `https://${shopDomain}/account`
  }
  
  const query = useQuery();
  const state = useSelector((state) => state)
  const dispatch = useDispatch()
  const [subscriptions, setSubscriptions] = React.useState([])
  const [loading, setLoading] = React.useState(true);

  React.useEffect( () => {
    dispatch(displayHeader(false))
    dispatch(displayFooter(false))
    dispatch(selectFaqType(null))

    if (!state.tokens.userToken) {
      const thisToken = getToken();
      getOrdersToShow(thisToken);
    }else {
      getOrdersToShow(state.tokens.userToken);
    }
    
  }, []);

  const getToken = async () => {
    const tokenResponse = await useUserToken();
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
    const currentDate = query.get('date')
    const newWeeksArr = []
    const subApi = await request(`${process.env.PROXY_APP_URL}/bundle-api/subscriptions`, { method: 'get', data: '', headers: { authorization: `Bearer ${token}` }}, 3)
    const thisWeek = dayjs().day(0);

    // TODO: there should be a better implementation for this
    const configData = await request(`${process.env.PROXY_APP_URL}/bundle-api/bundles/${subApi.data.data[0].bundle_id}/configurations`, 
      { 
        method: 'get', 
        data: '', headers: { authorization:`Bearer ${token}` }
      })    

    for (const sub of subApi.data.data) {
      const thisLoopSubList = [];
      const bundleId = sub.bundle_id;
      
      if (sub.orders.length === 0) {
        continue
      }

      let contentId = sub.orders[0].bundle_configuration_content_id;

      sub.orders.forEach( order => {
        if(!order.platform_order_id && order.bundle_configuration_content_id <= contentId){
          contentId = order.bundle_configuration_content_id;
          if(order.items.length > 0){
            order.items.forEach( product => {
              // TODO need to filter for variant to get info
              const shopProd = shopProducts.filter( p => p.id === product.platform_product_variant_id)[0]
              thisLoopSubList.push({
                title:  shopProd ? shopProd.title : 'Missing Title',
                platform_img: shopProd && shopProd.images.length > 0 ? shopProd.images[0]: process.env.EMPTY_STATE_IMAGE,
                quantity: item.quantity,
                type: order.subscription.subscription_sub_type
              })
            })
          }
        }
      })

      if(thisLoopSubList.length === 0){
        const getCurrentContent = configData.data.data[0].contents.find(
          (d) => d.display_after === currentDate
        )
        const subscriptionConfigContents = await request(`${process.env.PROXY_APP_URL}/bundle-api/bundles/${bundleId}/configurations/${getCurrentContent.bundle_configuration_id}/contents/${getCurrentContent.id}?deliver_after=${thisWeek.format('YYYY-MM-DD')}T00:00:00.000Z`, { method: 'get', data: '', headers: { authorization: `Bearer ${token}` }}, 3)
        if(subscriptionConfigContents.data.data){
          subscriptionConfigContents.data.data.products.forEach( product => {
            if(product.is_default === 1){
              // TODO Need to filter down to variant based on subscription sub type
              const shopProd = shopProducts.filter( p => Number(p.id) === Number(product.platform_product_id))[0]
              thisLoopSubList.push({
                title:  shopProd ? shopProd.title : 'Missing Title',
                platform_img: shopProd && shopProd.images.length > 0 ? shopProd.images[0]: process.env.EMPTY_STATE_IMAGE,
                quantity: product.default_quantity,
                type: sub.subscription_sub_type
              })
            }
          })
        }
      }
      
      const subItem = {
        subId: sub.id,
        subscriptionType: sub.subscription_type,
        subscriptionSubType: sub.subscription_sub_type,
        deliveryDay: sub.delivery_day,
        customerId: sub.customer_id,
        date: currentDate,
        items: thisLoopSubList
      }
      newWeeksArr.push(subItem)
    }

    setSubscriptions(newWeeksArr);
    setLoading(false)
  }
  
  if (loading) {

    return (
      <Spinner label="Loading..." />
    )
  }

    return (
        <div className="contentWrapper">
            <div className="bundleRow alignCenter">
                <div className="bundleOneThird">   
                  <p>
                    <Link 
                      to='/account'
                      className="primaryButton">
                        Go back to Meals
                    </Link>
                  </p>             
                </div>
                <div className="bundleTwoThirds">
                    <div className="headerOffset">
                        <h2>Plan Settings</h2>
                    </div>
                </div>
            </div>
            <div className="bundleRow">
                <div className="bundleOneThird">
                    <SideMenu active="plan-settings" />
                </div>
                <div className="bundleTwoThirds">
                  {subscriptions.map( (subscription, idx) => (
                    <div key={idx} className="bundleBuilderCard">
                        <div className={styles.contentCardWrapper}>
                            <div className={styles.contentCardNavigation}>
                              <div>
                                <h3>Current Order</h3>
                                <p>{subscription.subscriptionType} {subscription.subscriptionSubType}</p>
                              </div>
                              {/* <Link to={`/edit-order/${subscription.subId}?date=${subscription.date}`} className="secondaryButton">Edit Order</Link> */}
                            </div>
                            <div className={styles.currentOrderMenu}>
                                {subscription.items.map((item, index) => (
                                    index < 3 ? <MenuItemCard key={index} title={item.title} image={item.platform_img} quantity={item.quantity} type={item.type}  width="27%" /> : ''
                                ))}
                                <Link to={`/account?date=${subscription.date}`} className={styles.seeAllMenu}>
                                    See All <ChevronRightMinor />
                                </Link>
                            </div>
                        </div>
                        <div className={styles.contentCardWrapper}>
                            <div className={styles.contentCardNavigation}>
                                <h3 className={styles.underlinedHeader}>Current Order Date</h3>
                                {/* <DeliveryDayModal label="Edit" deliveryDay={subscription.deliveryDay} onChange={updateDelivery} /> */}
                            </div>
                            <div className={styles.currentOrderMenu}>
                                <p>Delivery Day: {dayjs().day(subscription.deliveryDay).format('dddd')}</p>
                            </div>
                        </div>
                    </div>
                  ))}
                </div>
            </div>
        </div>
    )
}

export default PlanSettings