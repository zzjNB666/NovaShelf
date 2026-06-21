import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import Detail from '../views/Detail.vue';
import Login from '../views/Login.vue';
import Register from '../views/Register.vue';
import Admin from '../views/Admin.vue';
import { authState, loadProfile } from '../stores/auth';

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/resources/:id', name: 'detail', component: Detail },
  { path: '/login', name: 'login', component: Login },
  { path: '/register', name: 'register', component: Register },
  { path: '/admin', name: 'admin', component: Admin, meta: { requiresAdmin: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach(async (to) => {
  if (!authState.ready) {
    await loadProfile();
  }

  if (to.meta.requiresAdmin && !authState.user) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresAdmin && authState.user.role !== 'admin') {
    return { name: 'home' };
  }

  if ((to.name === 'login' || to.name === 'register') && authState.user) {
    return { name: 'home' };
  }

  return true;
});

export default router;
