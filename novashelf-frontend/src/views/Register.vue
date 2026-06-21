<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { UserPlus } from 'lucide-vue-next';
import { register } from '../api/auth';
import { setSession } from '../stores/auth';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const res = await register({
      username: username.value,
      password: password.value
    });
    setSession(res.data.data.token, res.data.data.user);
    router.push('/');
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
      <h1>创建协作账号</h1>
      <label>
        <span>账号名称</span>
        <input v-model.trim="username" autocomplete="username" required minlength="3" />
      </label>
      <label>
        <span>密码</span>
        <input v-model="password" type="password" autocomplete="new-password" required minlength="6" />
      </label>
      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="button primary" type="submit" :disabled="loading">
        <UserPlus :size="17" />
        <span>{{ loading ? '创建中' : '创建账号' }}</span>
      </button>
      <RouterLink class="text-link" to="/login">已有账号，进入工作台</RouterLink>
    </form>
  </section>
</template>
