<script setup>
import { computed } from 'vue';
import { Star } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  readonly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);
const stars = computed(() => [1, 2, 3, 4, 5]);

function select(score) {
  if (!props.readonly) {
    emit('update:modelValue', score);
  }
}
</script>

<template>
  <div class="star-rating" :class="{ readonly }" aria-label="评分">
    <button
      v-for="score in stars"
      :key="score"
      type="button"
      class="star-button"
      :class="{ active: score <= modelValue }"
      :disabled="readonly"
      :title="`${score} 分`"
      @click="select(score)"
    >
      <Star :size="20" />
    </button>
  </div>
</template>
