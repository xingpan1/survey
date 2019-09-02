// pages/record/detail/detail.js
const app = getApp();
const time = require('../../../utils/util.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    longitude: '',
    latitude: '',
    TabCur: 0,
    name: [],
    item: '',
    tab: ['图片', '录像', '录音'],
    icon: ['picfill', 'recordfill', 'voicefill'],
    markers: [],
    imgList: [],
    imgList1: [],
    video: [],
    voice: [],
    voiceLength:[],
    voiceProgress:[],
    showEditor: false,
    textValue: '',
    canWrite: false,
    loadModal: false,
    minute: '00',
    second: '00',
    isPlay:[],
    isPause: false,
    isPreserve: true,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    this.setData({
      id: options.id
    })
    this.getDetail(options.id);
    this.innerAudioContext=[]
    setTimeout(()=>{
      this.audio()
    },1000)
  },
  audio(){
    this.data.voice.map((item,index)=>{
      this.innerAudioContext[index] = wx.createInnerAudioContext();
      const audio = this.innerAudioContext[index]
      audio.src = item;
      audio.onPlay(() => {
        console.log('开始播放')
        if (audio.volume === 0) {
          return
        }
        this.data.isPlay[index]=true
        this.setData({
          isPlay:this.data.isPlay
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
      audio.onTimeUpdate(()=>{
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
      setTimeout(()=>{
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
        audio.volume=1;
      },800)     
    })
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
        const markers = this.data.markers;
        let canWrite = false;
        if (data.unionId === wx.getStorageSync('userInfo').unionId) {
          canWrite = true;
        }
        const params = {
          id: Number.parseInt(Math.random() * 1000),
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          iconPath: '/images/marker.png',
          width: 22,
          height: 32
        }
        const item = {
          createTime: time.formatTime(data.createTime),
          describtion: data.describtion,
          id: data.id,
          nickName: data.nickName,
          recordName: data.recordName,
        }
        const imgList = [];
        let voice = [];
        let video = [];
        let name = [];
        let imgList1 = [];
        if (data.recordDetailModels.length > 0) {
          data.recordDetailModels.map(item => {
            if (item.type === 1) {
              imgList.push(item.fileThumbPath)
              imgList1.push(item.filePath)
            } else if (item.type === 2) {
              video.push(item.filePath)
            } else if (item.type === 3) {
              voice.push(item.filePath)
              name.push(item.fileName)
            }
          })
        }
        markers.push(params);
        this.setData({
          longitude: coordinate.longitude.slice(0,10),
          latitude: coordinate.latitude.slice(0, 9),
          markers,
          item,
          imgList,
          imgList1,
          canWrite,
          video,
          voice,
          name,
          nickName: item.nickName
        })
      }
    })
  },



  tabSelect(e) {
    this.setData({
      TabCur: e.currentTarget.dataset.id,
      scrollLeft: (e.currentTarget.dataset.id - 1) * 60
    })
  },

  editDesc() {
    this.setData({
      showEditor: true,
      textValue: this.data.item.describtion
    })
  },

  hideEditor() {
    this.setData({
      showEditor: false
    })
  },


  textareaAInput(e) {
    this.setData({
      textValue: e.detail.value
    })
  },

  confirmEdit() {
    if (this.data.textValue === this.data.item.describtion) {
      this.setData({
        showEditor: false
      })
      return
    }
    wx.request({
      url: app.globalData.url + '/mobile/record/edit',
      data: {
        id: this.data.id,
        describtion: this.data.textValue,
      },
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      success: (res) => {
        if (res.data.invokeSuccess) {
          const item = this.data.item;
          item.describtion = this.data.textValue;
          this.setData({
            item,
            showEditor: false
          })
          wx.showToast({
            title: '编辑成功',
            icon: 'success',
            duration: 2000
          })
        }
      }
    })
  },
  ViewImage(e) {
    wx.previewImage({
      urls: this.data.imgList1,
      current: e.currentTarget.dataset.url
    });
  },
  addUpload() {
    if (this.data.TabCur === 0) {
      wx.chooseImage({
        count: 9, //默认9
        sizeType: ['original', 'compressed'], //可以指定是原图还是压缩图，默认二者都有
        sourceType: ['album', 'camera'], //从相册选择
        success: (res) => {
          this.upload(this.data.id, res.tempFilePaths, 1)
        }
      });
    } else if (this.data.TabCur === 1) {
      wx.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 60,
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
                console.log(res.tempFilePath);
                const arr = [res.tempFilePath]
                this.upload(this.data.id, arr, 2)
              }
            }
          })
        }
      })
    } else if (this.data.TabCur === 2) {
      this.startVoice()
    }
  },
  upload(recordId, uploadList, type, index = 0) {
    if(index===0){
      wx.showLoading({
        title: '正在上传中',
      })
    }
    wx.uploadFile({
      url: app.globalData.url + 'mobile/record/detail/add', //仅为示例，非真实的接口地址
      filePath: uploadList[index],
      name: 'file',
      header: {
        'unionId': wx.getStorageSync('userInfo').unionId,
      },
      formData: {
        unionId: wx.getStorageSync('userInfo').unionId,
        recordId,
        tmpPath: uploadList[index].filePath,
        type: type,
      },
      success:(res)=> {
        const data = res.data
        if (index < uploadList.length - 1) {
          index++;
          this.upload(recordId, uploadList, type, index)
        } else {
          wx.hideLoading()
          wx.showToast({
            title: '上传成功',
            duration: 1000
          })
          this.getDetail(this.data.id);
          setTimeout(() => {
            this.audio()
          }, 1000)
        }
        //do something
      },
      fail: (res) => {
          wx.hideLoading()
          wx.showModal({
            title: '上传失败!',
            showCancel:false
          })
      }
    })
  },
  recorderManager: function () {
    const recorderManager = wx.getRecorderManager()
    recorderManager.options = {
      duration: 60000,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'aac',
      frameSize: 50
    }
    const that = this;
    const {
      minute,
      second
    } = this.data;
    recorderManager.setTime = function () {
      let voiceTime = minute * 60 + parseInt(second);
      recorderManager.timer = setInterval(function () {
        voiceTime++
        let minute = parseInt(voiceTime / 60) < 10 ? "0" + parseInt(voiceTime / 60) : parseInt(voiceTime / 60)
        let second = voiceTime % 60 < 10 ? '0' + voiceTime % 60 : voiceTime % 60
        that.setData({
          minute,
          second
        })
      }, 1000)
    }
    recorderManager.onStart(() => {
      this.setData({
        isPause: false
      })
      recorderManager.setTime()
      console.log('recorder start')
    })
    recorderManager.onPause(() => {
      console.log(recorderManager)
      clearInterval(recorderManager.timer)
      console.log('recorder pause')
      this.setData({
        isPause: true
      })
    })
    recorderManager.onResume((res) => {
      this.setData({
        isPause: false
      })
      recorderManager.setTime()
    })
    recorderManager.onStop((res) => {
      const {
        tempFilePath
      } = res
      clearInterval(recorderManager.timer)
      if (that.data.minute < 1 && that.data.second < 3) {
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
      const arr = [tempFilePath]
      that.upload(that.data.id, arr, 3)
      that.setData({
        voice: this.data.voice,
        loadModal: false,
        minute: '00',
        second: '00'
      })
      wx.showToast({
        title: '录音结束',
        icon: 'success',
        duration: 1000
      })

    })
    recorderManager.onFrameRecorded((res) => {
      const {
        frameBuffer
      } = res
      console.log('frameBuffer.byteLength', frameBuffer.byteLength)
    })
    return recorderManager
  },
  startVoice: function () {
    const recorderManager = this.recorderManager();
    this.setData({
      loadModal: true,
      isPreserve: true
    })
    recorderManager.start(recorderManager.options)
  },
  pauseVoice: function () {
    const recorderManager = this.recorderManager();
    recorderManager.pause(recorderManager.options)
  },
  resumeVoice: function () {
    const recorderManager = this.recorderManager();
    recorderManager.resume(recorderManager.options)
  },
  stopVoice: function () {
    const recorderManager = this.recorderManager();
    recorderManager.stop(recorderManager.options)
  },
  delVoice() { //录制时删除
    this.setData({
      isPreserve: false
    })
    const recorderManager = this.recorderManager();
    recorderManager.stop(recorderManager.options)
  },
  onVideoPlay:(e)=>{
    const videoContext= wx.createVideoContext(e.currentTarget.id);
    videoContext.requestFullScreen();
    videoContext.showStatusBar();
  },
  onVoicePlay(e){
    const play=this.data.isPlay.filter(item=>{return item===true})
    if(play.length!==0){
      wx.showModal({
        content: '不能同时播放两个录音',
        showCancel:false
      })
      return
    }
    this.innerAudioContext[e.currentTarget.dataset.index].play()
  },
  onVoicePause(e) {
    this.innerAudioContext[e.currentTarget.dataset.index].pause()
  }
})