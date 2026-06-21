<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LogIn } from 'lucide-vue-next';
import { login } from '../api/auth';
import { setSession } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const res = await login({
      username: username.value,
      password: password.value
    });
    setSession(res.data.data.token, res.data.data.user);
    router.push(String(route.query.redirect || '/'));
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="auth-layout">
    <form class="auth-form" @submit.prevent="submit">
      <span class="eyebrow">Nova Shelf</span>
      <h1>进入灵感工作台</h1>
      <label>
        <span>账号</span>
        <input v-model.trim="username" autocomplete="username" placeholder="输入工作台账号" required />
      </label>
      <label>
        <span>密码</span>
        <input v-model="password" type="password" autocomplete="current-password" placeholder="输入访问密码" required />
      </label>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="button primary" type="submit" :disabled="loading">
        <LogIn :size="17" />
        <span>{{ loading ? '进入中' : '进入工作台' }}</span>
      </button>
      <RouterLink class="text-link" to="/register">创建资料协作账号</RouterLink>
    </form>
  </section>
</template>
