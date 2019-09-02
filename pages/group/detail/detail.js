const app = getApp();
// pages/group/detail/detail.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showDel: false,
    list: [],
    showList:[],
    groupId: '',
    showMore:false,
    isShowMore:true,
    groupDetail: {},
    isManage: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    const groupId = options.groupId;
    this.setData({
      groupId
    })
    const promise = new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.url + 'mobile/group/' + groupId + '/users',
        header: {
          unionId: wx.getStorageSync('userInfo').unionId,
        },
        success: (res) => {
          resolve(res);
          this.setData({
            list: res.data
          })
        },
      })
    });
    promise.then((value) => {
      wx.request({
        url: app.globalData.url + 'mobile/group/' + groupId,
        header: {
          unionId: wx.getStorageSync('userInfo').unionId,
        },
        success: (res) => {
          const groupDetail = res.data;
          const userId = groupDetail.groupUserModels.filter((item) => {
            return item.role === 1
          });

          let isManage = false
          if (userId.length > 0) {
            const manager = this.data.list.filter((item) => {
              return item.id === userId[0].userId
            })
            if (manager[0].unionId === wx.getStorageSync('userInfo').unionId) {
              isManage = true
            }
          }
          this.setData({
            groupDetail,
            isManage
          })
          this.hideMore()
        },
      })
      // success
    })

  },



  delUser(e) {
    const that = this;
    wx.showModal({
      title: '',
      content: '确定移除该团队成员?',
      success: (res) => {
        if (res.confirm) {
          console.log('用户点击确定')

          wx.request({
            url: app.globalData.url + 'mobile/group/exit',
            header: {
              unionId: wx.getStorageSync('userInfo').unionId,
            },
            data: {
              unionId: e.currentTarget.dataset.id,
              groupId: this.data.groupId
            },
            success: (res) => {
              if (res.data.invokeSuccess) {
                if (e.currentTarget.dataset.id === wx.getStorageSync('userInfo').unionId) {
                  const eventChannel = that.getOpenerEventChannel()
                  eventChannel.emit('acceptDataFromOpenedPage', {
                    data: 'exit'
                  });
                  eventChannel.emit('someEvent', {
                    data: 'exit'
                  });
                  setTimeout(function() {
                    wx.navigateBack({
                      delta: 1
                    }, 1000)
                  })
                } else {
                  this.data.list.splice(e.currentTarget.dataset.index, 1);
                  this.setData({
                    list: this.data.list
                  })
                }
              }
            },
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  showMore(){
    this.setData({
      showList:this.data.list,
      isShowMore:!this.data.showMore
    })
  },

  hideMore(){
    if (this.data.isManage) {
      if (this.data.list.length > 9) {
        const showList = this.data.list.slice(0, 9)
        this.setData({
          showList,
          showMore: true,
          isShowMore: true
        })
      } else {
        const showList = this.data.list
        this.setData({
          showList
        })
      }
    } else {
      if (this.data.list.length > 10) {
        const showList = this.data.list.slice(0, 10)
        this.setData({
          showList,
          showMore: true,
          isShowMore: true
        })
      } else {
        const showList = this.data.list
        this.setData({
          showList
        })
      }
    }
  },

  canDel() {
    this.setData({
      showDel: !this.data.showDel
    })
  },

  exitGroup() {
    wx.showModal({
      title: '',
      content: '确定退出团队?',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: app.globalData.url + 'mobile/group/exit',
            header: {
              unionId: wx.getStorageSync('userInfo').unionId,
            },
            data: {
              unionId: wx.getStorageSync('userInfo').unionId,
              groupId: this.data.groupId
            },
            success: (res) => {
              if (res.data.invokeSuccess) {
                const eventChannel = this.getOpenerEventChannel()
                eventChannel.emit('acceptDataFromOpenedPage', {
                  data: 'exit'
                });
                eventChannel.emit('someEvent', {
                  data: 'exit'
                });
                setTimeout(function() {
                  wx.navigateBack({
                    delta: 1
                  }, 1000)
                })
              }
            },
          })
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  }

})