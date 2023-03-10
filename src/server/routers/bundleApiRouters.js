const app = require('express').Router()
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const { request, objectToQueryString } = require('../utils')

app.get('/health', async (req, res) => {
  res.status(200).send({
    message: 'Ok'
  })
})

app.post('/bundle-api/token/guest', async (req, res) => {
  const response = await request(`${process.env.BUNDLE_API_URL}/api/auth`, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${process.env.BUNDLE_API_SECRET}`
    },
    data: {
      shop: req.body.shop
    }
  })

  return res.status(response.status).send(response.data)
})

app.post('/bundle-api/token/account', async (req, res) => {
  const response = await request(
    `${process.env.BUNDLE_API_URL}/api/auth/user`,
    {
      method: 'post',
      headers: {
        Accept: 'application/json',
        authorization: `Bearer ${process.env.BUNDLE_API_SECRET}`
      },
      data: {
        shop: req.body.shop,
        email: req.body.email
      }
    }
  )

  if (response.data.token) {
    return res.status(200).send(response.data)
  }

  res.status(400).send({
    message: 'Can not retrieve token'
  })
})

app.post(
  '/bundle-api/subscriptions/:subscriptionId/orders',
  async (req, res) => {
    const response = await request(
      `${process.env.BUNDLE_API_URL}/api/subscriptions/${req.params.subscriptionId}/orders`,
      {
        method: 'post',
        headers: {
          Accept: 'application/json',
          authorization: req.headers.authorization
        },
        data: {
          platform_order_id: req.body.platform_order_id,
          bundle_configuration_content_id:
            req.body.bundle_configuration_content_id,
          items: [...req.body.items]
        }
      }
    )
    if (response.data) {
      return res.status(200).send(response.data)
    }

    res.status(400).send({
      message: 'Can not retrieve menu items'
    })
  }
)

app.put(
  '/bundle-api/subscriptions/:subscriptionId/orders/:subscriptionContentId',
  async (req, res) => {
    const response = await request(
      `${process.env.BUNDLE_API_URL}/api/subscriptions/${req.params.subscriptionId}/orders/${req.params.subscriptionContentId}`,
      {
        method: 'put',
        headers: {
          Accept: 'application/json',
          authorization: req.headers.authorization
        },
        data: {
          items: [...req.body.items],
          bundle_configuration_content: {
            id: req.body.bundle_configuration_content_id,
            is_enabled: req.body.is_enabled
          }
        }
      }
    )
    if (response.data) {
      return res.status(200).send(response.data)
    }

    res.status(400).send({
      message: 'Can not retrieve menu items'
    })
  }
)

app.get(
  '/bundle-api/subscriptions/:subscriptionId/orders',
  async (req, res) => {
    const response = await request(
      `${process.env.BUNDLE_API_URL}/api/subscriptions/${req.params.subscriptionId}/orders`,
      {
        method: 'get',
        headers: {
          Accept: 'application/json',
          authorization: req.headers.authorization
        }
      }
    )

    if (response.data) {
      return res.status(200).send(response.data)
    }

    res.status(400).send({
      message: 'Can not retrieve menu items'
    })
  }
)

app.get('/bundle-api/subscriptions', async (req, res) => {
  const queryString = objectToQueryString(req.query)
  const response = await request(
    `${process.env.BUNDLE_API_URL}/api/subscriptions?${queryString}`,
    {
      method: 'get',
      headers: {
        Accept: 'application/json',
        authorization: req.headers.authorization
      }
    }
  )
  if (response.data) {
    return res.status(200).send(response.data)
  }

  res.status(400).send({
    message: 'Can not retrieve menu items'
  })
})

app.get('/bundle-api/bundles/:bundleId/configurations', async (req, res) => {
  const queryString = objectToQueryString(req.query)
  const response = await request(
    `${process.env.BUNDLE_API_URL}/api/bundles/${req.params.bundleId}/configurations?${queryString}`,
    {
      method: 'get',
      headers: {
        Accept: 'application/json',
        authorization: req.headers.authorization
      }
    }
  )
  return res.status(response.status).send(response.data)
})

app.get(
  '/bundle-api/bundles/:bundleId/configurations/:configurationId',
  async (req, res) => {
    const response = await request(
      `${process.env.BUNDLE_API_URL}/api/bundles/${req.params.bundleId}/configurations/${req.params.configurationId}`,
      {
        method: 'get',
        headers: {
          Accept: 'application/json',
          authorization: req.headers.authorization
        }
      }
    )
    return res.status(response.status).send(response.data)
  }
)

app.get(
  '/bundle-api/bundles/:bundleId/configurations/:configurationId/contents/:contentId',
  async (req, res) => {
    const response = await request(
      `${process.env.BUNDLE_API_URL}/api/bundles/${req.params.bundleId}/configurations/${req.params.configurationId}/contents/${req.params.contentId}`,
      {
        method: 'get',
        headers: {
          Accept: 'application/json',
          authorization: req.headers.authorization
        }
      }
    )
    return res.status(response.status).send(response.data)
  }
)

app.get(
  '/bundle-api/bundles/:bundleId/configurations/:configurationId/contents',
  async (req, res) => {
    const queryString = objectToQueryString(req.query)
    const response = await request(
      `${process.env.BUNDLE_API_URL}/api/bundles/${req.params.bundleId}/configurations/${req.params.configurationId}/contents?${queryString}`,
      {
        method: 'get',
        headers: {
          Accept: 'application/json',
          authorization: req.headers.authorization
        }
      }
    )
    return res.status(response.status).send(response.data)
  }
)

app.get(
  '/bundle-api/bundles/:bundleId/configurations/:configurationId/contents/:contentsId/products',
  async (req, res) => {
    const queryString = objectToQueryString(req.query)
    const response = await request(
      `${process.env.BUNDLE_API_URL}/api/bundles/${req.params.bundleId}/configurations/${req.params.configurationId}/contents/${req.params.contentsId}/products?${queryString}`,
      {
        method: 'get',
        headers: {
          Accept: 'application/json',
          authorization: req.headers.authorization
        }
      }
    )
    return res.status(response.status).send(response.data)
  }
)

app.get('/bundle-api/bundles/:bundleId', async (req, res) => {
  const queryString = objectToQueryString(req.query)

  const response = await request(
    `${process.env.BUNDLE_API_URL}/api/bundles/${req.params.bundleId}?${queryString}`,
    {
      method: 'get',
      headers: {
        Accept: 'application/json',
        authorization: req.headers.authorization
      }
    }
  )

  return res.status(response.status).send(response.data)
})

app.get('/bundle-api/bundles-query', async (req, res) => {
  const queryString = objectToQueryString(req.query)

  const response = await request(
    `${process.env.BUNDLE_API_URL}/api/bundles?${queryString}`,
    {
      method: 'get',
      headers: {
        Accept: 'application/json',
        authorization: req.headers.authorization
      }
    }
  )

  return res.status(response.status).send(response.data)
})

app.post('/bundle-api/carts', async (req, res) => {
  const response = await request(`${process.env.BUNDLE_API_URL}/api/carts`, {
    method: 'post',
    headers: {
      Accept: 'application/json',
      authorization: req.headers.authorization
    },
    data: req.body
  })

  return res.status(response.status).send(response.data)
})

app.get('/bundle-api/delivery-dates', async (req, res) => {
  console.log('GET', `${process.env.BUNDLE_API_URL}/api/delivery-dates`, req.headers)
  try {
    const response = await request(`${process.env.BUNDLE_API_URL}/api/delivery-dates`, {
      method: 'get',
      headers: {
        Accept: 'application/json',
        authorization: req.headers.authorization
      }
    })
    console.log(response)
    return res.status(response.status).send(response.data)
  }catch (error){
    console.log(error)
  }
})

module.exports = app
