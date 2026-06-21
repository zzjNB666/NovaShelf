function getJwtSecret() {
  const secret = String(process.env.JWT_SECRET ?? '').trim();
  if (!secret) {
    throw new Error('JWT_SECRET 未配置，服务拒绝启动');
  }
  return secret;
}

module.exports = {
  getJwtSecret
};
