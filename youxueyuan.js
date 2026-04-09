// ==UserScript==
// @name         优学院自动静音播放、自动做练习题、自动翻页、修改播放速率（重构版）
// @namespace    [url=mailto:moriartylimitter@outlook.com]moriartylimitter@outlook.com[/url]
// @version      2.0.0
// @description  自动静音播放每页视频、自动作答、修改播放速率!
// @author       EliotZhang、Brush-JIM
// @match        *://ua.dgut.edu.cn/learnCourse/*
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://code.jquery.com/ui/1.12.1/jquery-ui.js
// @run-at       document-start
// @grant        unsafeWindow
// @downloadURL https://update.greasyfork.org/scripts/396629/%E4%BC%98%E5%AD%A6%E9%99%A2%E8%87%AA%E5%8A%A8%E9%9D%99%E9%9F%B3%E6%92%AD%E6%94%BE%E3%80%81%E8%87%AA%E5%8A%A8%E5%81%9A%E7%BB%83%E4%B9%A0%E9%A2%98%E3%80%81%E8%87%AA%E5%8A%A8%E7%BF%BB%E9%A1%B5%E3%80%81%E4%BF%AE%E6%94%B9%E6%92%AD%E6%94%BE%E9%80%9F%E7%8E%87.user.js
// @updateURL https://update.greasyfork.org/scripts/396629/%E4%BC%98%E5%AD%A6%E9%99%A2%E8%87%AA%E5%8A%A8%E9%9D%99%E9%9F%B3%E6%92%AD%E6%94%BE%E3%80%81%E8%87%AA%E5%8A%A8%E5%81%9A%E7%BB%83%E4%B9%A0%E9%A2%98%E3%80%81%E8%87%AA%E5%8A%A8%E7%BF%BB%E9%A1%B5%E3%80%81%E4%BF%AE%E6%94%B9%E6%92%AD%E6%94%BE%E9%80%9F%E7%8E%87.meta.js
// ==/UserScript==

(function () {
    'use strict';

    /**
     * ============================================================================
     * 优学院自动学习辅助脚本 - 重构版 v2.0.0
     * ============================================================================
     *
     * 功能概述：
     * 1. 自动静音播放视频
     * 2. 自动调整播放速率
     * 3. 自动翻页到下一节
     * 4. 自动作答各类题目（单选、多选、判断、填空）
     * 5. 可视化配置面板
     *
     * 原作者：EliotZhang、Brush-JIM
     * 重构优化：Claude Code
     * 最后更新：2026/04/09
     *
     * 使用注意事项：
     * 1. 请谨慎使用修改播放速率功能，产生的不良后果恕不承担
     * 2. 请保持网课播放页面在浏览器中活动，避免长时间后台挂机
     * 3. 自动作答功能目前支持单/多项选择、判断题、部分填空问答题
     * 4. 如果脚本无效请优先尝试刷新页面
     * 5. 脚本作者不提供任何保证，请自行判断使用风险
     * ============================================================================
     */

    // ============================================================================
    // 配置管理器
    // ============================================================================
    var ConfigManager = {
        /**
         * 默认配置
         */
        defaults: {
            // 播放速率 (1.0 = 正常速度)
            playbackRate: 1.50,

            // 功能开关
            enableAutoPlay: true,      // 自动播放视频
            enableAutoMute: true,      // 自动静音
            enableAutoChangeRate: true, // 自动调整播放速率
            enableAutoFillAnswer: true, // 自动答题总开关
            enableAutoShowAnswer: true, // 自动显示答案
            enableAutoAnswerChoices: true, // 自动作答选择题
            enableAutoAnswerJudges: true, // 自动作答判断题
            enableAutoAnswerFills: true   // 自动作答填空/简答题
        },

        /**
         * 当前配置
         */
        current: {},

        /**
         * 本地存储键名
         */
        storageKey: 'EZUL_CONFIG',

        /**
         * 初始化配置管理器
         */
        init: function () {
            console.log('[配置管理器] 初始化...');
            this.loadFromStorage();
            return this;
        },

        /**
         * 从本地存储加载配置，支持从旧格式迁移
         */
        loadFromStorage: function () {
            try {
                var savedConfig = localStorage.getItem(this.storageKey);
                if (savedConfig) {
                    // 新格式配置存在，直接加载
                    this.current = JSON.parse(savedConfig);
                    console.log('[配置管理器] 配置已从本地存储加载（新格式）');
                } else {
                    // 尝试从旧格式迁移
                    if (this.migrateFromOldFormat()) {
                        console.log('[配置管理器] 配置已从旧格式迁移');
                    } else {
                        // 无保存配置，使用默认值
                        this.current = Object.assign({}, this.defaults);
                        console.log('[配置管理器] 使用默认配置');
                    }
                }
            } catch (error) {
                console.error('[配置管理器] 加载配置失败:', error);
                this.current = Object.assign({}, this.defaults);
            }
            return this.current;
        },

        /**
         * 从旧格式迁移配置
         * @returns {boolean} 是否成功迁移
         */
        migrateFromOldFormat: function () {
            try {
                if (localStorage.getItem('EZUL') !== 'EliotZhang、BrushJIM') {
                    return false; // 没有旧格式配置
                }

                console.log('[配置管理器] 检测到旧格式配置，开始迁移...');

                // 旧格式到新格式的映射
                var oldToNewMap = {
                    'EAM': 'enableAutoMute',
                    'EACR': 'enableAutoChangeRate',
                    'EAP': 'enableAutoPlay',
                    'EASA': 'enableAutoShowAnswer',
                    'EAAC': 'enableAutoAnswerChoices',
                    'EAAJ': 'enableAutoAnswerJudges',
                    'EAAF': 'enableAutoAnswerFills',
                    'EAFA': 'enableAutoFillAnswer',
                    'APRC': 'playbackRate'
                };

                var migratedConfig = Object.assign({}, this.defaults);
                var hasMigration = false;

                // 迁移布尔值配置
                for (var oldKey in oldToNewMap) {
                    if (oldKey === 'APRC') continue; // 单独处理播放速率

                    var newKey = oldToNewMap[oldKey];
                    var oldValue = localStorage.getItem(oldKey);
                    if (oldValue !== null) {
                        migratedConfig[newKey] = (oldValue === 't');
                        hasMigration = true;
                        console.log('[配置管理器] 迁移 ' + oldKey + ' -> ' + newKey + ': ' + migratedConfig[newKey]);
                    }
                }

                // 迁移播放速率
                var playbackRateValue = localStorage.getItem('APRC');
                if (playbackRateValue !== null) {
                    migratedConfig.playbackRate = parseFloat(playbackRateValue) || this.defaults.playbackRate;
                    hasMigration = true;
                    console.log('[配置管理器] 迁移 APRC -> playbackRate: ' + migratedConfig.playbackRate);
                }

                if (hasMigration) {
                    this.current = migratedConfig;
                    this.saveToStorage(); // 保存为新格式
                    console.log('[配置管理器] 旧格式配置迁移完成');
                    return true;
                }

                return false;
            } catch (error) {
                console.error('[配置管理器] 迁移旧格式配置失败:', error);
                return false;
            }
        },

        /**
         * 保存配置到本地存储
         */
        saveToStorage: function () {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.current));
                localStorage.setItem('EZUL', 'EliotZhang、BrushJIM'); // 兼容旧版本
                console.log('[配置管理器] 配置已保存到本地存储');
                return true;
            } catch (error) {
                console.error('[配置管理器] 保存配置失败:', error);
                return false;
            }
        },

        /**
         * 获取配置值
         * @param {string} key - 配置键名
         * @param {any} defaultValue - 默认值
         * @returns {any} 配置值
         */
        get: function (key, defaultValue) {
            return this.current[key] !== undefined ? this.current[key] : defaultValue;
        },

        /**
         * 设置配置值
         * @param {string} key - 配置键名
         * @param {any} value - 配置值
         */
        set: function (key, value) {
            this.current[key] = value;
            return this;
        },

        /**
         * 批量设置配置值
         * @param {Object} config - 配置对象
         */
        setAll: function (config) {
            Object.assign(this.current, config);
            return this;
        },

        /**
         * 重置为默认配置
         */
        resetToDefaults: function () {
            this.current = Object.assign({}, this.defaults);
            return this;
        },

        /**
         * 获取所有配置
         * @returns {Object} 当前所有配置
         */
        getAll: function () {
            return Object.assign({}, this.current);
        }
    };

    // ============================================================================
    // 全局配置变量（简化访问）
    // ============================================================================

    // 初始化配置管理器
    var config = ConfigManager.init();

    // ============================================================================
    // 日志管理器
    // ============================================================================
    var Logger = {
        /**
         * 日志级别
         */
        levels: {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        },

        /**
         * 当前日志级别（默认为INFO）
         */
        currentLevel: 1,

        /**
         * 设置日志级别
         * @param {string} level - 日志级别：DEBUG, INFO, WARN, ERROR
         */
        setLevel: function (level) {
            if (this.levels[level] !== undefined) {
                this.currentLevel = this.levels[level];
                this.info('[日志管理器] 日志级别设置为:', level);
            }
        },

        /**
         * 调试日志
         * @param {...any} args - 日志参数
         */
        debug: function (...args) {
            if (this.currentLevel <= this.levels.DEBUG) {
                console.log('[优学院脚本-DEBUG]', ...args);
            }
        },

        /**
         * 信息日志
         * @param {...any} args - 日志参数
         */
        info: function (...args) {
            if (this.currentLevel <= this.levels.INFO) {
                console.log('[优学院脚本-INFO]', ...args);
            }
        },

        /**
         * 警告日志
         * @param {...any} args - 日志参数
         */
        warn: function (...args) {
            if (this.currentLevel <= this.levels.WARN) {
                console.warn('[优学院脚本-WARN]', ...args);
            }
        },

        /**
         * 错误日志
         * @param {...any} args - 日志参数
         */
        error: function (...args) {
            if (this.currentLevel <= this.levels.ERROR) {
                console.error('[优学院脚本-ERROR]', ...args);
            }
        }
    };

    // 快捷访问方法
    function getConfig(key, defaultValue) {
        return config.get(key, defaultValue);
    }

    // 常用配置的快捷访问
    var ENABLE_AUTO_PLAY = getConfig('enableAutoPlay', true);
    var ENABLE_AUTO_MUTE = getConfig('enableAutoMute', true);
    var ENABLE_AUTO_CHANGE_RATE = getConfig('enableAutoChangeRate', true);
    var ENABLE_AUTO_FILL_ANSWER = getConfig('enableAutoFillAnswer', true);
    var ENABLE_AUTO_SHOW_ANSWER = getConfig('enableAutoShowAnswer', true);
    var ENABLE_AUTO_ANSWER_CHOICES = getConfig('enableAutoAnswerChoices', true);
    var ENABLE_AUTO_ANSWER_JUDGES = getConfig('enableAutoAnswerJudges', true);
    var ENABLE_AUTO_ANSWER_FILLS = getConfig('enableAutoAnswerFills', true);
    var PLAYBACK_RATE = getConfig('playbackRate', 1.50);

    // ============================================================================
    // 视频播放管理器
    // ============================================================================

    /**
     * 视频播放控制函数
     * @param {Object} func - 回调函数
     * @param {boolean} slept - 是否已等待
     */
    function Video(func = {}, slept = false) {
        if (!ENABLE_AUTO_PLAY)
            return;
        if (autoAnswering) {
            setTimeout(function () {
                Video({}, true);
            }, '1000');
            return;
        }
        if (!slept) {
            setTimeout(function () {
                Video({}, true);
            }, '3000');
            return;
        }
        var videoElementsTemp = $('video');
        var videoElements = [];
        for (let i = 0; i < videoElementsTemp.length; i++) {
            if (videoElementsTemp[i].src != "") {
                videoElements.push(videoElementsTemp[i]);
            }
        }
        if (videoElements.length === 0) {
            // 没有视频，检查是否有题目需要处理
            var qw = $('.question-wrapper');
            if (qw.length > 0 && ENABLE_AUTO_FILL_ANSWER) {
                Logger.info('没有视频，但有题目，先处理题目');
                ShowAndFillAnswer();
            } else {
                GotoNextPage();
            }
            return;
        }
        var videoStatus = [];
        var videoBottomElements = $('div[class="video-bottom"]');
        for (let i = 0; i < videoBottomElements.length; i++) {
            let span = videoBottomElements[i].getElementsByTagName("span")[0];
            if (span) {
                let data_bind = span.getAttribute('data-bind');
                if (data_bind == 'text: $root.i18nMessageText().finished' || data_bind == 'text: $root.i18nMessageText().viewed' || data_bind == 'text: $root.i18nMessageText().unviewed') {
                    videoStatus.push(data_bind);
                }
            }
        }

        function video_ctrl(func) {
            for (let i = 0; i < videoElements.length; i++) {
                if (videoStatus[i] == 'text: $root.i18nMessageText().viewed' || videoStatus[i] == 'text: $root.i18nMessageText().unviewed' || videoStatus[i] === false) {
                    if (i - 1 >= 0) {
                        if (videoElements[i - 1].currentTime != 0) {
                            if (videoElements[i - 1].paused === true) {
                                videoElements[i - 1].play()
                            }
                            if (ENABLE_AUTO_MUTE && videoElements[i - 1].muted === false) {
                                videoElements[i - 1].muted = true;
                            }
                            if (ENABLE_AUTO_CHANGE_RATE && videoElements[i - 1].playbackRate != PLAYBACK_RATE) {
                                videoElements[i - 1].playbackRate = PLAYBACK_RATE
                            }
                            break;
                        }
                    }
                    if (videoElements[i].paused === true) {
                        videoElements[i].play();
                    }
                    if (ENABLE_AUTO_MUTE && videoElements[i].muted === false) {
                        videoElements[i].muted = true;
                    }
                    if (ENABLE_AUTO_CHANGE_RATE && videoElements[i].playbackRate != PLAYBACK_RATE) {
                        videoElements[i].playbackRate = PLAYBACK_RATE;
                    }
                    break;
                }
            }
            if (videoStatus[videoStatus.length - 1] == 'text: $root.i18nMessageText().finished' || videoStatus[videoStatus.length - 1] === true) {
                if (videoElements[videoElements.length - 1].currentTime != 0) {
                    if (videoElements[videoElements.length - 1].paused === true) {
                        videoElements[videoElements.length - 1].play()
                    }
                    if (ENABLE_AUTO_MUTE && videoElements[videoElements.length - 1].muted === false) {
                        videoElements[videoElements.length - 1].muted = true
                    }
                    if (ENABLE_AUTO_CHANGE_RATE && videoElements[videoElements.length - 1].playbackRate != PLAYBACK_RATE) {
                        videoElements[videoElements.length - 1].playbackRate = PLAYBACK_RATE
                    }
                    setTimeout(func, "2000", func);
                } else {
                    GotoNextPage();
                }
            } else {
                setTimeout(func, "2000", func);
            }
        }
        if (videoElements.length == videoStatus.length) {
            video_ctrl(Video);
        } else {
            videoStatus = [];
            for (let i = 0; i < videoElements.length; i++) {
                videoStatus[i] = false;
                videoElements[i].addEventListener("ended", function () {
                    videoStatus[i] = true;
                }, true);
            }
            video_ctrl(video_ctrl);
        }
    }

    function GotoNextPage() {
        if (autoAnswering || !ENABLE_AUTO_PLAY || checkingModal)
            return;

        // 检查是否有未完成题目
        var qw = $('.question-wrapper');
        if (qw.length > 0) {
            var unfinishedQuestions = qw.not('.finished');
            if (unfinishedQuestions.length > 0) {
                Logger.info('有未完成题目，不翻页');
                // 有未完成题目，先答题
                if (ENABLE_AUTO_FILL_ANSWER) {
                    Logger.info('自动答题已启用，开始答题');
                    ShowAndFillAnswer();
                }
                return;
            }
        }

        var nextPageBtn = $('.mobile-next-page-btn');
        if (nextPageBtn.length === 0)
            return;
        Logger.info('翻页到下一节');
        nextPageBtn.each((k, n) => {
            n.click();
        });
        setTimeout(Video, "1000");
    }

    function CheckModal(slept = false) {
        if (autoAnswering)
            return;
        if (!slept) {
            setTimeout(function () {
                CheckModal(true);
            }, '5000');
            return;
        }
        checkingModal = true;
        var qw = $('.question-wrapper');
        if (qw.length > 0 && ENABLE_AUTO_FILL_ANSWER) {
            ShowAndFillAnswer();
            checkingModal = false;
            return;
        }
        var statModal = $('#statModal');
        if (statModal.length > 0) {
            var ch = statModal[0];
            ch.getElementsByTagName('button');
            if (ch.length >= 2)
                ch[1].click();
        }
        var err = $('.mobile-video-error');
        if (err && err.css('display') != 'none')
            $('.try-again').click();
        var alertModal = document.getElementById("alertModal");
        if (alertModal === undefined) {
            checkingModal = false;
            return;
        }
        if (alertModal.className.match(/\sin/)) {
            // 检测模态框类型
            var modalType = 'unknown';
            var incompleteDiv = $('div[data-bind*="modalType() == \'incomplete\'"]');
            if (incompleteDiv.length > 0) {
                modalType = 'incomplete';
                Logger.info('检测到题目未完成提示框');
            }

            if (modalType === 'incomplete') {
                // 题目未完成提示框 - 点击"留在本页"并确保题目完成
                var op = $('.modal-operation').children();
                if (op.length >= 2) {
                    Logger.info('点击"留在本页"按钮');
                    op[0].click(); // 总是点击"留在本页"

                    // 等待模态框关闭
                    setTimeout(function () {
                        // 确保题目被完成
                        ensureQuestionsCompleted();
                    }, 1000);
                }
            } else {
                // 其他类型的模态框
                var op = $('.modal-operation').children();
                if (op.length >= 2)
                    op[ENABLE_AUTO_FILL_ANSWER ? 0 : 1].click();
                else {
                    var continueBtn = $('.btn-submit');
                    if (continueBtn.length > 0) {
                        continueBtn.each((k, v) => {
                            if ($(v).text() != '提交')
                                $(v).click();
                        });
                    }
                }
                if (ENABLE_AUTO_FILL_ANSWER)
                    ShowAndFillAnswer();
            }
        }
        checkingModal = false;
    }

    function ensureQuestionsCompleted() {
        Logger.info('确保题目完成');
        if (autoAnswering || !ENABLE_AUTO_FILL_ANSWER) {
            Logger.info('已经在答题或自动答题未启用');
            return;
        }

        var allQuestions = $('.question-wrapper');
        if (allQuestions.length === 0) {
            Logger.info('没有找到题目');
            return;
        }

        // 使用新的检测函数检查未完成题目
        var unfinishedQuestions = getUnfinishedQuestions();

        Logger.info('题目统计：总共', allQuestions.length, '个，未完成', unfinishedQuestions.length, '个');

        if (unfinishedQuestions.length > 0) {
            Logger.info('发现未完成题目，开始答题');
            ShowAndFillAnswer();
        } else {
            Logger.info('所有题目已完成');
            // 如果有提交按钮，点击提交
            var submitBtn = $('.btn-submit:contains("提交")');
            if (submitBtn.length > 0) {
                Logger.info('点击提交按钮');
                submitBtn.click();
            }
        }
    }

    function RemoveDuplicatedItem(arr) {
        for (var i = 0; i < arr.length - 1; i++) {
            for (var j = i + 1; j < arr.length; j++) {
                if (arr[i] == arr[j]) {
                    arr.splice(j, 1);
                    j--;
                }
            }
        }
        return arr;
    }

    function Escape2Html(str) {
        var arrEntities = {
            'lt': '<',
            'gt': '>',
            'nbsp': ' ',
            'amp': '&',
            'quot': '"'
        };
        return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function (all, t) {
            return arrEntities[t];
        });
    }

    function DelHtmlTag(str) {
        return str.replace(/(<[^>]+>|\\n|\\r)/g, " ");
    }

    function FillAnswers() {
        if (!autoAnswering || !ENABLE_AUTO_ANSWER_FILLS)
            return;
        var ansarr = [];
        var idList = [];
        var re = [];
        var txtAreas = $('textarea, .blank-input');
        $(txtAreas).each((k, v) => {
            var reg = /question\d+/;
            var fa = $(v).parent();
            while (!reg.test($(fa).attr('id'))) {
                fa = $(fa).parent();
            }
            var id = $(fa).attr('id').replace('question', '');
            idList.push(id);
        });
        idList = RemoveDuplicatedItem(idList);
        $(idList).each((k, id) => {
            $.ajax({
                url: 'https://api.ulearning.cn/questionAnswer/' + id,
                type: "GET",
                contentType: "application/json",
                dataType: 'json',
                async: false,
                data: {
                    parentId: pageid,
                },
                success: function (result, status, xhr) {
                    re.push(result.correctAnswerList);
                }
            });
        });

        $(re).each((k1, v1) => {
            if (v1.length == 1) {
                ansarr.push(DelHtmlTag(Escape2Html(v1[0])));
            } else {
                $(v1).each(function (k2, v2) {
                    ansarr.push(DelHtmlTag(Escape2Html(v2)));
                });
            }
        });
        $(txtAreas).each((k, v) => {
            $(v).val(ansarr.shift());
        });
    }

    // 从DOM获取答案的辅助函数
    function getAnswerFromDOM(questionId) {
        var maxRetries = 8; // 增加重试次数
        var retryDelay = 800; // 增加等待时间

        console.log('开始从DOM获取答案，questionId:', questionId);

        for (var retry = 0; retry < maxRetries; retry++) {
            // 尝试多种选择器查找答案
            var selectors = [
                '#question' + questionId + ' .correct-answer-area span:last-child',
                '#question' + questionId + ' .correct-answer-area',
                '#question' + questionId + ' .answer-result-text',
                '.question-wrapper[id="question' + questionId + '"] .correct-answer-area span:last-child',
                '.question-wrapper[id="question' + questionId + '"] .correct-answer-area',
                '.question-wrapper[id="question' + questionId + '"] .answer-result-text',
                '#question' + questionId + ' span[style*="color:"]', // 可能有颜色的文本
                '.correct-answer-area span:last-child', // 更通用的选择器
                '.correct-answer-area', // 直接找答案区域
                '.answer-result-text .correct-answer-area span:last-child',
                '.answer-result-text', // 直接找结果文本
                '.answer-text', // 可能的选择器
                '.correct-answer', // 可能的选择器
                '.answer-content', // 可能的选择器
                '.result-content', // 可能的选择器
                '.question-result', // 可能的选择器
                '.result-text', // 可能的选择器
                '.correct-text', // 可能的选择器
                '.right-answer', // 可能的选择器
                '.right-answer-text', // 可能的选择器
                '.show-answer', // 可能的选择器
                '.answer-show', // 可能的选择器
                '.answer-display' // 可能的选择器
            ];

            console.log('第' + (retry + 1) + '次尝试查找答案，questionId:', questionId);

            for (var i = 0; i < selectors.length; i++) {
                var domAnswerElement = $(selectors[i]);
                if (domAnswerElement.length > 0) {
                    console.log('找到DOM元素，选择器:', selectors[i], '数量:', domAnswerElement.length);

                    // 获取文本内容
                    var domAnswerText = domAnswerElement.text().trim();
                    console.log('原始答案文本:', domAnswerText);

                    // 清理文本：移除HTML标签和多余空格
                    domAnswerText = domAnswerText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    console.log('清理后答案文本:', domAnswerText);

                    // 检查是否包含常见答案关键词
                    if (domAnswerText.includes('答案：') || domAnswerText.includes('正确答案：') || domAnswerText.includes('参考答案：')) {
                        console.log('检测到答案关键词，尝试提取...');
                        // 尝试多种提取模式
                        var extracted = false;

                        // 模式1：提取冒号后的内容
                        var match = domAnswerText.match(/(?:答案|正确答案|参考答案)：\s*([^\s](?:.*[^\s])?)/);
                        if (match && match[1]) {
                            domAnswerText = match[1].trim();
                            console.log('提取后答案(模式1):', domAnswerText);
                            extracted = true;
                        }

                        // 模式2：如果提取失败或只有标签，尝试获取子元素文本
                        if (!extracted || domAnswerText === '正确答案：' || domAnswerText === '答案：') {
                            console.log('尝试获取子元素文本...');
                            // 查找.correct-answer-area内的所有span、div、p元素
                            var childElements = domAnswerElement.find('span, div, p, strong, b, em, i');
                            if (childElements.length > 0) {
                                // 获取所有子元素的文本
                                var childText = '';
                                childElements.each(function () {
                                    var text = $(this).text().trim();
                                    if (text && text !== '正确答案：' && text !== '答案：' && text !== '参考答案：') {
                                        childText += text + ' ';
                                    }
                                });
                                childText = childText.trim();
                                if (childText) {
                                    domAnswerText = childText;
                                    console.log('从子元素提取的答案:', domAnswerText);
                                    extracted = true;
                                }
                            }
                        }

                        // 模式3：如果还是只有标签，尝试获取.correct-answer-area的完整HTML
                        if (!extracted || domAnswerText === '正确答案：' || domAnswerText === '答案：') {
                            console.log('尝试分析完整HTML结构...');
                            var htmlContent = domAnswerElement.html().trim();
                            console.log('HTML结构:', htmlContent);
                            // 移除标签，只保留文本
                            var cleanText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                            // 移除"正确答案："等标签
                            cleanText = cleanText.replace(/(?:答案|正确答案|参考答案)：\s*/g, '').trim();
                            if (cleanText && cleanText !== '正确答案：' && cleanText !== '答案：') {
                                domAnswerText = cleanText;
                                console.log('从HTML提取的答案:', domAnswerText);
                                extracted = true;
                            }
                        }

                        // 模式4：查找.correct-answer-area后面或相邻的元素
                        if (!extracted || domAnswerText === '正确答案：' || domAnswerText === '答案：') {
                            console.log('尝试查找相邻元素...');
                            // 查找.correct-answer-area后面的兄弟元素
                            var nextSiblings = domAnswerElement.nextAll('span, div, p');
                            if (nextSiblings.length > 0) {
                                var siblingText = '';
                                nextSiblings.each(function () {
                                    var text = $(this).text().trim();
                                    if (text && !text.includes('正确答案：') && !text.includes('答案：')) {
                                        siblingText += text + ' ';
                                    }
                                });
                                siblingText = siblingText.trim();
                                if (siblingText) {
                                    domAnswerText = siblingText;
                                    console.log('从相邻元素提取的答案:', domAnswerText);
                                    extracted = true;
                                }
                            }
                        }
                    }

                    // 如果文本为空，尝试获取HTML内容
                    if (!domAnswerText) {
                        domAnswerText = domAnswerElement.html().trim();
                        console.log('HTML内容:', domAnswerText);
                    }

                    // 解析答案文本
                    if (!domAnswerText) {
                        console.log('答案文本为空，跳过');
                        continue;
                    }

                    // 检查是否是只有标签没有实际答案
                    if (domAnswerText === '正确答案：' || domAnswerText === '答案：' || domAnswerText === '参考答案：') {
                        console.log('只有答案标签没有实际答案内容，跳过此选择器');
                        continue; // 尝试下一个选择器
                    }

                    // 判断题答案：正确/错误
                    if (domAnswerText === '正确' || domAnswerText === '对' || domAnswerText === 'True' || domAnswerText === 'true') {
                        console.log('识别为判断题答案: 正确');
                        return ['true'];
                    } else if (domAnswerText === '错误' || domAnswerText === '错' || domAnswerText === 'False' || domAnswerText === 'false') {
                        console.log('识别为判断题答案: 错误');
                        return ['false'];
                    } else if (domAnswerText.length === 1 && /^[A-Z]$/.test(domAnswerText)) {
                        // 单选题答案：单个字母
                        console.log('识别为单选题答案:', domAnswerText);
                        return [domAnswerText];
                    } else if (domAnswerText.includes(',') && /^[A-Z,\s]+$/i.test(domAnswerText)) {
                        // 多选题答案：逗号分隔的字母（如"A,B,C,D"）
                        console.log('识别为逗号分隔的多选题答案:', domAnswerText);
                        // 按逗号分割，过滤出字母字符，转换为大写
                        var answers = domAnswerText.split(',').map(function (item) {
                            return item.trim().toUpperCase();
                        }).filter(function (item) {
                            return /^[A-D]$/.test(item);
                        });
                        console.log('解析后的答案数组:', answers);
                        return answers;
                    } else if (domAnswerText.length > 1 && /^[A-Z]+$/.test(domAnswerText)) {
                        // 多选题答案：多个字母（如"AB"）
                        console.log('识别为多选题答案:', domAnswerText);
                        return domAnswerText.split('');
                    } else if (/^[A-D]$/i.test(domAnswerText)) {
                        // 单个字母选项（不区分大小写）
                        console.log('识别为选项答案:', domAnswerText.toUpperCase());
                        return [domAnswerText.toUpperCase()];
                    } else if (/^[A-D]+$/i.test(domAnswerText)) {
                        // 多个字母选项（不区分大小写）
                        console.log('识别为多选题答案:', domAnswerText.toUpperCase());
                        return domAnswerText.toUpperCase().split('');
                    } else {
                        // 其他类型的答案（如文字）
                        console.log('识别为文本答案:', domAnswerText);
                        return [domAnswerText];
                    }
                }
            }

            // 备用方案：直接查找包含"答案："或"正确答案："的元素
            console.log('尝试备用方案：查找包含答案关键词的元素');
            var answerElements = $(':contains("答案："), :contains("正确答案："), :contains("参考答案：")');
            if (answerElements.length > 0) {
                // 过滤出可能在当前问题容器内的元素
                var questionContainer = $('#question' + questionId + ', .question-wrapper[id="question' + questionId + '"]');
                var relevantElements = answerElements.filter(function () {
                    // 检查元素是否在问题容器内
                    return questionContainer.length === 0 || $(this).closest(questionContainer).length > 0;
                });

                if (relevantElements.length > 0) {
                    console.log('找到包含答案关键词的元素，数量:', relevantElements.length);
                    // 取第一个相关元素
                    var answerElement = relevantElements.first();
                    var fullText = answerElement.text().trim();
                    console.log('包含关键词的完整文本:', fullText);

                    // 尝试提取答案
                    var match = fullText.match(/(?:答案|正确答案|参考答案)：\s*([^\s](?:.*[^\s])?)/);
                    if (match && match[1]) {
                        var extractedAnswer = match[1].trim();
                        console.log('从备用方案提取的答案:', extractedAnswer);
                        // 解析答案
                        if (extractedAnswer === '正确' || extractedAnswer === '对') {
                            return ['true'];
                        } else if (extractedAnswer === '错误' || extractedAnswer === '错') {
                            return ['false'];
                        } else if (extractedAnswer.includes(',') && /^[A-Z,\s]+$/i.test(extractedAnswer)) {
                            // 多选题答案：逗号分隔的字母（如"A,B,C,D"）
                            console.log('识别为逗号分隔的多选题答案:', extractedAnswer);
                            // 按逗号分割，过滤出字母字符，转换为大写
                            var answers = extractedAnswer.split(',').map(function (item) {
                                return item.trim().toUpperCase();
                            }).filter(function (item) {
                                return /^[A-D]$/.test(item);
                            });
                            console.log('解析后的答案数组:', answers);
                            return answers;
                        } else if (/^[A-Z]+$/.test(extractedAnswer)) {
                            return extractedAnswer.split('');
                        } else if (/^[A-D]+$/i.test(extractedAnswer)) {
                            return extractedAnswer.toUpperCase().split('');
                        } else {
                            return [extractedAnswer];
                        }
                    }
                }
            }

            // 如果没找到，等待一段时间再重试
            if (retry < maxRetries - 1) {
                console.log('未找到答案，等待' + retryDelay + 'ms后重试...');
                // 同步等待（使用繁忙循环，因为async: false）
                var start = Date.now();
                while (Date.now() - start < retryDelay) {
                    // 繁忙等待
                }
            }
        }

        console.log('未能在DOM中找到答案，questionId:', questionId);
        return null;
    }

    // 检查是否有答案可用（API或DOM）
    function hasAnswersAvailable(questionIds) {
        if (!questionIds || questionIds.length === 0) return false;

        // 检查第一个题目是否有答案
        var firstId = questionIds[0];
        var hasAnswer = false;

        // 先尝试API
        $.ajax({
            url: 'https://api.ulearning.cn/questionAnswer/' + firstId,
            type: "GET",
            contentType: "application/json",
            dataType: 'json',
            async: false,
            data: {
                parentId: pageid,
            },
            success: function (result, status, xhr) {
                if (result.correctAnswerList !== undefined && result.correctAnswerList !== null) {
                    hasAnswer = true;
                }
            }
        });

        // 如果API没有答案，检查DOM
        if (!hasAnswer) {
            var domAnswer = getAnswerFromDOM(firstId);
            if (domAnswer !== null) {
                hasAnswer = true;
            }
        }

        console.log('答案可用性检查:', hasAnswer ? '有答案' : '无答案');
        return hasAnswer;
    }

    // 检查题目是否已完成（有.finished类或包含"回答正确"文本）
    function isQuestionCompleted(questionElement) {
        if (!questionElement) return false;

        // 检查是否包含"回答正确"文本 - 最可靠的指标
        var text = $(questionElement).text();
        if (text.includes('回答正确')) {
            return true;
        }

        // 检查.finished类，但需要验证答案是否真的被选中
        if ($(questionElement).hasClass('finished')) {
            // 进一步验证：检查是否有选中的答案选项
            var hasSelectedAnswer = false;

            // 检查选择题：.checkbox.selected
            var selectedCheckboxes = $(questionElement).find('.checkbox.selected');
            if (selectedCheckboxes.length > 0) {
                hasSelectedAnswer = true;
            }

            // 检查判断题：.choice-btn.selected
            var selectedChoiceBtns = $(questionElement).find('.choice-btn.selected');
            if (selectedChoiceBtns.length > 0) {
                hasSelectedAnswer = true;
            }

            // 检查填空/简答题：textarea或input是否有内容
            var filledInputs = $(questionElement).find('textarea, .blank-input, input[type="text"]').filter(function () {
                return $(this).val().trim().length > 0;
            });
            if (filledInputs.length > 0) {
                hasSelectedAnswer = true;
            }

            // 如果有.finished类但没有选中的答案，很可能题目没有真正完成
            if (hasSelectedAnswer) {
                return true;
            } else {
                console.log('题目有.finished类但没有选中的答案，视为未完成');
                return false;
            }
        }

        return false;
    }

    // 获取未完成的题目列表
    function getUnfinishedQuestions() {
        var unfinished = [];
        $('.question-wrapper').each(function (k, v) {
            if (!isQuestionCompleted(v)) {
                unfinished.push(v);
            }
        });
        return unfinished;
    }

    function ShowAndFillAnswer() {
        if (autoAnswering | !ENABLE_AUTO_FILL_ANSWER)
            return;
        autoAnswering = true;

        // 获取当前页面ID
        var pages = $('.page-item');
        var flag = false;
        pages.each(function (k, v) {
            if (flag) return;
            var sp = $(v).find('.page-name');
            if (sp.length > 0 && sp[0].className.search('active') >= 0) {
                var pd = $(v).attr('id');
                pd = pd.slice(pd.search(/\d/g));
                pageid = pd;
                flag = true;
            }
        });
        if (!flag) {
            autoAnswering = false;
            GotoNextPage();
            return;
        }

        // 获取所有题目和未完成题目
        var allQuestions = $('.question-wrapper');
        if (allQuestions.length <= 0) {
            autoAnswering = false;
            return;
        }

        var unfinishedQuestions = getUnfinishedQuestions();
        Logger.info('题目统计：总共', allQuestions.length, '个，未完成', unfinishedQuestions.length, '个');

        // 如果没有未完成题目，直接翻页
        if (unfinishedQuestions.length === 0) {
            Logger.info('所有题目已完成，跳过处理');
            autoAnswering = false;

            // 检查是否有提交按钮，如果有则点击提交（可能已经提交过了）
            var submitBtn = $('.btn-submit:contains("提交")');
            if (submitBtn.length > 0) {
                Logger.info('检测到提交按钮，点击提交确保完成');
                submitBtn.click();
                setTimeout(GotoNextPage, 2000);
            } else {
                GotoNextPage();
            }
            return;
        }

        // 只处理未完成题目
        var qw = $(unfinishedQuestions);
        var sqList = [];
        var an = [];
        qw.each(function (k, v) {
            var id = $(v).attr('id');
            if (id) {
                sqList.push(id.replace('question', ''));
            }
        });


        // 检查是否有答案可用
        var hasAnswer = false;
        var firstId = sqList[0];

        // 尝试API获取答案
        $.ajax({
            url: 'https://api.ulearning.cn/questionAnswer/' + firstId,
            type: "GET",
            contentType: "application/json",
            dataType: 'json',
            async: false,
            data: {
                parentId: pageid,
            },
            success: function (result, status, xhr) {
                if (result.correctAnswerList !== undefined && result.correctAnswerList !== null) {
                    hasAnswer = true;
                }
            }
        });

        // 尝试DOM获取答案
        if (!hasAnswer) {
            var domAnswer = getAnswerFromDOM(firstId);
            if (domAnswer !== null) {
                hasAnswer = true;
            }
        }

        Logger.info('答案检查结果：', hasAnswer ? '有答案' : '无答案');

        if (!hasAnswer) {
            // 无答案：需要先提交一次以获取答案
            Logger.info('无答案，执行初次提交以获取答案');
            performInitialSubmission(qw, sqList);
        } else {
            // 有答案：直接进行正确答案流程
            console.log('有答案，进行正确答案流程');
            performCorrectAnswerFlow(qw, sqList, an);
        }
    }

    // 初次提交以获取答案
    function performInitialSubmission(qw, sqList) {
        Logger.info('执行初次提交');

        // 尝试选择一些答案（增加提交成功率）
        var checkBox = qw.find('.checkbox');
        var choiceBox = qw.find('.choice-btn');

        // 选择题：点击第一个选项
        if (checkBox.length > 0) {
            Logger.info('发现选择题，点击第一个选项');
            var firstCheckbox = checkBox.first();
            if (firstCheckbox.length > 0 && !firstCheckbox.hasClass('selected')) {
                firstCheckbox.click();
            }
        }

        // 判断题：点击"正确"
        if (choiceBox.length > 0) {
            Logger.info('发现判断题，点击"正确"');
            var firstChoice = choiceBox.first();
            if (firstChoice.length > 0) {
                firstChoice.click();
            }
        }

        // 填空和简答题：尝试填写一些内容
        if (ENABLE_AUTO_ANSWER_FILLS) {
            var txtAreas = $('textarea, .blank-input');
            if (txtAreas.length > 0) {
                Logger.info('发现填空/简答题，填写默认内容');
                txtAreas.each((k, v) => {
                    $(v).val('答案');
                });
                $.globalEval("$('textarea, .blank-input').trigger('change')");
            }
        }

        // 提交答案 - 等待1秒让页面处理选择
        if (ENABLE_AUTO_PLAY) {
            Logger.info('已选择答案，等待1秒让页面处理...');
            // 同步等待1秒
            var waitStart = Date.now();
            while (Date.now() - waitStart < 1000) {
                // 繁忙等待
            }
            Logger.info('等待结束，开始提交');

            $('textarea, .blank-input').trigger('change');
            // 寻找包含"提交"文本的提交按钮
            var submitBtns = $('.btn-submit:contains("提交")');
            if (submitBtns.length > 0) {
                console.log('找到提交按钮，点击提交');
                submitBtns.click();
            } else {
                // 如果没有找到特定文本的提交按钮，尝试所有提交按钮
                console.log('未找到包含"提交"的按钮，尝试所有.btn-submit按钮');
                $('.btn-submit').click();
            }
            console.log('初次提交完成，等待答案出现');

            // 等待5秒让答案出现
            autoAnswering = false;
            setTimeout(function () {
                console.log('等待结束，重新检查答案');
                // 重新检查答案并执行正确答案流程
                setTimeout(ShowAndFillAnswer, 1500);
            }, 5000);
        } else {
            autoAnswering = false;
        }
    }

    // 正确答案流程：有答案时的处理
    function performCorrectAnswerFlow(qw, sqList, an) {
        console.log('开始正确答案流程');

        // 过滤掉已完成的题目
        var filteredQuestions = [];
        var filteredIds = [];
        qw.each(function (k, v) {
            if (!isQuestionCompleted(v)) {
                filteredQuestions.push(v);
                var id = $(v).attr('id');
                if (id) {
                    filteredIds.push(id.replace('question', ''));
                }
            }
        });

        // 如果所有题目都已完成，直接返回
        if (filteredQuestions.length === 0) {
            console.log('所有题目已完成，无需处理');
            autoAnswering = false;
            return;
        }

        // 更新qw和sqList为未完成题目
        qw = $(filteredQuestions);
        sqList = filteredIds;

        console.log('正确答案流程：处理', sqList.length, '个未完成题目');

        // 获取所有答案
        an = []; // 重置答案数组
        $(sqList).each(function (k, id) {
            var flag = false;
            var retryCount = 0;
            var maxRetries = 3;

            while (!flag && retryCount < maxRetries) {
                $.ajax({
                    url: 'https://api.ulearning.cn/questionAnswer/' + id,
                    type: "GET",
                    contentType: "application/json",
                    dataType: 'json',
                    async: false,
                    data: {
                        parentId: pageid,
                    },
                    success: function (result, status, xhr) {
                        var answer = result.correctAnswerList;
                        if (answer === undefined || answer === null) {
                            // 尝试从DOM中获取答案
                            answer = getAnswerFromDOM(id);
                        }
                        an.push(answer);
                        flag = true;
                    },
                    error: function (_xhr, _status, _error) {
                        retryCount++;
                        console.log('获取答案失败，重试 ' + retryCount + '/' + maxRetries + '，questionId:', id);
                        if (retryCount >= maxRetries) {
                            // 最后一次重试失败，尝试从DOM获取
                            var answer = getAnswerFromDOM(id);
                            an.push(answer);
                            flag = true;
                        }
                    }
                });
            }
        });

        // 检查是否有重做按钮（如果有已完成题目）
        var completedQuestions = $('.question-wrapper.finished');
        console.log('已完成题目数量:', completedQuestions.length);

        // 尝试多种选择器查找重做按钮
        var redoSelectors = [
            '.btn-redo',
            '.redo-btn',
            '.btn-reset',
            '.reset-btn',
            '.btn-redo-question',
            '.question-redo',
            '[data-bind*="redo"]',
            '[onclick*="redo"]',
            'button:contains("重做")',
            'a:contains("重做")',
            'span:contains("重做")',
            'div:contains("重做")',
            '.question-wrapper .btn',
            '.question-footer .btn'
        ];

        var redoButtons = null;
        var foundSelector = null;

        for (var i = 0; i < redoSelectors.length; i++) {
            var selector = redoSelectors[i];
            var buttons = $(selector);
            if (buttons.length > 0) {
                console.log('找到重做按钮，选择器:', selector, '数量:', buttons.length);
                redoButtons = buttons;
                foundSelector = selector;
                break;
            }
        }

        if (!redoButtons || redoButtons.length === 0) {
            console.log('未找到重做按钮，检查页面中可能的按钮');
            // 记录所有按钮供调试
            var allButtons = $('button, a.btn, .btn, [role="button"]');
            console.log('页面中按钮总数:', allButtons.length);
            allButtons.each(function (k, btn) {
                var text = $(btn).text().trim();
                if (text.includes('重做') || text.includes('重置') || text.includes('Redo') || text.includes('Reset')) {
                    console.log('可能的重做按钮:', text, '类名:', btn.className);
                }
            });
        }

        // 检查是否所有题目都有.finished类但没有"回答正确"文本
        var allFinished = completedQuestions.length === qw.length;
        var hasCorrectText = false;
        qw.each(function (k, v) {
            var text = $(v).text();
            if (text.includes('回答正确')) {
                hasCorrectText = true;
            }
        });

        // 特殊情况：所有题目都有.finished类但没有"回答正确"文本
        var shouldForceRedo = allFinished && !hasCorrectText && redoButtons && redoButtons.length > 0;

        // 只有在有未完成题目且有重做按钮时才点击重做按钮
        // 或者特殊情况：所有题目都有.finished类但没有"回答正确"文本
        if ((filteredQuestions.length > 0 || shouldForceRedo) && redoButtons && redoButtons.length > 0) {
            console.log('有未完成题目且发现重做按钮，点击重做按钮重置题目，选择器:', foundSelector);
            redoButtons.each((k, btn) => {
                console.log('点击第' + (k + 1) + '个重做按钮');
                btn.click();
            });

            // 等待页面重置（2秒）
            var start = Date.now();
            while (Date.now() - start < 2000) {
                // 繁忙等待
            }

            // 重新获取所有题目列表（因为页面已重置）
            var allQuestionsAfterReset = $('.question-wrapper');
            var newFilteredQuestions = [];
            var newFilteredIds = [];
            allQuestionsAfterReset.each(function (k, v) {
                if (!isQuestionCompleted(v)) {
                    newFilteredQuestions.push(v);
                    var id = $(v).attr('id');
                    if (id) {
                        newFilteredIds.push(id.replace('question', ''));
                    }
                }
            });

            // 如果重置后所有题目都已完成，直接返回
            if (newFilteredQuestions.length === 0) {
                console.log('重置后所有题目已完成，无需处理');
                autoAnswering = false;
                return;
            }

            // 更新qw和sqList为重置后的未完成题目
            qw = $(newFilteredQuestions);
            sqList = newFilteredIds;

            // 重新获取答案（因为页面已重置）
            an = [];
            $(sqList).each(function (k, id) {
                var flag = false;
                var retryCount = 0;
                var maxRetries = 3;

                while (!flag && retryCount < maxRetries) {
                    $.ajax({
                        url: 'https://api.ulearning.cn/questionAnswer/' + id,
                        type: "GET",
                        contentType: "application/json",
                        dataType: 'json',
                        async: false,
                        data: {
                            parentId: pageid,
                        },
                        success: function (result, status, xhr) {
                            var answer = result.correctAnswerList;
                            if (answer === undefined || answer === null) {
                                answer = getAnswerFromDOM(id);
                            }
                            an.push(answer);
                            flag = true;
                        },
                        error: function (_xhr, _status, _error) {
                            retryCount++;
                            console.log('重新获取答案失败，重试 ' + retryCount + '/' + maxRetries + '，questionId:', id);
                            if (retryCount >= maxRetries) {
                                // 最后一次重试失败，尝试从DOM获取
                                var answer = getAnswerFromDOM(id);
                                an.push(answer);
                                flag = true;
                            }
                        }
                    });
                }
            });
        }

        // 显示答案
        if (ENABLE_AUTO_SHOW_ANSWER) {
            var t = qw.find('.question-title-html');
            t.each(function (k, v) {
                var ans = an.shift();
                // 如果ans为undefined，尝试从DOM获取答案
                if (ans === undefined || ans === null) {
                    var questionWrapper = $(v).closest('.question-wrapper');
                    if (questionWrapper.length > 0) {
                        var questionId = questionWrapper.attr('id');
                        if (questionId) {
                            // 提取数字ID
                            var idMatch = questionId.match(/question(\d+)/);
                            if (idMatch && idMatch[1]) {
                                ans = getAnswerFromDOM(idMatch[1]);
                            }
                        }
                    }
                }
                // 显示答案
                var displayText = ans;
                if (ans === undefined || ans === null) {
                    displayText = '未知';
                } else if (Array.isArray(ans)) {
                    displayText = ans.join(', ');
                }
                $(v).after('<span style="color:red;">答案：' + displayText + '</span>');
                an.push(ans);
            });
        }

        // 根据答案选择正确选项
        // 尝试多种选择器查找选择题选项
        var checkBox = qw.find('.checkbox');
        if (checkBox.length === 0) {
            // 备用选择器：查找可能的多选题选项
            checkBox = qw.find('[role="button"], .choice-item, .option-item, .text, .content-wrapper, .choice-option');
            console.log('使用备用选择器找到选择题选项数量:', checkBox.length);
        }
        var choiceBox = qw.find('.choice-btn');
        if (choiceBox.length === 0) {
            // 备用选择器：查找可能的判断题选项
            choiceBox = qw.find('.judge-btn, .true-false-btn, [data-bind*="choice"]');
            console.log('使用备用选择器找到判断题选项数量:', choiceBox.length);
        }
        var checkList = [];
        var choiceList = [];
        let lasOffsetP = '';
        console.log('开始分组选择题选项，总数:', checkBox.length);
        checkBox.each((k, cb) => {
            var offsetParentId = $(cb).offsetParent().attr('id');
            console.log('选项' + k + '的offsetParent id:', offsetParentId);
            if (lasOffsetP == offsetParentId) {
                console.log('选项' + k + '属于当前问题组');
                checkList[checkList.length - 1].push(cb);
            } else {
                console.log('选项' + k + '开始新问题组，前一个组id:', lasOffsetP);
                var l = [];
                l.push(cb);
                checkList.push(l);
                lasOffsetP = offsetParentId;
            }
        });
        console.log('选择题分组完成，组数:', checkList.length);
        console.log('开始分组判断题选项，总数:', choiceBox.length);
        lasOffsetP = '';
        choiceBox.each((k, cb) => {
            var offsetParentId = $(cb).offsetParent().attr('id');
            console.log('判断题选项' + k + '的offsetParent id:', offsetParentId);
            if (lasOffsetP == offsetParentId) {
                console.log('判断题选项' + k + '属于当前问题组');
                choiceList[choiceList.length - 1].push(cb);
            } else {
                console.log('判断题选项' + k + '开始新问题组，前一个组id:', lasOffsetP);
                var l = [];
                l.push(cb);
                choiceList.push(l);
                lasOffsetP = offsetParentId;
            }
        });
        console.log('判断题分组完成，组数:', choiceList.length);

        // 使用正确答案作答
        console.log('开始使用答案作答，an数组:', an);
        console.log('checkList结构:', checkList);
        console.log('choiceList结构:', choiceList);

        an.forEach((a, index) => {
            console.log('处理第' + (index + 1) + '个答案:', a);
            if (a == null || a == undefined || a.length <= 0) {
                console.log('答案为空或无效，跳过');
                return;
            }

            // 检查是否为选择题答案（A-D字母）
            if (a[0].match(/[A-Z]/i) && a[0].length == 1 && ENABLE_AUTO_ANSWER_CHOICES) {
                console.log('识别为选择题答案');
                if (checkList.length === 0) {
                    console.error('checkList为空，无法处理选择题');
                    return;
                }
                var cb = checkList.shift();
                console.log('当前问题的选项数组:', cb);
                a.forEach(aa => {
                    console.log('选择答案:', aa);
                    var charCode = aa.toUpperCase().charCodeAt(0);
                    var optionIndex = charCode - 65; // A=0, B=1, C=2, D=3
                    console.log('字母' + aa + '的索引:', optionIndex);
                    var cccb = $(cb[optionIndex]);
                    console.log('找到的选项元素:', cccb.length > 0 ? '找到' : '未找到');
                    if (cccb[0] === undefined) {
                        console.error('选项' + aa + '不存在，选项总数:', cb.length);
                    } else if (cccb[0].className.search('selected') < 0) {
                        console.log('点击选项' + aa);
                        cccb.click();
                    } else {
                        console.log('选项' + aa + '已经选中');
                    }
                });
            } else if (a[0].match(/(([tT][rR][uU][eE])|([fF][aA][lL][sS][eE]))/) && ENABLE_AUTO_ANSWER_JUDGES) {
                console.log('识别为判断题答案');
                if (choiceList.length === 0) {
                    console.error('choiceList为空，无法处理判断题');
                    return;
                }
                var ccb = choiceList.shift();
                console.log('当前判断题选项:', ccb);
                a.forEach(aa => {
                    console.log('判断题答案:', aa);
                    if (aa.match(/([tT][rR][uU][eE])/)) {
                        console.log('点击"正确"按钮');
                        ccb[0].click();
                    } else {
                        console.log('点击"错误"按钮');
                        ccb[1].click();
                    }
                });
            } else {
                console.log('未知答案类型:', a[0]);
            }
            return;
        });

        // 填空和简答题
        if (ENABLE_AUTO_ANSWER_FILLS) {
            FillAnswers();
            $.globalEval("$('textarea, .blank-input').trigger('change')");
        }

        // 提交正确答案 - 等待3秒让页面处理所有选择
        if (ENABLE_AUTO_PLAY) {
            console.log('所有答案已选择，等待3秒让页面处理...');
            // 同步等待3秒
            var waitStart = Date.now();
            while (Date.now() - waitStart < 3000) {
                // 繁忙等待
            }
            Logger.info('等待结束，开始提交');

            $('textarea, .blank-input').trigger('change');
            // 寻找包含"提交"文本的提交按钮
            var submitBtns = $('.btn-submit:contains("提交")');
            if (submitBtns.length > 0) {
                Logger.info('找到提交按钮，点击提交正确答案');
                submitBtns.click();
            } else {
                // 如果没有找到特定文本的提交按钮，尝试所有提交按钮
                console.log('未找到包含"提交"的按钮，尝试所有.btn-submit按钮');
                $('.btn-submit').click();
            }
            console.log('正确答案已提交');

            // 等待题目显示"回答正确"
            autoAnswering = false;
            var checkCount = 0;
            var maxChecks = 6; // 最多检查6次，每次2秒，总共最多12秒
            var checkInterval = 2000; // 每2秒检查一次

            function checkAndNavigate() {
                checkCount++;
                console.log('检查题目完成状态，第' + checkCount + '次');

                var qw = $('.question-wrapper');
                if (qw.length === 0) {
                    console.log('没有题目，可能是非题目页面，尝试翻页');
                    GotoNextPage();
                    return;
                }

                // 检查题目是否完成（有.finished类）
                var completedQuestions = $('.question-wrapper.finished');
                var allCompleted = completedQuestions.length === qw.length;

                // 也可以检查是否有"回答正确"文本
                var correctTextFound = false;
                qw.each(function (k, v) {
                    var text = $(v).text();
                    if (text.includes('回答正确')) {
                        correctTextFound = true;
                    }
                });

                console.log('题目统计：总共', qw.length, '个，已完成', completedQuestions.length, '个，找到"回答正确"文本：', correctTextFound);

                if (allCompleted || correctTextFound) {
                    console.log('题目已完成，准备翻页');
                    GotoNextPage();
                } else if (checkCount < maxChecks) {
                    console.log('题目未完成，继续等待');
                    setTimeout(checkAndNavigate, checkInterval);
                } else {
                    console.log('等待超时，尝试翻页');
                    GotoNextPage();
                }
            }

            // 第一次检查等待3秒
            setTimeout(checkAndNavigate, 3000);
            return;
        }
        autoAnswering = false;
    }


    function DrawOptionPanel() {
        // 内联CSS样式 - 替换外部CSS文件
        var style = document.createElement('style');
        style.type = 'text/css';
        style.textContent = `
            .OptionPanel {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 999999;
                font-family: "Microsoft YaHei", Arial, sans-serif;
                font-size: 14px;
                user-select: none;
            }

            .DragBall {
                width: 40px;
                height: 40px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 50%;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: move;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                font-weight: bold;
                font-size: 16px;
                transition: all 0.3s ease;
            }

            .DragBall:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
            }

            .MainPanel {
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                padding: 20px;
                width: 320px;
                max-height: 80vh;
                overflow-y: auto;
                margin-bottom: 10px;
                border: 1px solid #e0e0e0;
            }

            .OptionMainTitle {
                margin: 0 0 15px 0;
                color: #333;
                font-size: 18px;
                text-align: center;
                border-bottom: 2px solid #667eea;
                padding-bottom: 10px;
                line-height: 1.4;
            }

            .OptionMainTitle br {
                display: block;
                content: "";
                margin-top: 5px;
            }

            h4 {
                color: #667eea;
                margin: 20px 0 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid #eee;
                font-size: 16px;
            }

            .OptionUL {
                list-style: none;
                padding: 0;
                margin: 10px 0;
            }

            .OptionUL li {
                margin: 12px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
                line-height: 1.5;
            }

            .OptionInput[type="checkbox"] {
                transform: scale(1.3);
                cursor: pointer;
                accent-color: #667eea;
            }

            .OptionInput[type="number"] {
                width: 80px;
                padding: 6px 10px;
                border: 1px solid #ddd;
                border-radius: 4px;
                text-align: center;
                font-size: 14px;
                transition: border-color 0.3s;
            }

            .OptionInput[type="number"]:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
            }

            button {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                margin: 5px;
                transition: all 0.3s ease;
                display: inline-block;
            }

            button:hover {
                opacity: 0.9;
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }

            button:active {
                transform: translateY(0);
            }

            #MainBtn {
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                width: 100%;
                margin-bottom: 15px;
            }

            #SaveOpBtn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                width: 100%;
                margin-top: 15px;
                font-weight: bold;
            }

            .noclick {
                pointer-events: none;
            }

            p {
                margin: 10px 0;
                font-size: 12px;
                line-height: 1.5;
                color: #666;
            }

            p[style*="hotpink"] {
                color: #ff6b9d !important;
                background: #fff5f8;
                padding: 8px 12px;
                border-radius: 4px;
                border-left: 3px solid #ff6b9d;
                margin-top: 15px;
            }

            p[style*="hotpink"] strong {
                color: #d81b60;
            }

            /* 响应式调整 */
            @media (max-width: 768px) {
                .OptionPanel {
                    top: 10px;
                    right: 10px;
                }

                .MainPanel {
                    width: 280px;
                    max-height: 70vh;
                }
            }

            /* 滚动条样式 */
            .MainPanel::-webkit-scrollbar {
                width: 6px;
            }

            .MainPanel::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .MainPanel::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 3px;
            }

            .MainPanel::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
        `;
        document.head.appendChild(style);

        var root = document.getElementsByTagName('body')[0];
        var panel = document.createElement('div');
        root.appendChild(panel);
        panel.setAttribute('class', 'OptionPanel');
        panel.innerHTML = "<div class='OptionPanel'><div class='DragBall'>UL</div><div class='MainPanel'><h2 class='OptionMainTitle'>优学院辅助脚本</br>by EliotZhang、BrushJIM</h2><button id='MainBtn'>隐藏设置</button><h4>视频播放</h4><ul class='OptionUL'><li>自动翻页、播放视频?<input class='OptionInput'id='AutoPlay'type='checkbox'checked='checked'></li><li>自动静音?<input class='OptionInput'id='AutoMute'type='checkbox'checked='checked'></li><li>自动调整速率(依赖自动播放视频功能)?<input class='OptionInput'id='AutoPlayRate'type='checkbox'checked='checked'></li><li>自动的速率速度<input class='OptionInput'id='AutoPlayRateChange'type='number'value='1.50'step='0.25'min='0.25'max='15.00'></li></ul><h4>自动作答</h4><ul class='OptionUL'><li>自动作答(总开关)?<input class='OptionInput'id='AutoAnswer'type='checkbox'checked='checked'></li><li>自动显示答案?<input class='OptionInput'id='AutoShowAnswer'type='checkbox'checked='checked'></li><li>自动作答选择题?<input class='OptionInput'id='AutoAnswerChoices'type='checkbox'checked='checked'></li><li>自动作答判断题?<input class='OptionInput'id='AutoAnswerJudges'type='checkbox'checked='checked'></li><li>自动作答填空、简答题?<input class='OptionInput'id='AutoAnswerFills'type='checkbox'checked='checked'></li></ul><button id='SaveOpBtn'>保存设置并刷新脚本</button><p style='color:hotpink;'>若<strong>关闭自动翻页功能</strong>导致<strong>自动作答系列功能失效</strong>请点击<strong>保存设置并刷新脚本按钮！</strong></p><p style='color:hotpink;'>若关闭自动翻页功能答完题后请<strong>手动提交！！</strong></p></div></div>";
    }

    function Init() {
        mainBtn = document.getElementById('MainBtn');
        dragBall = $('.DragBall');
        saveOpBtn = document.getElementById('SaveOpBtn');
        OptionPanel = $('.OptionPanel');
        MainPanel = $('.MainPanel');
        autoPlayOp = document.getElementById('AutoPlay');
        autoMuteOp = document.getElementById('AutoMute');
        autoPlayRateOp = document.getElementById('AutoPlayRate');
        autoPlayRateChangeOp = document.getElementById('AutoPlayRateChange');
        autoAnswerOp = document.getElementById('AutoAnswer');
        autoShowAnswerOp = document.getElementById('AutoShowAnswer');
        autoAnswerChoicesOp = document.getElementById('AutoAnswerChoices');
        autoAnswerJudgesOp = document.getElementById('AutoAnswerJudges');
        autoAnswerFillsOp = document.getElementById('AutoAnswerFills');
        dragBall.draggable({
            containment: ".page-scroller ps ps--theme_default",
            start: function (event, ui) {
                $(this).addClass('noclick');
            }
        });
        dragBall.hide();
        mainBtn.addEventListener('click', function () {
            MainPanel.hide();
            dragBall.show();
        }, true);
        dragBall.click(function (e) {
            if ($(this).hasClass('noclick')) {
                $(this).removeClass('noclick');
            } else if (e.target == e.currentTarget) {
                MainPanel.show();
                $(this).hide();
            }
        });
        autoPlayRateChangeOp.addEventListener('change', function () {
            let val = autoPlayRateChangeOp.value;
            if (val > 15.0)
                autoPlayRateChangeOp.value = 15;
            else if (val < 0.25)
                autoPlayRateChangeOp.value = 0.25;
        }, true);
        autoPlayOp.addEventListener('change', function () {
            if (autoPlayOp.checked === false)
                autoMuteOp.checked = autoPlayRateOp.checked = false;
            else
                autoMuteOp.checked = autoPlayRateOp.checked = true;
        });
        autoAnswerOp.addEventListener('change', function () {
            if (autoAnswerOp.checked === false)
                autoAnswerChoicesOp.checked = autoAnswerJudgesOp.checked = autoAnswerFillsOp.checked = autoShowAnswerOp.checked = false;
            else
                autoAnswerChoicesOp.checked = autoAnswerJudgesOp.checked = autoAnswerFillsOp.checked = autoShowAnswerOp.checked = true;
        });
        saveOpBtn.addEventListener('click', function () {
            console.log('[配置管理器] 保存配置...');

            // 更新全局配置变量
            ENABLE_AUTO_MUTE = autoMuteOp.checked;
            ENABLE_AUTO_CHANGE_RATE = autoPlayRateOp.checked;
            ENABLE_AUTO_PLAY = autoPlayOp.checked;
            ENABLE_AUTO_SHOW_ANSWER = autoShowAnswerOp.checked;
            ENABLE_AUTO_ANSWER_CHOICES = autoAnswerChoicesOp.checked;
            ENABLE_AUTO_ANSWER_JUDGES = autoAnswerJudgesOp.checked;
            ENABLE_AUTO_ANSWER_FILLS = autoAnswerFillsOp.checked;

            // 自动答题总开关逻辑
            if (!ENABLE_AUTO_SHOW_ANSWER && !ENABLE_AUTO_ANSWER_CHOICES && !ENABLE_AUTO_ANSWER_JUDGES && !ENABLE_AUTO_ANSWER_FILLS) {
                autoAnswerOp.checked = false;
            }
            ENABLE_AUTO_FILL_ANSWER = autoAnswerOp.checked;
            PLAYBACK_RATE = parseFloat(autoPlayRateChangeOp.value);

            // 使用配置管理器保存配置
            var newConfig = {
                enableAutoMute: ENABLE_AUTO_MUTE,
                enableAutoChangeRate: ENABLE_AUTO_CHANGE_RATE,
                enableAutoPlay: ENABLE_AUTO_PLAY,
                enableAutoShowAnswer: ENABLE_AUTO_SHOW_ANSWER,
                enableAutoAnswerChoices: ENABLE_AUTO_ANSWER_CHOICES,
                enableAutoAnswerJudges: ENABLE_AUTO_ANSWER_JUDGES,
                enableAutoAnswerFills: ENABLE_AUTO_ANSWER_FILLS,
                enableAutoFillAnswer: ENABLE_AUTO_FILL_ANSWER,
                playbackRate: PLAYBACK_RATE
            };

            config.setAll(newConfig);
            config.saveToStorage();

            console.log('[配置管理器] 配置已保存:', newConfig);

            // 重新启动视频和检查模态框
            Video({}, true);
            CheckModal(true);
        }, true);
        // Load - 从配置管理器加载配置
        console.log('[配置管理器] 加载配置到UI...');
        var currentConfig = config.getAll();

        // 更新UI控件
        autoMuteOp.checked = ENABLE_AUTO_MUTE = currentConfig.enableAutoMute;
        autoPlayRateOp.checked = ENABLE_AUTO_CHANGE_RATE = currentConfig.enableAutoChangeRate;
        autoPlayOp.checked = ENABLE_AUTO_PLAY = currentConfig.enableAutoPlay;
        autoShowAnswerOp.checked = ENABLE_AUTO_SHOW_ANSWER = currentConfig.enableAutoShowAnswer;
        autoAnswerChoicesOp.checked = ENABLE_AUTO_ANSWER_CHOICES = currentConfig.enableAutoAnswerChoices;
        autoAnswerJudgesOp.checked = ENABLE_AUTO_ANSWER_JUDGES = currentConfig.enableAutoAnswerJudges;
        autoAnswerFillsOp.checked = ENABLE_AUTO_ANSWER_FILLS = currentConfig.enableAutoAnswerFills;
        autoAnswerOp.checked = ENABLE_AUTO_FILL_ANSWER = currentConfig.enableAutoFillAnswer;
        autoPlayRateChangeOp.value = PLAYBACK_RATE = currentConfig.playbackRate;

        console.log('[配置管理器] 配置已加载到UI:', {
            enableAutoMute: ENABLE_AUTO_MUTE,
            enableAutoChangeRate: ENABLE_AUTO_CHANGE_RATE,
            enableAutoPlay: ENABLE_AUTO_PLAY,
            enableAutoShowAnswer: ENABLE_AUTO_SHOW_ANSWER,
            enableAutoAnswerChoices: ENABLE_AUTO_ANSWER_CHOICES,
            enableAutoAnswerJudges: ENABLE_AUTO_ANSWER_JUDGES,
            enableAutoAnswerFills: ENABLE_AUTO_ANSWER_FILLS,
            enableAutoFillAnswer: ENABLE_AUTO_FILL_ANSWER,
            playbackRate: PLAYBACK_RATE
        });
    }

    function Main() {
        try {
            DrawOptionPanel();
            Init();
            Video();
            CheckModal();
            console.log('优学院脚本 v1.6.2 初始化成功');
        } catch (error) {
            console.error('优学院脚本初始化失败:', error);
            // 尝试恢复基本功能
            try {
                Video();
                CheckModal();
            } catch (e) {
                console.error('脚本恢复失败:', e);
            }
        }
    }

    // 安全执行函数
    function safeExecute(func, context) {
        try {
            return func();
        } catch (error) {
            console.warn(`[优学院脚本] ${context} 执行失败:`, error);
            return null;
        }
    }

    // ============================================================================
    // 全局状态变量
    // ============================================================================

    var autoAnswering = false;          // 是否正在自动答题（防止重复执行）
    var checkingModal = false;          // 是否正在检查模态框（防止重复执行）
    var pageid = '';                    // 当前页面ID（用于API请求）

    // ============================================================================
    // UI元素引用
    // ============================================================================

    var mainBtn;                        // 主按钮（隐藏设置按钮）
    var dragBall;                       // 可拖动球体
    var saveOpBtn;                      // 保存设置按钮
    var OptionPanel;                    // 选项面板容器
    var MainPanel;                      // 主面板容器

    // 配置面板复选框元素
    var autoPlayOp;                     // 自动播放开关
    var autoMuteOp;                     // 自动静音开关
    var autoPlayRateOp;                 // 自动调整速率开关
    var autoPlayRateChangeOp;           // 播放速率输入框
    var autoAnswerOp;                   // 自动答题总开关
    var autoShowAnswerOp;               // 自动显示答案开关
    var autoAnswerChoicesOp;            // 自动作答选择题开关
    var autoAnswerJudgesOp;             // 自动作答判断题开关
    var autoAnswerFillsOp;              // 自动作答填空/简答题开关

    setInterval(function () { unsafeWindow.document.dispatchEvent(new Event('mousemove')) }, 1000);

    setTimeout(Main, '3000');

})();