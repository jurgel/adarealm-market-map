<script setup>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import Map from './components/Map.vue'
</script>

<template>
  <div>
    <Map />

    <div class="max-w-lg mx-auto mt-16 mb-8 text-center">
      <h1
        class="text-base text-indigo-600 font-semibold tracking-wide uppercase"
      >
        Donation
      </h1>
      <p class="my-2 text-lg text-gray-500">
        If you find this service useful, any donation is appreciated.
      </p>
      <div class="flex flex-col items-center justify-center">
        <div class="my-2">
          <img src="./assets/donation_qr.png" class="max-h-24" />
        </div>
        <div class="my-2">
          addr1qyf86ddk8hntejeducer7gdq4sh3k880t3n8nuvmv78w22hh3m2e0adnurjvlnpe0zmez982l0nkvacnjlwg9knytvvqkdfyyp
        </div>
      </div>
    </div>
  </div>
</template>

<style></style>
