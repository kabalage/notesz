<script setup lang="ts">
import { ref, onMounted } from 'vue';

const persisted = ref<boolean|null>(null);
const persistResult = ref<boolean|null>(null);

onMounted(async () => {
  if (navigator.storage) {
    persisted.value = await navigator.storage.persisted();
  }
});

async function persist() {
  persistResult.value = await navigator.storage.persist();
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-cyan-300 mb-4 text-center mt-16">
      Developer sandbox
    </h1>
    <div>
      <div>
        <button @click="persist()">persist</button> ({{ persisted }},  {{ persistResult }})
      </div>
      <div><a href="https://vercel.com">External link</a></div>
    </div>
    <div class="grid grid-cols-6  gap-2 sm:gap-4 mt-8">
      <!-- <div class="w-6 h-6 rounded bg-indigo-900"></div>
      <div class="w-6 h-6 rounded bg-indigo-800"></div>
      <div class="w-6 h-6 rounded bg-indigo-700"></div>
      <div class="w-6 h-6 rounded bg-indigo-600"></div>
      <div class="w-6 h-6 rounded bg-indigo-500"></div>
      <div class="w-6 h-6 rounded bg-indigo-400"></div> -->

      <!-- <div class="w-6 h-6 rounded bg-indigo-50"></div>
      <div class="w-6 h-6 rounded bg-indigo-100"></div>
      <div class="w-6 h-6 rounded bg-indigo-200"></div>
      <div class="w-6 h-6 rounded bg-indigo-300"></div>
      <div class="w-6 h-6 rounded bg-indigo-400"></div>
      <div class="w-6 h-6 rounded bg-indigo-500"></div> -->

      <div class="h-6 rounded bg-indigo-500/10"></div>
      <div class="h-6 rounded bg-indigo-500/20"></div>
      <div class="h-6 rounded bg-indigo-500/20"></div>
      <div class="h-6 rounded bg-indigo-500/40"></div>
      <div class="h-6 rounded bg-indigo-500/60"></div>
      <div class="h-6 rounded bg-indigo-500/80"></div>
      <!-- <div class="h-6 rounded bg-indigo-500/100"></div> -->

      <div class="h-6 rounded bg-indigo-400/10"></div>
      <div class="h-6 rounded bg-indigo-400/20"></div>
      <div class="h-6 rounded bg-indigo-400/40"></div>
      <div class="h-6 rounded bg-indigo-400/60"></div>
      <div class="h-6 rounded bg-indigo-400/80"></div>
      <div class="h-6 rounded bg-indigo-400/100"></div>

      <div class="h-6 rounded bg-blue-400/10"></div>
      <div class="h-6 rounded bg-blue-400/20"></div>
      <div class="h-6 rounded bg-blue-400/40"></div>
      <div class="h-6 rounded bg-blue-400/60"></div>
      <div class="h-6 rounded bg-blue-400/80"></div>
      <div class="h-6 rounded bg-blue-400/100"></div>

      <div class="h-6 rounded bg-sky-400/10"></div>
      <div class="h-6 rounded bg-sky-400/20"></div>
      <div class="h-6 rounded bg-sky-400/40"></div>
      <div class="h-6 rounded bg-sky-400/60"></div>
      <div class="h-6 rounded bg-sky-400/80"></div>
      <div class="h-6 rounded bg-sky-400/100"></div>

      <div class="h-6 rounded bg-cyan-400/10"></div>
      <div class="h-6 rounded bg-cyan-400/20"></div>
      <div class="h-6 rounded bg-cyan-400/40"></div>
      <div class="h-6 rounded bg-cyan-400/60"></div>
      <div class="h-6 rounded bg-cyan-400/80"></div>
      <div class="h-6 rounded bg-cyan-400/100"></div>

      <div class="h-6 rounded bg-green-400/10"></div>
      <div class="h-6 rounded bg-green-400/20"></div>
      <div class="h-6 rounded bg-green-400/40"></div>
      <div class="h-6 rounded bg-green-400/60"></div>
      <div class="h-6 rounded bg-green-400/80"></div>
      <div class="h-6 rounded bg-green-400/100"></div>

      <div class="h-6 rounded bg-yellow-400/10"></div>
      <div class="h-6 rounded bg-yellow-400/20"></div>
      <div class="h-6 rounded bg-yellow-400/40"></div>
      <div class="h-6 rounded bg-yellow-400/60"></div>
      <div class="h-6 rounded bg-yellow-400/80"></div>
      <div class="h-6 rounded bg-yellow-400/100"></div>

      <div class="h-6 rounded bg-orange-400/10"></div>
      <div class="h-6 rounded bg-orange-400/20"></div>
      <div class="h-6 rounded bg-orange-400/40"></div>
      <div class="h-6 rounded bg-orange-400/60"></div>
      <div class="h-6 rounded bg-orange-400/80"></div>
      <div class="h-6 rounded bg-orange-400/100"></div>

      <div class="h-6 rounded bg-red-400/10"></div>
      <div class="h-6 rounded bg-red-400/20"></div>
      <div class="h-6 rounded bg-red-400/40"></div>
      <div class="h-6 rounded bg-red-400/60"></div>
      <div class="h-6 rounded bg-red-400/80"></div>
      <div class="h-6 rounded bg-red-400/100"></div>

      <div class="h-6 rounded bg-pink-400/10"></div>
      <div class="h-6 rounded bg-pink-400/20"></div>
      <div class="h-6 rounded bg-pink-400/40"></div>
      <div class="h-6 rounded bg-pink-400/60"></div>
      <div class="h-6 rounded bg-pink-400/80"></div>
      <div class="h-6 rounded bg-pink-400/100"></div>

      <div class="h-6 rounded bg-gray-400/10"></div>
      <div class="h-6 rounded bg-gray-400/20"></div>
      <div class="h-6 rounded bg-gray-400/40"></div>
      <div class="h-6 rounded bg-gray-400/60"></div>
      <div class="h-6 rounded bg-gray-400/80"></div>
      <div class="h-6 rounded bg-gray-400/100"></div>

    </div>

    <div class="grid grid-cols-11 gap-2 sm:gap-4 mt-8">
      <!-- <div class="w-6 h-6 rounded bg-indigo-900"></div>
      <div class="w-6 h-6 rounded bg-indigo-800"></div>
      <div class="w-6 h-6 rounded bg-indigo-700"></div>
      <div class="w-6 h-6 rounded bg-indigo-600"></div>
      <div class="w-6 h-6 rounded bg-indigo-500"></div>
      <div class="w-6 h-6 rounded bg-indigo-400"></div> -->

      <!-- <div class="w-6 h-6 rounded bg-indigo-50"></div>
      <div class="w-6 h-6 rounded bg-indigo-100"></div>
      <div class="w-6 h-6 rounded bg-indigo-200"></div>
      <div class="w-6 h-6 rounded bg-indigo-300"></div>
      <div class="w-6 h-6 rounded bg-indigo-400"></div>
      <div class="w-6 h-6 rounded bg-indigo-500"></div> -->

      <div class="h-6 rounded bg-indigo-1000"></div>
      <div class="h-6 rounded bg-indigo-900"></div>
      <div class="h-6 rounded bg-indigo-800"></div>
      <div class="h-6 rounded bg-indigo-700"></div>
      <div class="h-6 rounded bg-indigo-600"></div>
      <div class="h-6 rounded bg-indigo-500"></div>
      <div class="h-6 rounded bg-indigo-400"></div>
      <div class="h-6 rounded bg-indigo-300"></div>
      <div class="h-6 rounded bg-indigo-200"></div>
      <div class="h-6 rounded bg-indigo-100"></div>
      <div class="h-6 rounded bg-indigo-50"></div>

      <div class="h-6 rounded bg-indigo-500/10"></div>
      <div class="h-6 rounded bg-indigo-500/20"></div>
      <div class="h-6 rounded bg-indigo-500/40"></div>
      <div class="h-6 rounded bg-indigo-500/60"></div>
      <div class="h-6 rounded bg-indigo-500/80"></div>
      <div class="h-6 rounded bg-indigo-500"></div>
      <div class="h-6 rounded bg-indigo-400"></div>
      <div class="h-6 rounded bg-indigo-300"></div>
      <div class="h-6 rounded bg-indigo-200"></div>
      <div class="h-6 rounded bg-indigo-100"></div>
      <div class="h-6 rounded bg-indigo-50"></div>

      <div class="h-6 rounded bg-cyan-900"></div>
      <div class="h-6 rounded bg-cyan-900"></div>
      <div class="h-6 rounded bg-cyan-800"></div>
      <div class="h-6 rounded bg-cyan-700"></div>
      <div class="h-6 rounded bg-cyan-600"></div>
      <div class="h-6 rounded bg-cyan-500"></div>
      <div class="h-6 rounded bg-cyan-400"></div>
      <div class="h-6 rounded bg-cyan-300"></div>
      <div class="h-6 rounded bg-cyan-200"></div>
      <div class="h-6 rounded bg-cyan-100"></div>
      <div class="h-6 rounded bg-cyan-50"></div>

      <div class="h-6 rounded bg-cyan-500/10"></div>
      <div class="h-6 rounded bg-cyan-500/20"></div>
      <div class="h-6 rounded bg-cyan-500/40"></div>
      <div class="h-6 rounded bg-cyan-500/60"></div>
      <div class="h-6 rounded bg-cyan-500/80"></div>
      <div class="h-6 rounded bg-cyan-500"></div>
      <div class="h-6 rounded bg-cyan-400"></div>
      <div class="h-6 rounded bg-cyan-300"></div>
      <div class="h-6 rounded bg-cyan-200"></div>
      <div class="h-6 rounded bg-cyan-100"></div>
      <div class="h-6 rounded bg-cyan-50"></div>

    </div>
  </div>
</template>
