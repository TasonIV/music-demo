$(function () {
    // 获取音频标签
    var audio = $('#audio')[0]
    var url = 'https://music.163.com/song/media/outer/url?id='

    // 音频准备完毕
    audio.oncanplay = function () {

        var self = this

        // 获取歌词
        var $liActive = $('li.list-active')
        var id = $liActive.data('id')
        // console.log('li==>',$liActive)
        $.ajax({
            type: 'GET',
            url: 'https://www.arthurdon.top:10099/lyric?id=' + id,
            success: function (data) {

                // 移除其他歌词
                $('.lyric-p').css({ top: lyricBoxTop + 'px' }).empty()

                var lyric = data.lrc.lyric.split(/[\n\r]+/);

                for (var i = 0; i < lyric.length; i++) {
                    var lrc = lyric[i].split(']')
                    // 歌词文本
                    var text = lrc[1]

                    if (text) {
                        // 歌词时刻
                        var time = lrc[0].slice(1).split(":")
                        var second = Number(time[0]) * 60 + Number(time[1])

                        var $p = $(`<p data-time="${second}">${text}</p>`)
                        $('.lyric-p').append($p)
                    }
                }

                // ========= 必须拿到歌词才能进行以下操作 ==========
                self.play()  // 音频可播放时，才播放
                // 动画效果  开启关闭
                $animate.find('.line').css({
                    animationPlayState: 'running'
                })


                $liActive.attr('name', 1)  //播放时，添加标记

                // 设置歌曲时间
                $('.dtime').text(dealSongTime(self.duration * 1000))  //总时间

                var $spans = $('.singer>span')
                $spans.eq(0).text($liActive.find('.list-name').text())    // 歌名
                $spans.eq(1).text($liActive.find('.list-singer').text())    // 歌手
                $(".con-img").find('img').attr('src', $liActive.data('img'))   // 歌手图片

                // 播放页渲染
                $('.play-song').text($liActive.find('.list-name').text())    // 歌名
                $('.play-singer').text($liActive.find('.list-singer').text())    // 歌手
                $(".play-img").find('img').attr('src', $liActive.data('img'))   // 歌手图片

                // 播放图标切换
                $('.m-middle').css({
                    background: `url('./image/stop.png') no-repeat center center`,
                    backgroundSize: 'cover'
                })

            }
        })
    }

    var progressWidth = $('.m-progress').width();
    var $mMask = $('.m-mask');
    var mMaskWidth = $mMask.width();

    var lyricBoxTop = parseFloat($('.lyric-p').css('top'))  // 歌词盒子的高度

    // console.log('lyricBoxTop', lyricBoxTop)
    // 音频实时变化
    audio.ontimeupdate = function () {

        $('.ctime').text(dealSongTime(this.currentTime * 1000))  //当前播放时间

        // 移动进度条
        if (!isTouch) {
            var x = this.currentTime / $('li.list-active').data('dt') * (progressWidth - mMaskWidth);
            var minLeft = 0;
            var maxLeft = progressWidth - mMaskWidth;
            var left = x <= minLeft ? minLeft : x >= maxLeft ? maxLeft : x;
            $('.m-mask').css({
                left: left + 'px'
            })
            $('.pro-active').css({
                width: x + 'px'
            })
        }

        // 歌词的移动处理
        var $ps = $('.lyric-p>p')
        var height = $ps.height()

        for (var i = 0; i < $ps.length; i++) {
            // 获取当前的p和下一个p元素
            var currentTime = $ps.eq(i).data('time')
            var nextTime = $ps.eq(i + 1).data('time')

            if (i + 1 == $ps.length) {
                nextTime = Number.MAX_VALUE   // js的数值最大值
            }
            if (this.currentTime >= currentTime && this.currentTime < nextTime) {
                $('.lyric-p').animate({
                    top: lyricBoxTop - height * i + 'px'
                }, 150)  // 150毫秒

                // 歌词颜色
                if (i - 1 >= 0) {
                    $ps.eq(i - 1).removeClass('lyric-active')
                }
                $ps.eq(i).addClass('lyric-active')

                break;
            }
        }

        // 旋转图片
        $('.m-img').css({
            transform: 'rotateZ(' + this.currentTime * 10 + 'deg)'
        })

    }

    // 音频播放完毕
    audio.onended = function () {
        console.log('播放完毕')
        $('li.list-active').find('.line').css({
            animationPlayState: 'paused'
        })
    }

    // 进度条：点击
    var isTouch = false;
    var x0 = 0;

    $('.m-event-progress').on('touchstart', function (e) {
        isTouch = true;
        var x = e.touches[0].pageX - mMaskWidth / 2;
        x0 = x;
        var minLeft = 0;
        var maxLeft = progressWidth - mMaskWidth;
        var left = x <= minLeft ? minLeft : x >= maxLeft ? maxLeft : x;

        $('.m-mask').css({
            left: left + 'px'
        })
        $('.pro-active').css({
            width: x + 'px'
        })

        //点击控制音频时间
        audio.currentTime = x / maxLeft * $('li.list-active').data('dt')
    })

    // 进度条：移动
    $('.m-progress').on('touchmove', function (e) {
        var x = e.touches[0].pageX;
        x0 = x;
        var minLeft = 0;
        var maxLeft = progressWidth - mMaskWidth;
        var left = x <= minLeft ? minLeft : x >= maxLeft ? maxLeft : x;

        $('.m-mask').css({
            left: left + 'px'
        })
        $('.m-progress-active').css({
            width: x + 'px'
        })
    })

    // 进度条：松开
    $('.m-progress').on('touchend', function (e) {
        var x = x0;
        var minLeft = 0;
        var maxLeft = progressWidth - mMaskWidth;
        var left = x <= minLeft ? minLeft : x >= maxLeft ? maxLeft : x;

        $('.m-mask').css({
            left: left + 'px'
        })
        $('.m-progress-active').css({
            width: x + 'px'
        })

        audio.currentTime = x / maxLeft * $('li.list-active').data('dt')

        isTouch = false;
    })

    // 暂停&播放按钮
    $('.m-middle').on('click', function () {
        var $liActive = $('li.list-active')
        var $lis = $('.list-ul>li')

        // 根据播放模式选择歌曲
        if ($liActive.length == 0) {   //是否有激活的歌曲
            // 获取模式 1:单曲循环   2：列表循环   3：随机播放 
            var type = $('.m-type').data('value')
            var $li = null;

            if (type == 1 || type == 2) {    //模式1、2
                $li = $lis.eq(0)
            } else if (type == 3) {    //模式3
                $li = $lis.eq(Math.floor(Math.random() * $lis.length))
            }

            var id = $li.data('id')
            audio.src = url + id
            $animate = $li.find('.animate')
            $li.addClass('list-active')
            $liActive.attr('name', 1)  //播放时，添加标记
            $(audio).attr('name', id)  //用于判断是否同一首歌
            // controlImg(true)

        } else {
            var name = $liActive.attr('name')
            // 切换&控制音频
            if (name == 0) {
                // 播放
                $liActive.attr('name', 1).find('.line').css({
                    animationPlayState: 'running'
                })
                $(this).css({
                    background: `url('./image/stop.png') no-repeat center center`,
                    backgroundSize: 'cover'
                })
                audio.play()
                // controlImg(true)
            } else {
                // 停止
                $liActive.attr('name', 0).find('.line').css({
                    animationPlayState: 'paused'
                })
                $(this).css({
                    background: `url('./image/play.png') no-repeat center center`,
                    backgroundSize: 'cover'
                })
                audio.pause()
                // controlImg(false)
            }
        }


    })


    // 上一首
    $('.m-left').on('click', function () {
        var $activeLi = $('li.list-active')
        var $lis = $('.list-ul>li')

        if ($activeLi.length == 0) {
            // 获取模式 1:单曲循环   2：列表循环   3：随机播放 
            var type = $('.m-type').data('value')
            var $li = null;

            if (type == 1 || type == 2) {    //模式1、2
                $li = $lis.eq(0)
            } else if (type == 3) {    //模式3
                $li = $lis.eq(Math.floor(Math.random() * $lis.length))
            }

            var id = $li.data('id')
            audio.src = url + id
            $animate = $li.find('.animate')
            $li.addClass('list-active')
            $(audio).attr('name', id)  //用于判断是否同一首歌
        } else {
            // 如果存在被播放的音乐
            var index = $activeLi.index();
            var $thisLi = $lis.eq(index)

            //根据模式选择播放
            var type = $('.m-type').data('value');
            if (type == 1 || type == 2) {
                if (index == 0) {
                    index = $lis.length - 1;
                } else {
                    index--;
                }
            } else if (type == 3) {
                index = Math.floor(Math.random() * $lis.length);
            }
            $thisLi.removeClass("list-active")
            if ($thisLi.attr('name') == 1) {  //播放状态时
                $thisLi.attr('name', 0).find('.line').css({
                    animationPlayState: 'paused'
                })
            }
            var $cLi = $lis.eq(index)
            var id = $cLi.data('id')
            audio.src = url + id
            $animate = $cLi.find('.animate')
            $cLi.addClass('list-active')
            $(audio).attr('name', id)  //用于判断是否同一首歌
        }

    })

    // 下一首
    $('.m-right').on('click', function () {
        var $activeLi = $('li.list-active')
        var $lis = $('.list-ul>li')

        if ($activeLi.length == 0) {
            // 获取模式 1:单曲循环   2：列表循环   3：随机播放 
            var type = $('.m-type').data('value')
            var $li = null;

            if (type == 1 || type == 2) {    //模式1、2
                $li = $lis.eq(0)
            } else if (type == 3) {    //模式3
                $li = $lis.eq(Math.floor(Math.random() * $lis.length))
            }

            var id = $li.data('id')
            audio.src = url + id
            $animate = $li.find('.animate')
            $li.addClass('list-active')
            $(audio).attr('name', id)  //用于判断是否同一首歌
        } else {
            // 如果存在被播放的音乐
            var index = $activeLi.index();
            var $thisLi = $lis.eq(index)

            //根据模式选择播放
            var type = $('.m-type').data('value');
            if (type == 1 || type == 2) {
                if (index == $lis.length - 1) {
                    index = 0;
                } else {
                    index++;
                }
            } else if (type == 3) {
                index = Math.floor(Math.random() * $lis.length);
            }
            $thisLi.removeClass("list-active")
            if ($thisLi.attr('name') == 1) {  //播放状态时
                $thisLi.attr('name', 0).find('.line').css({
                    animationPlayState: 'paused'
                })
            }
            var $cLi = $lis.eq(index)
            var id = $cLi.data('id')
            audio.src = url + id
            $animate = $cLi.find('.animate')
            $cLi.addClass('list-active')
            $(audio).attr('name', id)  //用于判断是否同一首歌
        }

    })

    // 播放模式
    $('.m-type').on('click', function () {
        var min = $(this).data('min')
        var max = $(this).data('max')
        var value = $('.m-type').data('value')

        if (value == 3) {
            value = min
            $('.m-type').data('value', min)
        } else {
            $('.m-type').data('value', ++value)
        }

        // 修改模式图标
        $('.m-type').css({
            background: `url("./image/${value}.png") no-repeat center center`,
            backgroundSize: 'cover'
        })

        // console.log('value==>', value)
    })





    var songsId = []    // 歌曲id
    var songsDetail = []    // 歌曲详情
    var d = localStorage.songs;     // 缓存

    // 判断是否有，本地缓存
    if (d) {
        // 获取缓存
        d = JSON.parse(d)
        // 歌曲详情
        songsDetail = d.playlist.tracks.concat();
        // 保存歌曲id
        for (var i = 0; i < d.privileges.length; i++) {
            songsId.push(d.privileges[i].id)
        }
        // 渲染歌曲数量
        $('.local-song').text(songsId.length)

        // 加载15首歌曲
        loadSongs(15, songsDetail)
    } else {
        // 获取歌单
        $.ajax({
            type: 'GET',
            url: "https://www.arthurdon.top:10099/top/list?idx=1",
            success: function (data) {
                // 保存歌曲id
                for (var i = 0; i < data.privileges.length; i++) {
                    songsId.push(data.privileges[i].id)
                }
                // 渲染歌曲数量
                $('.local-song').text(songsId.length)
                // 歌曲详情
                songsDetail = data.playlist.tracks.concat();
                // 设置本地缓存
                localStorage.setItem('songs', JSON.stringify(data))

                songsDetail(15, songsDetail)
            }
        })
    }

    var previewIds = []   // 保存用户浏览器的歌曲id
    var startsIndex = 0;
    var endIndex = 15;     // 保存歌曲数量

    // 点击：首页 => 歌曲列表页
    $('.content1').on('click', function () {
        $('header,main').hide()
        $('.songList-box').show()

        if (previewIds.length == 0) {
            previewIds = previewIds.concat(songsId.slice(startsIndex, endIndex))
            startsIndex = endIndex;
            endIndex += endIndex;
            // console.log('previewIds==>',previewIds)
        }

        if ($(this).data('title') == $('.songList').data('title')) {
            return;
        }
        $('.songList').empty()  //先清空，再加载
        // 加载15首歌曲
        loadSongs(previewIds.length, songsDetail);
        // 获取歌曲详情 并渲染
        // $.ajax({
        //     type: 'GET',
        //     url: "https://www.arthurdon.top:10099/song/detail?ids=" + previewIds.join(','),
        //     success: function (data) {

        //     }
        // })

    })

    var $animate = null;  // 播放动画
    // 点击歌曲，播放暂停
    $('#current-list').on('click', 'li', function () {

        // 4.0 切换歌曲，切换动画、样式     (此判断必须写在前面，不然没有效果)
        if (!$(this).hasClass('list-active')) {
            var $liActive = $('.list-active')
            if ($liActive.length > 0) {   // 已经有激活样式时
                $liActive.removeClass('list-active')   // 移除样式
                if ($liActive.attr('name', 1)) {
                    $liActive.find('.line').css({
                        animationPlayState: 'paused'
                    })
                }
            }
        }
        // 1.0 获取歌曲id
        var id = $(this).data('id')
        // 2.0 添加音频  
        if (id == $(audio).attr('name')) {  //name属性标记，判断是否是同一首歌

            // 3.0.1 动画 开始&暂停
            if ($(this).attr('name') == 0) {  //name属性标记点  0:停止 1:播放
                // 播放
                $(this).attr('name', 1)
                audio.play();
                $(this).find('.line').css({
                    animationPlayState: "running"
                })
                // 播放图标切换
                $('.m-middle').css({
                    background: `url('./image/stop.png') no-repeat center center`,
                    backgroundSize: 'cover'
                })
            } else {
                // 停止
                $(this).attr('name', 0)
                audio.pause()  // 同时停止音频
                $(this).find('.line').css({
                    animationPlayState: "paused"
                })
                // 暂停图标切换
                $('.m-middle').css({
                    background: `url('./image/play.png') no-repeat center center`,
                    backgroundSize: 'cover'
                })
            }

        } else {
            // 不同，添加name属性，添加歌曲
            $(audio).attr('name', id)
            audio.src = url + id;
        }

        // 3.0 播放动画
        $animate = $(this).find('.animate')
        $(this).addClass('list-active') // 设置点击样式
    })

    // 返回按钮：歌曲列表页 => 首页
    $('.list-header>i').on('click', function () {
        $('.songList-box').hide()
        $('header,main').show()
    })

    // 点击：首页 => 歌曲列表页
    $('.content2,.content3').on('click', function () {
        $('header,main').hide()
        $('.empty-box').show()
    })

    // 返回按钮：歌曲列表页 => 首页
    $('.list-header>i').on('click', function () {
        $('.empty-box').hide()
        $('header,main').show()
    })

    // 小图标 => 歌词页
    $('.con-img').on('click', function () {
        $('.play-box,.play-content').show()
        $('header,main,footer,.lyric-box,.empty-box,.songList').hide()
    })

    // 歌词页：旋转图片-歌词
    $('.play-content').on('click', function () {
        $('.play-content').hide()
        $('.lyric-box').show()
    })
    $('.lyric-box').on('click', function () {
        $('.lyric-box').hide()
        $('.play-content').show()
    })

    // 歌词页 => 歌曲详情页
    $('.play-header>i').on('click', function () {
        $('.songList,footer').show()
        $('header,main,.empty-box,.play-box').hide()
    })

    // 处理歌曲时间
    function dealSongTime(time) {
        var second = Math.floor(time / 1000 % 60);
        var minute = Math.floor(time / 1000 / 60);
        second = second >= 10 ? second : '0' + second;
        minute = minute >= 10 ? minute : '0' + minute;
        return minute + ':' + second
    }

    // 加载歌曲初始化
    function loadSongs(length, data) {
        for (var i = 0; i < length; i++) {
            // list-active
            var $li = $(`<li class="list-li" data-id="${data[i].id}" name="0" data-dt="${data[i].dt / 1000}" data-img="${data[i].al.picUrl}">
            <div class="list-img fl">
                <img src="${data[i].al.picUrl}" alt="">
            </div>
            <div class="list-message fl">
                <div class="list-name">${data[i].name}</div>
                <div class="info"></div>
            </div>

            <div class="animate fr">
                <span class="line line1"></span>
                <span class="line line2"></span>
                <span class="line line1"></span>
                <span class="line line2"></span>
            </div>
            <div class="list-time fr">${dealSongTime(data[i].dt)}</div>
        </li>`)

            // 歌手 需要初始化  歌手1/歌手2
            var sg = []
            for (var j = 0; j < data[i].ar.length; j++) {
                sg.push(data[i].ar[j].name)
            }
            var $singers = $(`<div class="list-singer">${sg.join('/')}</div>`)
            $li.find('.info').append($singers)

            $('#current-list').append($li)
        }
        // console.log('data==>',data)
        // console.log('songsDetail==>',songsDetail)
    }

    // function controlImg(type) {
    //     var rotX = 0;
    //     var timer = setInterval(function () {
    //         rotX += 1;
    //     }, 100)

    //     console.log('rotX',rotX)
    //     var currentX = 0;
    //     console.log('currentX',currentX)

    //     console.log('img',$('.m-img'))
    //     if (type) {

    //         // 旋转图片
    //         $('.m-img').css({
    //             transform: 'rotateZ('+ rotX + 'deg)',
    //         })
    //         currentX = rotX;
    //     }else{
    //         $('.m-img').css({
    //             transform: 'rotateZ('+ currentX + 'deg)'
    //         })
    //     }
    // }
})