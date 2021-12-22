const EMPTY_STATE_IMAGE =
  'https://cdn.shopify.com/shopifycloud/shopify/assets/no-image-2048-5e88c1b20e087fb7bbe9a3771824e743c244f437e4f8ba93bbf7b11b53f7824c_750x.gif'

const filterShopifyProducts = async (items, shopifyProducts) =>
  new Promise((resolve) => {
    console.log('filterShopifyProducts', items, shopifyProducts)
    const apiProductIds = items.map((i) => Number(i.platform_product_id))
    console.log('apiProductIds', apiProductIds)
    const filteredProducts = shopifyProducts.filter((p) =>
      apiProductIds.includes(p.id)
    )
    console.log('filteredProducts', filteredProducts)
    const mappedProducts = filteredProducts.map((product) => ({
      ...product,
      bundle_configuration_content_id: items.find(
        (i) => Number(i.platform_product_id) === Number(product.id)
      ).bundle_configuration_contents_id
    }))

    resolve(mappedProducts)
  })

const filterShopifyVariants = async (state, shopifyProducts, configuration) =>
  new Promise((resolve) => {
    console.log('filterShopifyVariants', shopifyProducts, configuration)
    const filteredVariants = []
    const formattedString = (value) => {
      return value.toLowerCase().split(' ').join('')
    }

    for (const product of shopifyProducts) {
      const filtered = product.variants.filter((variant) => {
        // TODO: remove console log
        console.log('filter variants', variant.options)
        const formattedOptions = variant.options.map((option) =>
          formattedString(option)
        )

        return (
          formattedOptions.includes(formattedString(state.entreeType.title)) &&
          formattedOptions.includes(formattedString(state.entreeSubType.title))
        )
      })

      filtered.map((f) => {
        f.images = product.images
        f.configurationBundleId = configuration.bundleId
        f.configurationContentId = product.bundle_configuration_content_id
        f.description = product.description
        f.bundleContentId = configuration.id
        f.quantity = 0
        f.type = configuration.title

        if (f.name.includes('-')) {
          f.name = f.name.split('-')[0]
        }

        return f
      })

      if (filtered.length > 0) {
        filteredVariants.push(...filtered)
      }
    }

    resolve(filteredVariants)
  })

const getOrderTrackingUrl = async (orderId, shopCustomer) =>
  new Promise((resolve) => {
    let orderLink = ''
    if (shopCustomer.orders.length > 0) {
      const foundOrder = shopCustomer.orders.filter(
        (ord) => Number(ord.id) === orderId
      )
      if (foundOrder.length > 0) {
        if (foundOrder[0].fulfillments.length > 0) {
          orderLink = foundOrder[0].fulfillments[0].trackingUrl
        } else {
          orderLink = foundOrder[0].orderLink
        }
      }
    }
    resolve(orderLink)
  })

const buildProductArrayFromVariant = async (items, subType, shopProducts) =>
  new Promise((resolve) => {
    const foundProductArray = []
    for (const variant of items) {
      const variantId = variant.platform_product_variant_id
      for (const product of shopProducts) {
        const variant = product.variants.filter((v) => v.id === variantId)
        if (product.variants.filter((v) => v.id === variantId).length > 0) {
          foundProductArray.push({
            title: product.title,
            platform_img:
              product.images.length > 0 ? product.images[0] : EMPTY_STATE_IMAGE,
            quantity: variant.quantity,
            type: subType
          })
        }
      }
    }
    resolve(foundProductArray)
  })

const buildProductArrayFromId = async (items, subType, shopProducts) =>
  new Promise((resolve) => {
    const foundProductArray = []
    for (const item of items) {
      const variant = shopProducts.filter(
        (p) => p.id === item.platform_product_id
      )[0]
      if (
        shopProducts.filter((p) => p.id === item.platform_product_id).length > 0
      ) {
        foundProductArray.push({
          title: variant.title,
          platform_img:
            variant?.images.length > 0 ? variant.images[0] : EMPTY_STATE_IMAGE,
          quantity: item.default_quantity,
          type: subType
        })
      }
    }
    resolve(foundProductArray)
  })

export {
  filterShopifyProducts,
  filterShopifyVariants,
  getOrderTrackingUrl,
  buildProductArrayFromVariant,
  buildProductArrayFromId
}