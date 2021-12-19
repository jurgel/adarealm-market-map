import { createApp } from 'vue'
import App from './App.vue'
import axios from 'axios'
import VueAxios from 'vue-axios'
import VueGtag from 'vue-gtag-next'
import './index.css'

const app = createApp(App)

app.use(VueAxios, axios)
app.use(VueGtag, {
  property: {
    id: 'G-5412NGB8K4',
    params: {
      send_page_view: true,
    },
  },
})

app.mount('#app')
