<script setup>
import { onMounted, ref } from 'vue'
import Plotly from 'plotly.js-dist-min'
import axios from 'axios'
import adarealm_map from '../assets/adarealm_map.png'

defineProps({})

const plot = ref(null)

defineExpose({ plot })

const adarealmPolicy =
  'b5240b3ae40bca2cc56b0fdfd7553724ccd18c56a98937d6b6f76265'
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
  {
    x: [],
    y: [],
    text: [],
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: 6,
      color: 'rgb(204, 0, 255)',
    },
    hovertemplate:
      '<b>%{text.name}</b><br><br>Plot %{x}, %{y}' + '<extra></extra>',
  },
]

const plotLayout = {
  title: 'Ada Realm Map',
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
  images: [
    {
      source: adarealm_map,
      xref: 'x',
      yref: 'y',
      x: -131,
      y: -106,
      sizex: 235,
      sizey: 235,
      sizing: 'stretch',
      layer: 'below',
    },
  ],
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
let walletAddress = ref('')

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
let walletAssetCount = ref(0)

for (var i = minX; i <= maxX; i++) {
  plotData[0].x.push(i)
}

for (var i = minY; i <= maxY; i++) {
  plotData[0].y.push(i)
}

const apiCnft = function (page) {
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
    search: adarealmPolicy,
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

const loadCnft = function (requestId, page) {
  loadingPage.value = page
  apiCnft(page)
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
          loadCnft(requestId, page + 1)
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
  loadCnft(curRequestId, 1)
}

const apiPoolWallet = function () {
  return axios.get('https://pool.pm/wallet/' + walletAddress.value)
}

const loadPoolWallet = function () {
  walletAssetCount.value = 0
  if (walletAddress.value.length > 0) {
    apiPoolWallet()
      .then((response) => {
        if (response && response.data && response.data.tokens) {
          response.data.tokens.forEach((el) => {
            if (el.policy === adarealmPolicy) {
              const ty = el.metadata.Coordinates.y
              const tx = el.metadata.Coordinates.x
              plotData[1].y.push(ty)
              plotData[1].x.push(tx)
              plotData[1].text.push({
                name: el.name,
              })

              walletAssetCount.value++
            }
          })

          Plotly.redraw('plot')
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }
}

const resetWalletData = function () {
  plotData[1].y = []
  plotData[1].x = []
}

const loadWalletData = function () {
  resetWalletData()
  loadPoolWallet()
}

const clearMap = function () {
  curRequestId++
  resetMarketData()
  resetWalletData()

  Plotly.redraw('plot')
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
    <!-- Wallet Form -->
    <div class="max-w-lg mx-auto px-2">
      <div class="my-4">
        <div class="text-base font-medium text-gray-900">Wallet</div>
        <div class="">
          <label
            for="wallet-address"
            class="block text-sm font-medium text-gray-700"
          >
            Address
          </label>
          <input
            v-model="walletAddress"
            type="text"
            name="wallet-address"
            class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div class="my-4">
        <button
          type="button"
          class="w-full bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-white disabled:text-gray-400 disabled:border-slate-200"
          :disabled="walletAddress.length <= 0"
          @click="loadWalletData"
        >
          Load Wallet
        </button>
      </div>

      <div class="my-4">
        <p
          v-if="walletAssetCount > 0"
          class="text-center text-sm text-gray-500"
        >
          {{ walletAssetCount }} Assets
        </p>
      </div>
    </div>

    <!-- Market Form -->
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
          Search Market
        </button>
      </div>

      <div class="my-4">
        <p v-if="loadingMaxPage > 0" class="text-center text-sm text-gray-500">
          {{ loadingItemCount }} Assets | Page {{ loadingPage }} of
          {{ loadingMaxPage }}
        </p>
      </div>
    </div>

    <div class="max-w-lg mx-auto px-2">
      <div class="my-4">
        <button
          type="button"
          class="w-full bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-white disabled:text-gray-400 disabled:border-slate-200"
          @click="clearMap"
        >
          Clear Map
        </button>
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
