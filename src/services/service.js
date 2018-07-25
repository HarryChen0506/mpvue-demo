// 业务服务的封装
import http from './http.js'

// 换背景
export const changeBg = {
  theme: function (themeId) {
    // 获取主题信息
    const reqData = {
      method: 'GET',
      url: `https://mini-program.api.versa-ai.com/bg/${themeId}/themeData`,
      dataType: 'json',
      data: {
        clientType: 'mini-program'
      }
    }
    return http.request(reqData)
  }
}

export default {
  changeBg
}
