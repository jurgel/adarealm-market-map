<script setup>
import { onMounted, ref } from 'vue'
import Plotly from 'plotly.js-dist-min'
import axios from 'axios'

defineProps({})

const plot = ref(null)

defineExpose({ plot })

const minX = -100
const maxX = 100
const minY = -100
const maxY = 100

const plotData = [
  {
    z: [],
    x: [],
    y: [],
    text: [],
    type: 'heatmap',
    hoverongaps: false,
    hovertemplate:
      '<b>%{text.name}</b><br><br>Plot %{x}, %{y}<br>Price: %{z}' +
      '<extra></extra>',
  },
]

const plotLayout = {
  title: 'Ada Realm Market Map',
  xaxis: {
    range: [minX, maxX],
    fixedrange: true,
    zeroline: false,
    dtick: 25,
  },
  yaxis: {
    range: [maxY, minY],
    fixedrange: true,
    zeroline: false,
    dtick: 25,
  },
}

const plotConfig = {
  displayModeBar: false,
}

const itemPerPage = 24
const priceMul = 1000000

let priceMin = ref(1)
let priceMax = ref(50)
//let saleTypes = ["listing", "offer", "auction"];
let saleTypeListing = ref(true)
let saleTypeOffer = ref(true)
let saleTypeAuction = ref(false)
let featureSmartContract = ref(false)

let curRequestId = 0
let curPriceMin = priceMin.value
let curPriceMax = priceMax.value
let curSaleTypeListing = saleTypeListing.value
let curSaleTypeOffer = saleTypeOffer.value
let curSaleTypeAuction = saleTypeAuction.value
let curFeatureSmartContract = featureSmartContract.value

let loadingItemCount = ref(0)
let loadingPage = ref(1)
let loadingMaxPage = ref(0)

for (var i = minX; i <= maxX; i++) {
  plotData[0].x.push(i)
}

for (var i = minY; i <= maxY; i++) {
  plotData[0].y.push(i)
}

const loadCnft = function (page) {
  const saleTypes = []
  if (curSaleTypeListing) {
    saleTypes.push('listing')
  }
  if (curSaleTypeOffer) {
    saleTypes.push('offer')
  }
  if (curSaleTypeAuction) {
    saleTypes.push('auction')
  }

  return axios.post('https://api.cnft.io/market/listings', {
    search: 'b5240b3ae40bca2cc56b0fdfd7553724ccd18c56a98937d6b6f76265',
    types: saleTypes,
    project: 'Ada Realm',
    sort: { _id: -1 },
    priceMin: curPriceMin * priceMul,
    priceMax: curPriceMax * priceMul,
    page: page,
    verified: true,
    nsfw: false,
    sold: false,
    smartContract: curFeatureSmartContract,
  })
}

const loadCnftAll = function (requestId, page) {
  loadingPage.value = page
  loadCnft(page)
    .then((response) => {
      if (
        requestId === curRequestId &&
        response &&
        response.data &&
        response.data.results
      ) {
        loadingItemCount.value = response.data.count
        loadingMaxPage.value = Math.ceil(response.data.count / itemPerPage)

        response.data.results.forEach((el) => {
          const ty = el.asset.metadata.Coordinates.y - minY
          const tx = el.asset.metadata.Coordinates.x - minX
          plotData[0].z[ty][tx] = el.price / priceMul
          plotData[0].text[ty][tx] = {
            id: el._id,
            name: el.asset.assetId,
          }
        })

        Plotly.redraw('plot')

        if (page < loadingMaxPage.value) {
          loadCnftAll(requestId, page + 1)
        }
      }
    })
    .catch((error) => {
      console.log(error)
    })
}

const resetMarketData = function () {
  for (var y = 0; y <= maxY - minY; y++) {
    plotData[0].z[y] = []
    plotData[0].text[y] = []
  }

  for (var y = 0; y <= maxY - minY; y++) {
    for (var x = 0; x <= maxX - minX; x++) {
      plotData[0].z[y][x] = null
      plotData[0].text[y][x] = {}
    }
  }
}

const loadMarketData = function () {
  curRequestId++
  curPriceMin = priceMin.value
  curPriceMax = priceMax.value
  curSaleTypeListing = saleTypeListing.value
  curSaleTypeOffer = saleTypeOffer.value
  curSaleTypeAuction = saleTypeAuction.value
  curFeatureSmartContract = featureSmartContract.value

  resetMarketData()
  loadCnftAll(curRequestId, 1)
}

onMounted(() => {
  Plotly.newPlot('plot', plotData, plotLayout, plotConfig)

  plot.value.on('plotly_click', function (data) {
    if (data && data.points && data.points[0] && data.points[0].text) {
      window.open('https://cnft.io/token/' + data.points[0].text.id)
    }
  })
})
</script>

<template>
  <div class="container mx-auto my-8">
    <div class="max-w-lg mx-auto px-2">
      <div class="my-4">
        <div class="text-base font-medium text-gray-900">Price Range</div>
        <div class="flex items-center justify-between">
          <div class="mr-1">
            <label
              for="min-price"
              class="block text-sm font-medium text-gray-700"
            >
              Min Price
            </label>
            <input
              v-model="priceMin"
              type="number"
              name="min-price"
              class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div class="ml-1">
            <label
              for="max-price"
              class="block text-sm font-medium text-gray-700"
            >
              Max Price
            </label>
            <input
              v-model="priceMax"
              type="number"
              name="max-price"
              class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      <div class="my-4">
        <div class="text-base font-medium text-gray-900">Sale Type</div>
        <div class="flex items-center justify-between">
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input
                v-model="saleTypeAuction"
                name="auctioned"
                type="checkbox"
                class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div class="ml-3 text-sm">
              <label for="auctioned" class="font-medium text-gray-700">
                Auctioned
              </label>
            </div>
          </div>
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input
                v-model="saleTypeListing"
                name="fixed-price"
                type="checkbox"
                class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div class="ml-3 text-sm">
              <label for="fixed-price" class="font-medium text-gray-700">
                Fixed Price
              </label>
            </div>
          </div>
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input
                v-model="saleTypeOffer"
                name="open-offers"
                type="checkbox"
                class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div class="ml-3 text-sm">
              <label for="open-offers" class="font-medium text-gray-700">
                Open to offers
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="my-4">
        <div class="text-base font-medium text-gray-900">Features</div>
        <div class="flex items-start">
          <div class="flex items-center h-5">
            <input
              v-model="featureSmartContract"
              name="smart-contract"
              type="checkbox"
              class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
          </div>
          <div class="ml-3 text-sm">
            <label for="smart-contract" class="font-medium text-gray-700">
              Smart Contract
            </label>
          </div>
        </div>
      </div>

      <div class="my-4">
        <button
          type="button"
          class="w-full bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          @click="loadMarketData"
        >
          Search
        </button>
      </div>

      <div class="my-4">
        <p v-if="loadingMaxPage > 0" class="text-center text-sm text-gray-500">
          {{ loadingItemCount }} Assets | Page {{ loadingPage }} of
          {{ loadingMaxPage }}
        </p>
      </div>
    </div>

    <div
      id="plot"
      ref="plot"
      class="mx-auto aspect-square object-contain max-h-screen max-w-full"
    ></div>

    <div class="max-w-lg mx-auto px-2">
      <p class="my-2 text-sm text-gray-500 text-center">
        Market data from CNFT.IO
      </p>
    </div>
  </div>
</template>

<style scoped>
.plot {
  width: 800px;
  height: 800px;
}
</style>
