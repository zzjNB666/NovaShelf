<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Compass, Home, LayoutDashboard, LogIn, LogOut, ShieldCheck, UserPlus } from 'lucide-vue-next';
import { authState, logout } from '../stores/auth';

const router = useRouter();
const isAdmin = computed(() => authState.user?.role === 'admin');

function handleLogout() {
  logout();
  router.push('/');
}
</script>

<template>
  <header class="app-header">
    <RouterLink class="brand" to="/" aria-label="Nova Shelf 首页">
      <span class="brand-mark"><Compass :size="20" /></span>
      <span>
        <strong>Nova Shelf</strong>
        <small>灵感资料工作台</small>
      </span>
    </RouterLink>

    <nav class="header-nav" aria-label="主导航">
      <RouterLink to="/" class="nav-link">
        <Home :size="17" />
        <span>素材库</span>
      </RouterLink>
      <RouterLink v-if="isAdmin" to="/admin" class="nav-link">
        <LayoutDashboard :size="17" />
        <span>控制台</span>
      </RouterLink>
    </nav>

    <div class="header-actions">
      <span v-if="authState.user" class="user-chip">
        <ShieldCheck v-if="isAdmin" :size="16" />
        <span>{{ authState.user.username }}</span>
      </span>
      <RouterLink v-if="!authState.user" class="button ghost" to="/login">
        <LogIn :size="17" />
        <span>登录</span>
      </RouterLink>
      <RouterLink v-if="!authState.user" class="button primary" to="/register">
        <UserPlus :size="17" />
        <span>注册</span>
      </RouterLink>
      <button v-else class="button ghost" type="button" @click="handleLogout">
        <LogOut :size="17" />
        <span>退出</span>
      </button>
    </div>
  </header>
</template>
