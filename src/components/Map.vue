<script setup>
import { onMounted, ref, watch } from 'vue'
import Plotly from 'plotly.js-dist-min'
import axios from 'axios'
import adarealm_map from '../assets/adarealm_map.png'
import adarealm_id_to_coord from '../assets/adarealm_id_to_coord.json'
import adarealm_coord_to_id from '../assets/adarealm_coord_to_id.json'

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
      '<b>%{text.name}</b><br><br>Plot %{x}, %{y}<br>Price: %{z}<br>Type: %{text.subtype}' +
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
      color: 'rgb(153, 102, 255)',
    },
    hovertemplate:
      '<b>%{text.name}</b><br><br>Plot %{x}, %{y}<br>Address 1' +
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
      color: 'rgb(255, 102, 102)',
    },
    hovertemplate:
      '<b>%{text.name}</b><br><br>Plot %{x}, %{y}<br>Address 2' +
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
      color: 'rgb(0, 0, 0)',
    },
    hovertemplate:
      '<b>%{text.name}</b><br><br>Plot %{x}, %{y}' + '<extra></extra>',
  },
]

const plotLayout = {
  title: 'Ada Realm Map',
  showlegend: false,
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
  shapes: [
    {
      line: {
        color: 'rgb(0, 0, 0)',
        width: 1,
      },
      fillcolor: 'rgba(0, 0, 0, 0.5)',
      type: 'rect',
      xref: 'x',
      yref: 'y',
      x0: 20,
      y0: -50,
      x1: 34,
      y1: -36,
    },
  ],
}

const plotConfig = {
  displayModeBar: false,
}

const itemPerPage = 24
const priceMul = 1000000

let priceMin = ref(1000)
let priceMax = ref(1)
//let saleTypes = ["listing", "offer", "auction", "bundle"];
let saleTypeListing = ref(true)
let saleTypeOffer = ref(true)
let saleTypeAuction = ref(false)
let saleTypeBundle = ref(false)
let featureSmartContract = ref(true)
let walletAddress1 = ref('')
let walletAddress2 = ref('')
let coordId = ref('')
let coordX = ref(0)
let coordY = ref(0)

let curRequestId = 0
let curPriceMin = priceMin.value
let curPriceMax = priceMax.value
let curSaleTypeListing = saleTypeListing.value
let curSaleTypeOffer = saleTypeOffer.value
let curSaleTypeAuction = saleTypeAuction.value
let curSaleTypeBundle = saleTypeBundle.value
let curFeatureSmartContract = featureSmartContract.value

let loadingItemCount = ref(0)
let loadingPage = ref(1)
let loadingMaxPage = ref(0)
let wallet1AssetCount = ref(0)
let wallet2AssetCount = ref(0)

for (var i = minX; i <= maxX; i++) {
  plotData[0].x.push(i)
}

for (var i = minY; i <= maxY; i++) {
  plotData[0].y.push(i)
}

const resetCoord = function () {
  plotData[3].x = []
  plotData[3].y = []
  plotData[3].text = []
}

watch([coordX, coordY], (val) => {
  resetCoord()

  const id = adarealm_coord_to_id[val[0] + ',' + val[1]]
  if (id) {
    coordId.value = 'AdaRealmPlot' + id

    plotData[3].x.push(val[0])
    plotData[3].y.push(val[1])
    plotData[3].text.push({
      type: 'coord',
      name: coordId.value,
    })
  } else {
    coordId.value = ''
  }

  Plotly.redraw('plot')
})

watch(coordId, (val) => {
  if (val.substring(0, 12) !== 'AdaRealmPlot') return
  const id = parseInt(coordId.value.replace('AdaRealmPlot', ''))
  const coord = adarealm_id_to_coord[id]
  if (coord) {
    coordX.value = coord[0]
    coordY.value = coord[1]
  } else {
    coordX.value = 0
    coordY.value = 0
  }
})

const apiCnftInit = function () {
  return axios.post('https://api.cnft.io/market/listings', {
    search: adarealmPolicy,
    types: ['listing', 'offer'],
    project: 'Ada Realm',
    sort: { price: 1 },
    page: 1,
    verified: true,
    nsfw: false,
    sold: false,
    smartContract: true,
    priceMin: null,
    priceMax: null,
  })
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
  if (curSaleTypeBundle) {
    saleTypes.push('bundle')
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

const initCnft = function () {
  loadingPage.value = 1
  apiCnftInit()
    .then((response) => {
      if (response && response.data && response.data.results) {
        loadingItemCount.value = response.data.count
        loadingMaxPage.value = Math.ceil(response.data.count / itemPerPage)

        response.data.results.forEach((el) => {
          const tprice = el.price / priceMul
          const ty = el.assets[0].metadata.Coordinates.y - minY
          const tx = el.assets[0].metadata.Coordinates.x - minX

          if (priceMin.value > tprice) {
            priceMin.value = tprice
          }
          if (priceMax.value < tprice) {
            priceMax.value = tprice
          }

          plotData[0].z[ty][tx] = tprice
          plotData[0].text[ty][tx] = {
            type: 'cnft',
            id: el._id,
            name: el.assets[0].assetId,
            subtype: el.type,
          }
        })

        Plotly.redraw('plot')
      }
    })
    .catch((error) => {
      console.log(error)
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
          const tprice = el.price / priceMul
          let tsubtype = el.type
          if (el.type === 'bundle') {
            tsubtype += '|' + el._id.substring(el._id.length - 5)
          }

          el.assets.forEach((asset) => {
            const ty = asset.metadata.Coordinates.y - minY
            const tx = asset.metadata.Coordinates.x - minX
            plotData[0].z[ty][tx] = tprice
            plotData[0].text[ty][tx] = {
              type: 'cnft',
              id: el._id,
              name: asset.assetId,
              subtype: tsubtype,
            }
          })
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

const initMarketData = function () {
  resetMarketData()
  initCnft()
}

const loadMarketData = function () {
  curRequestId++
  curPriceMin = priceMin.value
  curPriceMax = priceMax.value
  curSaleTypeListing = saleTypeListing.value
  curSaleTypeOffer = saleTypeOffer.value
  curSaleTypeAuction = saleTypeAuction.value
  curSaleTypeBundle = saleTypeBundle.value
  curFeatureSmartContract = featureSmartContract.value

  resetMarketData()
  loadCnft(curRequestId, 1)
}

const apiPoolWallet = function (walletAddress) {
  return axios.get('https://pool.pm/wallet/' + walletAddress)
}

const loadPoolWallet = function (walletId, walletAddress) {
  apiPoolWallet(walletAddress)
    .then((response) => {
      if (response && response.data && response.data.tokens) {
        response.data.tokens.forEach((el) => {
          if (el.policy === adarealmPolicy) {
            const ty = el.metadata.Coordinates.y
            const tx = el.metadata.Coordinates.x
            plotData[walletId].y.push(ty)
            plotData[walletId].x.push(tx)
            plotData[walletId].text.push({
              type: 'pool',
              name: el.name,
            })
          }
        })

        if (walletId === 1) {
          wallet1AssetCount.value = plotData[walletId].x.length
        } else if (walletId === 2) {
          wallet2AssetCount.value = plotData[walletId].x.length
        }

        Plotly.redraw('plot')
      }
    })
    .catch((error) => {
      console.log(error)
    })
}

const resetWalletData = function (walletId) {
  plotData[walletId].x = []
  plotData[walletId].y = []
  plotData[walletId].text = []
}

const loadWalletData = function () {
  resetWalletData(1)
  resetWalletData(2)

  if (walletAddress1.value.length > 0) {
    loadPoolWallet(1, walletAddress1.value)
  }

  if (walletAddress2.value.length > 0) {
    loadPoolWallet(2, walletAddress2.value)
  }
}

const clearMap = function () {
  curRequestId++
  resetMarketData()
  resetWalletData(1)
  resetWalletData(2)
  resetCoord()

  Plotly.redraw('plot')
}

onMounted(() => {
  Plotly.newPlot('plot', plotData, plotLayout, plotConfig)

  plot.value.on('plotly_click', function (data) {
    if (data && data.points && data.points[0] && data.points[0].text) {
      const type = data.points[0].text.type
      if (type === 'cnft') {
        window.open('https://cnft.io/token/' + data.points[0].text.id)
      } else if (type === 'pool' || type === 'coord') {
        window.open(
          'https://pool.pm/' + adarealmPolicy + '.' + data.points[0].text.name
        )
      }
    }
  })

  initMarketData()
})
</script>

<template>
  <div class="container mx-auto my-8">
    <!-- Coord -->
    <div class="max-w-lg mx-auto px-2">
      <div class="my-4">
        <div class="text-base font-medium text-gray-900">Coordinate</div>
        <div class="flex items-center justify-between">
          <div class="mr-1 flex-none w-32">
            <label
              for="coord-x"
              class="block text-sm font-medium text-gray-700"
            >
              X
            </label>
            <input
              v-model="coordX"
              type="number"
              name="coord-x"
              class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div class="mx-1 flex-none w-32">
            <label
              for="coord-y"
              class="block text-sm font-medium text-gray-700"
            >
              Y
            </label>
            <input
              v-model="coordY"
              type="number"
              name="coord-y"
              class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div class="ml-1">
            <label
              for="coord-id"
              class="block text-sm font-medium text-gray-700"
            >
              ID
            </label>
            <input
              v-model="coordId"
              type="text"
              name="coord-id"
              class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Wallet Form -->
    <div class="max-w-lg mx-auto px-2">
      <div class="my-4">
        <div class="text-base font-medium text-gray-900">Wallet</div>
        <div>
          <label
            for="wallet-address-1"
            class="block text-sm font-medium text-gray-700"
          >
            Address 1
          </label>
          <input
            v-model="walletAddress1"
            type="text"
            name="wallet-address-1"
            class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
        <div class="mt-2">
          <label
            for="wallet-address-2"
            class="block text-sm font-medium text-gray-700"
          >
            Address 2
          </label>
          <input
            v-model="walletAddress2"
            type="text"
            name="wallet-address-2"
            class="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div class="my-4">
        <button
          type="button"
          class="w-full bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-white disabled:text-gray-400 disabled:border-slate-200"
          :disabled="walletAddress1.length <= 0"
          @click="loadWalletData"
        >
          Load Wallet
        </button>
      </div>

      <div class="my-4">
        <p
          v-if="wallet1AssetCount > 0"
          class="text-center text-sm text-gray-500"
        >
          {{ wallet1AssetCount }} Assets
          <span v-if="wallet2AssetCount > 0">
            | {{ wallet2AssetCount }} Assets
          </span>
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
          <div class="flex items-start">
            <div class="flex items-center h-5">
              <input
                v-model="saleTypeBundle"
                name="bundled"
                type="checkbox"
                class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
              />
            </div>
            <div class="ml-3 text-sm">
              <label for="bundled" class="font-medium text-gray-700">
                Bundled
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
        Market data from CNFT.IO<br />
        Wallet data from pool.pm
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
