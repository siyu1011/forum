<script setup lang="ts"></script>

<template>
  <div class="footer-wrapper">
    <p class="copyright">© 2026 社区论坛 - All Rights Reserved</p>
    <p class="links">
      <a href="#">关于我们</a>
      <a href="#">使用条款</a>
      <a href="#">隐私政策</a>
      <a href="#">联系我们</a>
    </p>
  </div>
</template>

<style scoped>
.footer-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
}

.copyright {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.links {
  font-size: 13px;
  
  a {
    color: var(--text-secondary);
    text-decoration: none;
    margin: 0 10px;
    
    &:hover {
      color: var(--primary-color);
    }
  }
}
</style>