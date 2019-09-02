//app.js
App({
  onLaunch: function () {
    const that = this;
    wx.authorize({
      scope: 'scope.record',
      success(res) { }
    })
    wx.authorize({
      scope: 'scope.camera',
      success(res) { }
    })
    wx.authorize({
      scope: 'scope.userLocation',
      success(res) { }
    })
    wx.authorize({
      scope: 'scope.userLocationBackground',
      success(res) { }
    })
  },
  onShow: function () {
   
  },
  globalData: {
    url: 'https://www.bgywork.com/'
  }
})