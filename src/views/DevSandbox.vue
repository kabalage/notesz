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
  <div class="h-full overflow-y-auto">
    <div class="p-4 mb-16 max-w-3xl mx-auto">
      <h1 class="text-xl font-semibold text-accent-300 my-4 text-center">
        Developer sandbox
      </h1>
      <div>
        <div>
          <button @click="persist()">persist</button> ({{ persisted }},  {{ persistResult }})
        </div>
        <div><a href="https://vercel.com">External link</a></div>
      </div>
      <div
        class="grid ggrid-cols-7  gap-2 sm:gap-4 mt-8"
        style="grid-template-columns: repeat(6, minmax(0, 1fr)) 5.625rem;"
      >
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
        <div class="h-6 rounded bg-indigo-500/40"></div>
        <div class="h-6 rounded bg-indigo-500/60"></div>
        <div class="h-6 rounded bg-indigo-500/80"></div>
        <div class="h-6 rounded bg-indigo-500/100"></div>
        <div class="h-6 text-indigo-500/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-indigo-400/10"></div>
        <div class="h-6 rounded bg-indigo-400/20"></div>
        <div class="h-6 rounded bg-indigo-400/40"></div>
        <div class="h-6 rounded bg-indigo-400/60"></div>
        <div class="h-6 rounded bg-indigo-400/80"></div>
        <div class="h-6 rounded bg-indigo-400/100"></div>
        <div class="h-6 text-indigo-400/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-indigo-300/10"></div>
        <div class="h-6 rounded bg-indigo-300/20"></div>
        <div class="h-6 rounded bg-indigo-300/40"></div>
        <div class="h-6 rounded bg-indigo-300/60"></div>
        <div class="h-6 rounded bg-indigo-300/80"></div>
        <div class="h-6 rounded bg-indigo-300/100"></div>
        <div class="h-6 text-indigo-300/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-blue-400/10"></div>
        <div class="h-6 rounded bg-blue-400/20"></div>
        <div class="h-6 rounded bg-blue-400/40"></div>
        <div class="h-6 rounded bg-blue-400/60"></div>
        <div class="h-6 rounded bg-blue-400/80"></div>
        <div class="h-6 rounded bg-blue-400/100"></div>
        <div class="h-6 text-blue-400/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-sky-400/10"></div>
        <div class="h-6 rounded bg-sky-400/20"></div>
        <div class="h-6 rounded bg-sky-400/40"></div>
        <div class="h-6 rounded bg-sky-400/60"></div>
        <div class="h-6 rounded bg-sky-400/80"></div>
        <div class="h-6 rounded bg-sky-400/100"></div>
        <div class="h-6 text-sky-400/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-accent-400/10"></div>
        <div class="h-6 rounded bg-accent-400/20"></div>
        <div class="h-6 rounded bg-accent-400/40"></div>
        <div class="h-6 rounded bg-accent-400/60"></div>
        <div class="h-6 rounded bg-accent-400/80"></div>
        <div class="h-6 rounded bg-accent-400/100"></div>
        <div class="h-6 text-accent-400/100">
          Hello world!
        </div>
<!--
        <div class="h-6 rounded bg-accent-300/10"></div>
        <div class="h-6 rounded bg-accent-300/20"></div>
        <div class="h-6 rounded bg-accent-300/40"></div>
        <div class="h-6 rounded bg-accent-300/60"></div>
        <div class="h-6 rounded bg-accent-300/80"></div>
        <div class="h-6 rounded bg-accent-300/100"></div>
        <div class="h-6 text-accent-300/100">
          Hello world!
        </div> -->

        <div class="h-6 rounded bg-green-400/10"></div>
        <div class="h-6 rounded bg-green-400/20"></div>
        <div class="h-6 rounded bg-green-400/40"></div>
        <div class="h-6 rounded bg-green-400/60"></div>
        <div class="h-6 rounded bg-green-400/80"></div>
        <div class="h-6 rounded bg-green-400/100"></div>
        <div class="h-6 text-green-400/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-yellow-400/10"></div>
        <div class="h-6 rounded bg-yellow-400/20"></div>
        <div class="h-6 rounded bg-yellow-400/40"></div>
        <div class="h-6 rounded bg-yellow-400/60"></div>
        <div class="h-6 rounded bg-yellow-400/80"></div>
        <div class="h-6 rounded bg-yellow-400/100"></div>
        <div class="h-6 text-yellow-400/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-orange-400/10"></div>
        <div class="h-6 rounded bg-orange-400/20"></div>
        <div class="h-6 rounded bg-orange-400/40"></div>
        <div class="h-6 rounded bg-orange-400/60"></div>
        <div class="h-6 rounded bg-orange-400/80"></div>
        <div class="h-6 rounded bg-orange-400/100"></div>
        <div class="h-6 text-orange-400/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-red-400/10"></div>
        <div class="h-6 rounded bg-red-400/20"></div>
        <div class="h-6 rounded bg-red-400/40"></div>
        <div class="h-6 rounded bg-red-400/60"></div>
        <div class="h-6 rounded bg-red-400/80"></div>
        <div class="h-6 rounded bg-red-400/100"></div>
        <div class="h-6 text-red-400/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-pink-400/10"></div>
        <div class="h-6 rounded bg-pink-400/20"></div>
        <div class="h-6 rounded bg-pink-400/40"></div>
        <div class="h-6 rounded bg-pink-400/60"></div>
        <div class="h-6 rounded bg-pink-400/80"></div>
        <div class="h-6 rounded bg-pink-400/100"></div>
        <div class="h-6 text-pink-400/100">
          Hello world!
        </div>

        <div class="h-6 rounded bg-gray-400/10"></div>
        <div class="h-6 rounded bg-gray-400/20"></div>
        <div class="h-6 rounded bg-gray-400/40"></div>
        <div class="h-6 rounded bg-gray-400/60"></div>
        <div class="h-6 rounded bg-gray-400/80"></div>
        <div class="h-6 rounded bg-gray-400/100"></div>
        <div class="h-6 text-gray-400/100">
          Hello world!
        </div>

      </div>

      <div
        class="grid grid-cols-11 gap-y-2 mt-8 ßbg-indigo-950 bg-background p-4
          text-center text-white font-bold"
      >
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded-full bg-white text-center text-black font-semibold">500</div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>

        <div class="h-6 bg-indigo-950"></div>
        <div class="h-6 bg-indigo-900"></div>
        <div class="h-6 bg-indigo-800"></div>
        <div class="h-6 bg-indigo-700"></div>
        <div class="h-6 bg-indigo-600"></div>
        <div class="h-6 bg-indigo-500"></div>
        <div class="h-6 bg-indigo-400"></div>
        <div class="h-6 bg-indigo-300"></div>
        <div class="h-6 bg-indigo-200"></div>
        <div class="h-6 bg-indigo-100"></div>
        <div class="h-6 bg-transparent"></div>

        <div class="h-6 bg-transparent"></div>
        <div class="h-6 bg-indigo-500/20"></div>
        <div class="h-6 bg-indigo-500/40"></div>
        <div class="h-6 bg-indigo-500/60"></div>
        <div class="h-6 bg-indigo-500/80"></div>
        <div class="h-6 bg-indigo-500">·</div>
        <div class="h-6 bg-indigo-400"></div>
        <div class="h-6 bg-indigo-300"></div>
        <div class="h-6 bg-indigo-200"></div>
        <div class="h-6 bg-indigo-100"></div>
        <div class="h-6 bg-transparent"></div>

        <div class="h-6 bg-transparent"></div>
        <div class="h-6 bg-transparent"></div>
        <div class="h-6 bg-indigo-400/20"></div>
        <div class="h-6 bg-indigo-400/40"></div>
        <div class="h-6 bg-indigo-400/60"></div>
        <div class="h-6 bg-indigo-400/80"></div>
        <div class="h-6 bg-indigo-400">·</div>
        <div class="h-6 bg-indigo-300"></div>
        <div class="h-6 bg-indigo-200"></div>
        <div class="h-6 bg-indigo-100"></div>
        <div class="h-6 bg-transparent"></div>

        <div class="h-6 bg-transparent"></div>
        <div class="h-6 bg-transparent"></div>
        <div class="h-6 bg-transparent"></div>
        <div class="h-6 bg-indigo-300/20"></div>
        <div class="h-6 bg-indigo-300/40"></div>
        <div class="h-6 bg-indigo-300/60"></div>
        <div class="h-6 bg-indigo-300/80"></div>
        <div class="h-6 bg-indigo-300">·</div>
        <div class="h-6 bg-indigo-200"></div>
        <div class="h-6 bg-indigo-100"></div>
        <div class="h-6 bg-transparent"></div>

      </div>

      <div
        class="grid grid-cols-11 gap-y-2 mt-8 bg-white ßbg-green-100 p-4
          text-center text-white font-bold"
      >
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded-full bg-black text-center text-white font-semibold">500</div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>
        <div class="h-6 rounded bg-transparent"></div>

        <div class="h-6 bg-transparent"></div>
        <div class="h-6 bg-indigo-900"></div>
        <div class="h-6 bg-indigo-800"></div>
        <div class="h-6 bg-indigo-700"></div>
        <div class="h-6 bg-indigo-600"></div>
        <div class="h-6 bg-indigo-500"></div>
        <div class="h-6 bg-indigo-400"></div>
        <div class="h-6 bg-indigo-300"></div>
        <div class="h-6 bg-indigo-200"></div>
        <div class="h-6 bg-indigo-100"></div>
        <div class="h-6 bg-indigo-50"></div>

        <div class="h-6 bg-transparent"></div>
        <div class="h-6 bg-indigo-900"></div>
        <div class="h-6 bg-indigo-800"></div>
        <div class="h-6 bg-indigo-700"></div>
        <div class="h-6 bg-indigo-600"></div>
        <div class="h-6 bg-indigo-500">·</div>
        <div class="h-6 bg-indigo-500/80"></div>
        <div class="h-6 bg-indigo-500/60"></div>
        <div class="h-6 bg-indigo-500/40"></div>
        <div class="h-6 bg-indigo-500/20"></div>
        <div class="h-6 bg-transparent"></div>

        <div class="h-6 bg-transparent"></div>
        <div class="h-6 bg-indigo-900"></div>
        <div class="h-6 bg-indigo-800"></div>
        <div class="h-6 bg-indigo-700"></div>
        <div class="h-6 bg-indigo-600"></div>
        <div class="h-6 bg-indigo-500"></div>
        <div class="h-6 bg-indigo-400">·</div>
        <div class="h-6 bg-indigo-400/80"></div>
        <div class="h-6 bg-indigo-400/60"></div>
        <div class="h-6 bg-indigo-400/40"></div>
        <div class="h-6 bg-indigo-400/20"></div>

      </div>

    </div>
  </div>
</template>
