function ok(res, data = null, message = '操作成功') {
  res.json({
    code: 200,
    data,
    message
  });
}

function fail(res, status = 500, message = '服务器错误', data = null) {
  res.status(status).json({
    code: status,
    data,
    message
  });
}

module.exports = {
  ok,
  fail
};
