const app = getApp();
Page({
  data: {
   hasPassword:false,
   showMessage:false
  },
  setPassword(e){
    this.setData({
      hasPassword: e.detail.value
    })
  },
  formSubmit(e){
    if(e.detail.value.groupName===''){
      wx.showModal({
        content: '团队名称不能为空！',
        showCancel:false
      })
      return
    }
    if (e.detail.value.hasPassword&&e.detail.value.password1 !== e.detail.value.password2 ) {
      wx.showModal({
        content: '两次密码不一致！',
        showCancel: false
      })
      return
    }
    wx.request({
      url: app.globalData.url +'/mobile/group/add',
      header:{
        unionId: wx.getStorageSync('userInfo').unionId,
      },
      data: {
        groupName:e.detail.value.groupName,
        unionId:wx.getStorageSync('userInfo').unionId,
        password: e.detail.value.password1 ? e.detail.value.password1:''
      },
      success:(res)=>{
        if (res.data.invokeSuccess){
          wx.showToast({
            title: '创建成功',
            duration: 1000,
            mask: true,
            success: function(res) {},
            fail: function(res) {},
            complete: function(res) {},
          })
          const eventChannel = this.getOpenerEventChannel()
          eventChannel.emit('acceptDataFromOpenedPage', { data: 'test' });
          eventChannel.emit('someEvent', { data: 'test' });
          setTimeout(function(){
            wx.navigateBack({
              delta: 1
            },1000)
          })
         
        }else{
          this.setData({
            showMessage: true,
            message: '创建失败，团队名称已存在！'
          })
          setTimeout(() => {
            this.setData({
              showMessage: false
            })
          }, 2000)
        }
      },
    })
  }
})