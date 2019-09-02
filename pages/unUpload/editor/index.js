const app = getApp();
Page({
  data: {
    imgList: [],
    video: [],
    voice: [],
    voiceLength: [],
    voiceProgress: [],
    isPlay: [],
    isFullscreen: true,
    item: {},
    id: '',
    groupId: '',
    uploadList: []
  },
  onLoad: function(options) {
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    this.setData({
      id: options.id
    })
    this.innerAudioContext = []
    this.getDetail(options.id)
    setTimeout(() => {
      this.audio()
    }, 1000)
  },
  onReady() {
    setTimeout(()=>{
      wx.hideLoading()
    },1000)
  },
  getDetail(id) {
    wx.request({
      url: app.globalData.url + 'mobile/record/mark/' + id + '/data',
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        const data = res.data;
        const coordinate = JSON.parse(data.coordinate);
        const item = {
          describtion: data.describtion,
          recordName: data.recordName,
        }
        const imgList = [];
        let voice = [];
        let video = [];
        if (data.recordDetailModels.length > 0) {
          data.recordDetailModels.map(item => {
            if (item.type === 1) {
              imgList.push(item.tmpPath)
            } else if (item.type === 2) {
              video.push(item.tmpPath)
            } else if (item.type === 3) {
              voice.push(item.tmpPath)
            }
          })
        }
        this.setData({
          longitude: coordinate.longitude,
          latitude: coordinate.latitude,
          item,
          groupId: data.groupId,
          uploadList: data.recordDetailModels,
          imgList,
          video,
          voice,
        })
      }
    })
  },
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.imgList,
      current: e.currentTarget.dataset.url
    });
  },
  screenChange() {
    this.setData({
      isFullscreen: !this.data.isFullscreen
    })
  },
  formSubmit() {
    this.upload()
  },
  upload(index = 0) {
    const arr = this.data.uploadList;
    if (arr.length === 0) {
      wx.request({
        url: app.globalData.url + 'mobile/record/update',
        header: {
          'unionId': wx.getStorageSync('userInfo').unionId,
        },
        data: {
          id: this.data.id,
          status: 0
        },
        success: (res) => {
          const eventChannel = this.getOpenerEventChannel()
          eventChannel.emit('acceptDataFromOpenedPage', {
            data: 'test'
          });
          eventChannel.emit('someEvent', {
            data: 'test'
          });
          setTimeout(function() {
            wx.navigateBack({
              delta: 1
            }, 1000)
          })
        }
      })
      return
    }
    wx.showLoading({
      title: '正在上传中',
    })
    //判断是否存在文件丢失，存在则中断上传
    wx.uploadFile({
      url: app.globalData.url + 'mobile/record/detail/add', //仅为示例，非真实的接口地址
      filePath: arr[index].tmpPath,
      name: 'file',
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      formData: {
        unionId: wx.getStorageSync('userInfo').unionId,
        recordId: arr[index].recordId,
        tmpPath: arr[index].tmpPath,
        type: arr[index].type,
        groupId: this.data.groupId,
        recordDetailId: arr[index].id
      },
      success:(res)=> {
        if (index < arr.length - 1) {
          index++;
          this.upload(index)
        } else {
          wx.hideLoading()
          const eventChannel = this.getOpenerEventChannel()
          eventChannel.emit('acceptDataFromOpenedPage', {
            data: 'test'
          });
          eventChannel.emit('someEvent', {
            data: 'test'
          });
          setTimeout(function () {
            wx.navigateBack({
              delta: 1
            }, 1000)
          })
        }
      },
      fail: (res) => {
        wx.hideLoading()
        wx.showModal({
          content: '存在文件丢失现象，请重新处理该记录',
          showCancel:false
        })
        return
      }
    })
  },
  onVideoPlay: (e) => {
    const videoContext = wx.createVideoContext(e.currentTarget.id);
    videoContext.requestFullScreen();
  },
  onVoicePlay(e) {
    const play = this.data.isPlay.filter(item => {
      return item === true
    })
    if (play.length !== 0) {
      wx.showModal({
        content: '不能同时播放两个录音',
        showCancel: false
      })
      return
    }
    this.innerAudioContext[e.currentTarget.dataset.index].play()
  },
  onVoicePause(e) {
    this.innerAudioContext[e.currentTarget.dataset.index].pause()
  },
  audio() {
    this.data.voice.map((item, index) => {
      this.innerAudioContext[index] = wx.createInnerAudioContext();
      const audio = this.innerAudioContext[index]
      audio.src = item;
      audio.onPlay(() => {
        console.log('开始播放')
        if(audio.volume===0){
          return
        }
        this.data.isPlay[index] = true
        this.setData({
          isPlay: this.data.isPlay
        })
      })
      audio.onEnded(() => {
        this.data.isPlay[index] = false
        this.setData({
          isPlay: this.data.isPlay
        })
      })
      audio.onPause(() => {
        this.data.isPlay[index] = false
        this.setData({
          isPlay: this.data.isPlay
        })
      })
      audio.onTimeUpdate(() => {
        const voiceLength = parseInt(audio.duration) >= 10 ? parseInt(audio.duration) : '0' + parseInt(audio.duration)
        this.data.voiceLength[index] = '0:' + voiceLength;
        const currentTime = parseInt(audio.currentTime) >= 10 ? parseInt(audio.currentTime) : '0' + parseInt(audio.currentTime)
        this.data.voiceProgress[index] = '0:' + currentTime;
        this.setData({
          voiceLength: this.data.voiceLength,
          voiceProgress: this.data.voiceProgress
        })
      })
      audio.onError((res) => {
        console.log(res.errMsg)
        console.log(res.errCode)
      })
      audio.volume = 0;
      audio.play()
      setTimeout(() => {
        const voiceLength = parseInt(audio.duration) >= 10 ? parseInt(audio.duration) : '0' + parseInt(audio.duration)
        this.data.voiceLength[index] = '0:' + voiceLength;
        const currentTime = parseInt(audio.currentTime) >= 10 ? parseInt(audio.currentTime) : '0' + parseInt(audio.currentTime)
        this.data.voiceProgress[index] = '0:' + currentTime;
        this.data.isPlay[index] = false
        this.setData({
          voiceLength: this.data.voiceLength,
          voiceProgress: this.data.voiceProgress,
          isPlay: this.data.isPlay
        })
        audio.pause()
        audio.volume = 1;
      }, 800)

    })
  },
});