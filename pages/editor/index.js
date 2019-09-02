const app = getApp()
Page({
  data: {
    imgList: [],
    video: [],
    voice: [],
    voiceLength: [],
    voiceProgress: [],
    isPlay:[],
    name:[],
    test:'',
    showEditor: false,
    isFullscreen: true,
    addressDesc: '',
    value: '',
    textareaAValue: '',
    minute: '00',
    second: '00',
    isPause: false,
    isPreserve: true,
    networkType:''
  },
  onLoad: function(option) {
    const targetData = JSON.parse(option.targetData)
    targetData.latitude = targetData.latitude.slice(0,9);
    targetData.longitude = targetData.longitude.slice(0, 10)
    this.setData({
      ...targetData
    })
    wx.getNetworkType({  //判断网络类型
      success: (res) => {
        const networkType = res.networkType;
        this.setData({
          networkType
        })
      }
    })
    this.recorderManager()
    this.innerAudioContext=[]
  },
  showEditor() {  //编辑地点名称
    this.setData({
      showEditor: true,
      value: this.data.addressDesc
    })
  },
  hideEditor() { //取消编辑
    this.setData({
      showEditor: false
    })
  },
  editTitle(e) { //编辑时同步输入
    this.setData({
      value: e.detail.value
    })
  },
  confirmEdit() {//确认修改
    this.setData({
      addressDesc: this.data.value,
      showEditor: false
    })
  },
  chooseImage() { //选择照片
    wx.chooseImage({
      count: 9, //默认9
      sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], //从相册选择
      success: (res) => {
        if (this.data.imgList.length != 0) {
          this.setData({
            imgList: this.data.imgList.concat(res.tempFilePaths)
          })
          wx.showLoading({
            title: '正在加载中',
            mask: true
          })
          setTimeout(()=>{
            wx.hideLoading()
          },1000)
        } else {
          this.setData({
            imgList: res.tempFilePaths
          })
          wx.showLoading({
            title: '正在加载中',
            mask: true
          })
          setTimeout(() => {
            wx.hideLoading()
          }, 1000)
        }
      }
    });
  },
  ViewImage(e) { //图片预览
    wx.previewImage({
      urls: this.data.imgList,
      current: e.currentTarget.dataset.url
    });
  },
  DelImg(e) {  //移除图片
    this.data.imgList.splice(e.currentTarget.dataset.index, 1);
    this.setData({
      imgList: this.data.imgList
    })
  },
  chooseVideo() {
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      compressed:true,
      camera: 'back',
      success: (res) => {
        wx.getFileInfo({
          filePath: res.tempFilePath,
          success: (file) => {
            if (file.size / 1024 / 1024 > 20) {
              wx.showModal({
                content: '视频长度大于20m,请选择20m以下的视频进行上传！',
              })
              return
            } else {
              this.data.video.push(res.tempFilePath)
              this.setData({
                video: this.data.video
              })
            }
          }
        })
      }
    })
  },
  audio() {
    this.data.voice.map((item, index) => {
      this.innerAudioContext[index] = wx.createInnerAudioContext();
      const audio = this.innerAudioContext[index] 
      audio.src = item;
      audio.onPlay(() => {
        console.log('开始播放') 
        if (audio.volume === 0) {
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
  onVoicePlay(e) {
    const play = this.data.isPlay.filter(item => { return item === true })
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
  screenChange() {
    this.setData({
      isFullscreen: !this.data.isFullscreen
    })
  },
  delVideo(e) {
    this.data.video.splice(e.currentTarget.dataset.index, 1);
    this.setData({
      video: this.data.video
    })
  },
  recorderManager: function() {
    this.recorderManager = wx.getRecorderManager()
    this.recorderManager.options = {
      duration: 60000
    }
    const that = this;
    this.recorderManager.setTime =()=> {
      const {
        minute,
        second
      } = this.data;
      let voiceTime = minute * 60 + parseInt(second);
      this.timer = setInterval(function() {
        voiceTime++
        let minute = parseInt(voiceTime / 60) < 10 ? "0" + parseInt(voiceTime / 60) : parseInt(voiceTime / 60)
        let second = voiceTime % 60 < 10 ? '0' + voiceTime % 60 : voiceTime % 60
        that.setData({
          minute,
          second
        })
      }, 1000)
    }
    this.recorderManager.onStart(() => {
      this.setData({
        isPause: false
      })
      this.recorderManager.setTime()
    })
    this.recorderManager.onPause(() => {
      clearInterval(this.timer)
      this.setData({
        isPause: true
      })
    })
    this.recorderManager.onResume((res) => {
      this.setData({
        isPause: false
      })
      this.recorderManager.setTime()
    })
    this.recorderManager.onStop((res) => {
      const {
        tempFilePath
      } = res
      clearInterval(this.timer)
      if (that.data.minute < 1 && that.data.second <3) {
        wx.showModal({
          content: '录音时长过短，请重新录制！',
        })
        that.setData({
          loadModal: false,
          minute: '00',
          second: '00'
        })
        return
      }
      if (!that.data.isPreserve) {
        that.setData({
          loadModal: false,
          minute: '00',
          second: '00'
        })
        return
      }
      that.data.voice.push(tempFilePath)
      let date = new Date()
      let year = date.getFullYear()
      let month = date.getMonth() + 1
      month =month < 10?'0' +month : month;
      let day = date.getDate();
      day = day < 10?'0' + day : day;
      let hour = date.getHours();
      hour = hour < 10 ?'0' + hour : hour;
      let minute = date.getMinutes();
      minute = minute < 10 ? '0' + minute : minute;
      let second = date.getSeconds();
      second = second < 10 ? '0' + second : second;
      this.data.name.push(year+month+day+hour+minute+second)
      that.setData({
        voice: this.data.voice,
        loadModal: false,
        name:this.data.name,
        minute: '00',
        second: '00'
      })
      that.audio()
      wx.showToast({
        title: '录音结束',
        icon: 'success',
        duration: 1000
      })

    })
  },
  startVoice: function() {
    this.setData({
      loadModal: true,
      isPreserve: true
    })
    this.recorderManager.start({
      duration: 60000
    })
  },
  pauseVoice: function() {
    this.recorderManager.pause()
  },
  resumeVoice: function() {
    this.recorderManager.resume()
  },
  stopVoice: function() {
    this.recorderManager.stop()
  },
  delVoice() { //录制时删除
    this.setData({
      isPreserve: false
    })
    this.recorderManager.stop()
  },
  voiceDel(e) {
    this.data.voice.splice(e.currentTarget.dataset.index, 1);
    this.data.name.splice(e.currentTarget.dataset.index, 1);
    this.setData({
      voice: this.data.voice,
      name:this.data.name
    })
  },
  playRecord: function (e) {
    console.log(e)
    var src = e.currentTarget.dataset.src;
    this.innerAudioContext.src =src;
    this.innerAudioContext.play()
  },
  textareaAInput(e) {
    this.setData({
      textareaAValue: e.detail.value
    })
  },
  formSubmit() {
    const wifi = wx.getStorageSync('wifi');
    let status = 0;
    if (wifi && this.data.networkType !== 'wifi') {
      status = 1
    }
    const arr=this.getList();
    // if(arr.length===0){
    //   status=0
    // }
    const record = {
      unionId: wx.getStorageSync('userInfo').unionId,
      groupId: this.data.groupId,
      recordName: this.data.addressDesc,
      coordinate: {
        "latitude": this.data.latitude,
        "longitude": this.data.longitude
      },
      describtion: this.data.textareaAValue,
      status,
    }
    wx.showLoading({
      title: '正在处理中',
      mask:true
    })
    wx.request({
      url: app.globalData.url + '/mobile/record/add', //仅为示例，并非真实的接口地址
      data: record,
      header: {
        'content-type': 'application/json', // 默认值
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        if (res.data.invokeSuccess) {
          if(arr.length===0){
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
            return
          }
          if (status === 0) {
            this.upload(res.data.invokeInfo)
          } else {
            this.unUpload(res.data.invokeInfo)
          }
        }
      }
    })
  },
  getList() {
    const arr = []
    if (this.data.imgList.lemgth !== 0) {
      this.data.imgList.map(item => {
        arr.push({
          type: 1,
          filePath: item
        })
      })
    }
    if (this.data.video.length !== 0) {
      this.data.video.map(item => {
        arr.push({
          type: 2,
          filePath: item
        })
      })
    }
    if (this.data.voice.length !== 0) {
      this.data.voice.map(item => {
        arr.push({
          type: 3,
          filePath: item
        })
      })
    }
    return arr
  },
  unUpload(recordId, index = 0) {
    const arr = this.getList();
    wx.request({
      url: app.globalData.url + '/mobile/record/detail/add/tmp',
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      data: {
        unionId: wx.getStorageSync('userInfo').unionId,
        recordId,
        groupId: this.data.groupId,
        type: arr[index].type,
        tmpPath: arr[index].filePath,
      },
      success(res) {
        const data = res.data
        //do something
      },
      complete: (res) => {
        if (index < arr.length - 1) {
          index++;
          this.unUpload(recordId, index)
        } else {
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
      }

    })

  },
  upload(recordId, index = 0) {
    const arr = this.getList();
    wx.uploadFile({
      url: app.globalData.url + 'mobile/record/detail/add', //仅为示例，非真实的接口地址
      filePath: arr[index].filePath,
      name: 'file',
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      formData: {
        unionId: wx.getStorageSync('userInfo').unionId,
        recordId,
        tmpPath: arr[index].filePath,
        type: arr[index].type,
        groupId: this.data.groupId
      },
      success(res) {
        const data = res.data
        //do something
      },
      complete: (res) => {
        if (index < arr.length - 1) {
          index++;
          this.upload(recordId, index)
        } else {
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
      }
    })
  },
  onVideoPlay: (e) => {
    const videoContext = wx.createVideoContext(e.currentTarget.id);
    videoContext.requestFullScreen();
  },
});