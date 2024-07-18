var isRecoding = 0;
var currentSlide = 0;
var maxSlide = slides.length;
var totalTime = 400;
var currentTimeLine = 0;
var playTimeLine = 0;
var chekTimeOut = 100;
var clickTimeout = 1000;
var currentTimeLineSlideStartClick = 0;
var slideCurrentClick = 1;
var slideCurrentClickTime = 0;
var timeInter = null;

//
function initPlay() {
    setSlide(currentSlide, true);
}

//
function resetPlay() {
    currentTimeLine = 0;
    currentSlide = 0;
    resetAudio();
    initPlay();
    jQuery('#timeLine .time').text(0);
    jQuery('#progress').attr('value', 0);
    var action = jQuery("#playSlide").attr('action');
    if (action == 'play') {
        jQuery("#playSlide").trigger('click');
    }
}

//
function play() {
    if (jQuery('#playSlide').attr('action') !== 'play') {
        return false;
    }
    if (backgroundAudio && backgroundAudio['url']) {
        setBackgroundAudio(backgroundAudio['url'], backgroundAudio['volume']);
    }
    var svgObject = document.getElementById("svgObject");
    //
    timeInter = setInterval(function () {
        currentSlideData = getCurrentSlide();
        if (!currentSlideData) {
            clearInterval(timeInter);
            return false;
        }
        //debugger;
        var clicks = currentSlideData['clicks'];
        var speeches = currentSlideData['speeches'];
        if (clicks && slideCurrentClick <= clicks) {
            //slideCurrentClickTime = slideCurrentClick * clickTimeout;
            if (!slideCurrentClickTime) {
                if (currentSlideData['speech'] && currentSlideData['speech']['duration']) {
                    slideCurrentClickTime += currentSlideData['speech']['duration'] * 1000;
                } else {
                    slideCurrentClickTime += clickTimeout;
                }
            }
            //
            if (currentTimeLine >= currentTimeLineSlideStartClick + slideCurrentClickTime) {
                slideCurrentClick++;
                slideCurrentClickTime += (speeches[slideCurrentClick - 2]) ? speeches[slideCurrentClick - 2]['duration'] * 1000 : clickTimeout;
                setTimeout(function () {
                    var referObjectType = currentSlideData['refer_object_type'] ? currentSlideData['refer_object_type'] : "";
                    if (!referObjectType || referObjectType === 'svg') {
                        svgObject.contentWindow.dispatchEffects(1);
                    }
                    if (speeches[slideCurrentClick - 2]) {
                        var audioUrl = speeches[slideCurrentClick - 2]['audio'];
                        if (!audioUrl) {
                            audioUrl = '';
                        }
                        var offset = (speeches[slideCurrentClick - 2]['offset']) ? speeches[slideCurrentClick - 2]['offset'] * 1000 : 0;
                        setAudio(audioUrl, offset);
                    }
                }, 300);
            }
        }
        //
        if (currentTimeLine >= playTimeLine) {
            currentSlide += 1;
            if (!getCurrentSlide()) {
                clearInterval(timeInter);
                pauseBackgroundAudio();
                //
                resetPlay();
                //
                return false;
            }
            setSlide(currentSlide);
        }
        currentTimeLine += chekTimeOut;
        //var currentTimeLineTemp = roundNumber(currentTimeLine / 1000, 2);
        var currentTimeLineTemp = roundNumber(currentTimeLine / 1000, 0);
        if (currentTimeLineTemp > totalTime) {
            currentTimeLineTemp = totalTime;
        }
        jQuery('#timeLine .time').text(currentTimeLineTemp);
        jQuery('#progress').attr('value', currentTimeLineTemp / totalTime * 100);
    }, chekTimeOut);
    //
}

function roundNumber(num, scale) {
    if (!("" + num).includes("e")) {
        return +(Math.round(num + "e+" + scale) + "e-" + scale);
    } else {
        var arr = ("" + num).split("e");
        var sig = ""
        if (+arr[1] + scale > 0) {
            sig = "+";
        }
        return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
    }
}

function getCurrentSlide() {
    return slides[currentSlide];
}

//trộn đáp án cho câu ghép cặp
function shuffle(array = []) {
    let currentIndex = array.length;
    let randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

const swapDom = (node1, node2) => {
    if (node1 === node2) return;
    const aParent = node1.parentNode;
    const bParent = node2.parentNode;

    const aHolder = document.createElement("div");
    const bHolder = document.createElement("div");

    aParent.replaceChild(aHolder, node1);
    bParent.replaceChild(bHolder, node2);

    aParent.replaceChild(node2, aHolder);
    bParent.replaceChild(node1, bHolder);
};

const getIndexNode = (nodeList, node) => {
    return Array.prototype.indexOf.call(nodeList, node);
};

function setSlide(index, init = false) {
    currentTimeLineSlideStartClick = currentTimeLine;
    slideCurrentClick = 1;
    slideCurrentClickTime = 0;
    playTimeLine = currentTimeLine + slides[index]?.['duration'] * 1000;
    // Background audio
    var audioUrl = slides[index]?.['audio'];
    if (!audioUrl) {
        audioUrl = '';
    }
    var offset = (slides[index]?.['speech']?.['offset']) ? slides[index]?.['speech']?.['offset'] * 1000 : 0;
    setAudio(audioUrl, offset, !init);
    var referObjectUrl = slides[index]?.['refer_object_url'] ? slides[index]?.['refer_object_url'] : "";
    var referObjectType = slides[index]?.['refer_object_type'] ? slides[index]?.['refer_object_type'] : "";
    var type = slides?.[index]?.['type'] ? slides[index]?.['type'] : "";
    //
    jQuery('.objectBox .playerObject').hide();
    jQuery("#videoObject").trigger('pause');
    jQuery('.objectBox .playerObject').removeClass("loaded");

    if (referObjectType === 'image') {
        var playerObject = jQuery("#imageObject");
        playerObject.show(600);
        playerObject.attr('src', referObjectUrl);
        var timeInterval = setInterval(function () {
            if (playerObject.hasClass('loaded')) {
                if (init) {
                    showPlay();
                }
                clearInterval(timeInterval);
            }
        }, 100);
    } else if (referObjectType === 'video') {
        var playerObject = jQuery("#videoObject");
        playerObject.show(600);
        playerObject.attr("controls", false);
        playerObject.attr('src', referObjectUrl);
        var muted = (typeof slides[index]['muted'] !== 'undefined') ? slides[index]['muted'] : true;
        if (muted) {
            playerObject.prop('muted', true);
        } else {
            playerObject.prop('muted', false);
        }
        //playerObject.load(referObjectUrl);
        var timeInterval = setInterval(function () {
            var action = jQuery("#playSlide").attr('action');
            if (playerObject.hasClass('loaded')) {
                jQuery('#loading').hide();
                var subaction = jQuery("#playSlide").attr('subaction');
                if (subaction === 'temp_pause') {
                    jQuery("#playSlide").attr('subaction', '');
                    jQuery("#playSlide").trigger('click');
                }
                if (init) {
                    showPlay();
                }
                if (action === 'play') {
                    playerObject.trigger('play');
                }
                clearInterval(timeInterval);
            } else {
                jQuery('#loading').show();
                if (action === 'play') {
                    jQuery("#playSlide").attr('subaction', 'temp_pause');
                    jQuery("#playSlide").trigger('click');
                }
            }
        }, 100);
    } else if (type === 'quiz') {
        jQuery('#loading').hide();
        if (init) {
            showPlay();
        }
        pauseCurrentScene();
        clearInterval(timeInter);
        const playerControl = document.querySelector('#playerControls')
        const questionWrapper = document.querySelector('.question-wrapper')
        const questions = document.querySelector('.questions')
        const submitQuestion = document.querySelector('.submit-question')
        const nextQuestion = document.querySelector('.next-question')
        const feedback = document.querySelector('.question-wrapper .feedback')
        const questionImage = document.querySelector('.image-question')

        let point = 0;
        let questionIndex = 0;
        let score = 0;

        questionWrapper.style.display = 'flex'
        playerControl.style.visibility = 'hidden'

        const renderQuestion = () => {
            const currentQuestion = slides?.[index]?.data?.questions?.[questionIndex];

            const imageQuestion = questionImage.querySelector('img');
            if (currentQuestion?.file?.src) {
                imageQuestion.src = currentQuestion?.file?.src
            } else {
                questionImage.style.display = 'none';
            }

            const renderJavascriptCode = (jsCode) => {
                return eval(`"use strict";(${jsCode})`);
            }

            if (currentQuestion.type === "multiple_choice") {
                questions.innerHTML = renderJavascriptCode(currentQuestion.theme_view_html.html);
            }

            if (currentQuestion.type === "multiple_response") {
                questions.innerHTML = renderJavascriptCode(currentQuestion.theme_view_html.html);
            }

            if (currentQuestion.type === "true_or_false") {
                questions.innerHTML = renderJavascriptCode(currentQuestion.theme_view_html.html);
            }

            if (currentQuestion.type === "short_answer") {
                questions.innerHTML = renderJavascriptCode(currentQuestion.theme_view_html.html);
            }

            if (currentQuestion.type === "matching") {
                questions.innerHTML = renderJavascriptCode(currentQuestion.theme_view_html.html);
            }

            if (currentQuestion.type === "fill_in_blank") {
                questions.innerHTML = renderJavascriptCode(currentQuestion.theme_view_html.html);
            }

            if (currentQuestion.type === "select_from_list") {
                questions.innerHTML = renderJavascriptCode(currentQuestion.theme_view_html.html);
            }

            if (currentQuestion.type === "essay") {
                questions.innerHTML = renderJavascriptCode(currentQuestion.theme_view_html.html);
            }

            if (document.readyState === "complete") {
                if (currentQuestion.qtype === "survey") {
                    submitQuestion.style.display = "none"
                    nextQuestion.style.display = "block";
                }

                const renderResult = (isAnswerCorrect) => {
                    const titleFeedback = feedback.querySelector('.title')
                    const contentFeedback = feedback.querySelector('.content')
                    if (isAnswerCorrect) {
                        titleFeedback.className = 'title correct';
                        titleFeedback.innerText = 'Chính xác'
                        contentFeedback.innerText = currentQuestion.feedback.correct.feedback;
                        point += +currentQuestion.feedback.correct.score
                    } else {
                        titleFeedback.className = 'title incorrect';
                        titleFeedback.innerText = 'Không chính xác'
                        contentFeedback.innerText = currentQuestion.feedback.incorrect.feedback;
                        point += +currentQuestion.feedback.incorrect.score
                    }
                }

                if (currentQuestion.type === "multiple_choice") {
                    const listAnswer = document.querySelectorAll('.answers .answer')
                    listAnswer.forEach((answer) => {
                        answer.onclick = () => {
                            Object.assign(submitQuestion.style, {
                                backgroundColor: '#1976d2',
                                cursor: 'pointer'
                            })
                        }
                    })

                    submitQuestion.onclick = () => {
                        const inputs = document.querySelectorAll('.answers .answer input')
                        const inputChecked = [...inputs].find(input => {
                            return input.checked
                        })

                        if (inputChecked.checked) {
                            inputs.forEach((input) => {
                                input.disabled = true
                            })

                            nextQuestion.style.display = 'block';
                            submitQuestion.style.display = 'none';
                            feedback.style.display = 'block';

                            renderResult(+currentQuestion.correct[0] === +inputChecked.dataset.id)
                        }
                    }
                }

                if (currentQuestion.type === "multiple_response") {
                    const listAnswer = document.querySelectorAll('.answers .answer')
                    listAnswer.forEach((answer) => {
                        answer.onclick = () => {
                            Object.assign(submitQuestion.style, {
                                backgroundColor: '#1976d2',
                                cursor: 'pointer'
                            })
                        }
                    })

                    submitQuestion.onclick = () => {
                        const inputs = document.querySelectorAll('.answers .answer input')
                        const inputChecked = [...inputs].filter(input => {
                            return input.checked
                        })

                        if (inputChecked?.[0]) {
                            inputs.forEach((input) => {
                                input.disabled = true
                            })
                            nextQuestion.style.display = 'block';
                            submitQuestion.style.display = 'none';
                            feedback.style.display = 'block';

                            const listCorrect = currentQuestion.correct?.map(correct => {
                                return correct.toString();
                            });
                            listCorrect.sort();
                            inputChecked.sort((a, b) => {
                                const answerA = a.dataset.id;
                                const answerB = b.dataset.id;
                                if (answerA < answerB) {
                                    return -1;
                                }
                                if (answerA > answerB) {
                                    return 1;
                                }
                            });
                            const sameArray = listCorrect.length === inputChecked.length && listCorrect.every((value, index) => value === inputChecked[index]?.dataset.id)

                            renderResult(sameArray)
                        }
                    }
                }

                if (currentQuestion.type === "true_or_false") {
                    const listAnswer = document.querySelectorAll('.answers .answer')
                    listAnswer.forEach((answer) => {
                        answer.onclick = () => {
                            Object.assign(submitQuestion.style, {
                                backgroundColor: '#1976d2',
                                cursor: 'pointer'
                            })
                        }
                    })

                    submitQuestion.onclick = () => {
                        const inputs = document.querySelectorAll('.answers .answer input')
                        const inputChecked = [...inputs].find(input => {
                            return input.checked
                        })

                        if (inputChecked.checked) {
                            inputs.forEach((input) => {
                                input.disabled = true
                            });

                            nextQuestion.style.display = 'block';
                            submitQuestion.style.display = 'none';
                            feedback.style.display = 'block';

                            renderResult(+currentQuestion.correct[0] === +inputChecked.dataset.id)
                        }
                    }
                }

                if (currentQuestion.type === "short_answer") {
                    const answer = document.querySelector('.answers .input-short-answer')
                    answer.oninput = () => {
                        Object.assign(submitQuestion.style, {
                            backgroundColor: '#1976d2',
                            cursor: 'pointer'
                        })
                    }

                    submitQuestion.onclick = () => {
                        if (answer.value) {
                            answer.disabled = true;
                            nextQuestion.style.display = 'block';
                            submitQuestion.style.display = 'none';
                            feedback.style.display = 'block';

                            const isCorrectAnswer = currentQuestion.answers?.some(answerItem => {
                                return answerItem.content.toLowerCase() === answer.value.toLowerCase()
                            })

                            renderResult(isCorrectAnswer)
                        }
                    }
                }

                if (currentQuestion.type === 'matching') {
                    const answers = document.querySelector('.question-matching')

                    let dragStart = null;
                    const onDragAnswer = (answer) => {
                        answer.addEventListener("dragstart", (e) => {
                            dragStart = answer;
                        });
                    };

                    let listAnswerMarchingTitle = document.querySelectorAll(
                        ".answer-title .answer-item"
                    );
                    const listAnswerMarchingTitleMatching = document.querySelectorAll(
                        ".answer-title-matching .answer-item"
                    );

                    const newListAnswerMarchingTitle = Array.prototype.slice.call(
                        listAnswerMarchingTitle
                    );

                    const checkAnswerCorrect = () => {
                        let totalAnswerTrue = 0;
                        listAnswerMarchingTitle.forEach((answer, idx) => {
                            if (answer.dataset.dragitemid === listAnswerMarchingTitleMatching[idx].dataset.dropitemid) {
                                totalAnswerTrue += 1;
                            }
                        });

                        if (totalAnswerTrue === listAnswerMarchingTitle.length) {
                            return true
                        } else {
                            return false
                        }
                    }


                    const onDropAnswer = (answer) => {
                        answer.addEventListener("drop", (e) => {
                            const listAnswerMarchingTitleCloneDrop = Array.prototype.slice.call(
                                listAnswerMarchingTitle
                            );
                            const listAnswerMarchingTitleCloneDrag = Array.prototype.slice.call(
                                listAnswerMarchingTitle
                            );
                            const newListAnswerMarchingTitle = Array.prototype.slice.call(
                                listAnswerMarchingTitle
                            );

                            const indexNodeDrop = getIndexNode(listAnswerMarchingTitleMatching, answer);
                            const indexNodeDrag = getIndexNode(listAnswerMarchingTitleCloneDrop, dragStart);
                            if (dragStart !== listAnswerMarchingTitleCloneDrop[indexNodeDrop]) {
                                swapDom(dragStart, listAnswerMarchingTitleCloneDrop[indexNodeDrop]);
                                const [reorderedItemDrop] = listAnswerMarchingTitleCloneDrop.splice(indexNodeDrop, 1);
                                const [reorderedItemDrag] = listAnswerMarchingTitleCloneDrag.splice(indexNodeDrag, 1);
                                newListAnswerMarchingTitle.splice(indexNodeDrag, 1, reorderedItemDrop);
                                newListAnswerMarchingTitle.splice(indexNodeDrop, 1, reorderedItemDrag);
                                Object.assign(newListAnswerMarchingTitle[indexNodeDrag].style, {
                                    transform: null,
                                });
                                listAnswerMarchingTitle = newListAnswerMarchingTitle;
                            }
                            Object.assign(dragStart.style, {
                                transform: "translateX(39px)",
                            });
                            const isActiveButtonSendQuestionMatching = newListAnswerMarchingTitle.every(
                                (answer) => {
                                    return answer.style.transform;
                                }
                            );
                            if (isActiveButtonSendQuestionMatching) {
                                Object.assign(submitQuestion.style, {
                                    backgroundColor: '#1976d2',
                                    cursor: 'pointer'
                                })
                            } else {
                                Object.assign(submitQuestion.style, {
                                    display: 'block',
                                    backgroundColor: '#c3c3c3',
                                    cursor: 'no-drop',
                                });
                            }
                        });
                        answer.addEventListener("dragover", (e) => {
                            e.preventDefault();
                        });
                    };

                    submitQuestion.onclick = () => {
                        nextQuestion.style.display = 'block';
                        submitQuestion.style.display = 'none';
                        feedback.style.display = 'block';

                        renderResult(checkAnswerCorrect())
                    }
                    listAnswerMarchingTitle.forEach(onDragAnswer);
                    listAnswerMarchingTitleMatching.forEach(onDropAnswer);
                }

                if (currentQuestion.type === "essay") {
                    Object.assign(submitQuestion.style, {
                        backgroundColor: '#1976d2',
                        cursor: 'pointer'
                    })

                    setTimeout(() => {
                        nextQuestion.style.display = 'block';
                        submitQuestion.style.display = 'none';
                        feedback.style.display = 'none';
                    })

                }

                if (currentQuestion.type === "fill_in_blank") {
                    Object.assign(submitQuestion.style, {
                        backgroundColor: '#1976d2',
                        cursor: 'pointer'
                    })

                    submitQuestion.onclick = () => {
                        nextQuestion.style.display = 'block';
                        submitQuestion.style.display = 'none';
                        feedback.style.display = 'block';

                        const listInputFillInBlank = document.querySelectorAll('.answer-fill-in-blank input');
                        const listInputCurrentQuestion = currentQuestion.answers.filter(answer => {
                            return answer.type === 'input'
                        })

                        const isAnswerCorrect = [...listInputFillInBlank].every((input, idx) => {
                            return input.value.toLowerCase() === listInputCurrentQuestion[idx].content.toLowerCase()
                        });

                        renderResult(isAnswerCorrect)
                    }
                }

                if (currentQuestion.type === "select_from_list") {
                    Object.assign(submitQuestion.style, {
                        backgroundColor: '#1976d2',
                        cursor: 'pointer'
                    })

                    submitQuestion.onclick = () => {
                        nextQuestion.style.display = 'block';
                        submitQuestion.style.display = 'none';
                        feedback.style.display = 'block';

                        const listSelectFromList = document.querySelectorAll('.answer-fill-in-blank select');
                        const listSelectCurrentQuestion = currentQuestion.answers.filter(answer => {
                            return answer.type === 'input'
                        })

                        const isAnswerCorrect = [...listSelectFromList].every((input, idx) => {
                            return input.value.toString() === listSelectCurrentQuestion[idx].correct.toString()
                        });
                        renderResult(isAnswerCorrect);
                    }
                }
            }
        }

        const renderResult = () => {
            questions.innerHTML = `
                                                <div class="result">
                                                        <img src="" alt="" />
                                                        <div class="result-feedback">
                                                            Bạn đã không vượt qua
                                                        </div>
                                                        <div class="your-score">Điểm của bạn: <span class="result-your-score-percent">25% (10 điểm)</div>
                                                        <div class="passing-score">Điểm được thông qua: <span class="result-score-passing">40% (10 điểm)</div>
                                                </div>
                                                `;

            if (document.readyState === "complete") {
                const resultYourScorePercent = document.querySelector('.result-your-score-percent')
                const resultScorePassing = document.querySelector('.result-score-passing')
                const resultFeedback = document.querySelector('.result-feedback')
                const imageFeedback = document.querySelector('.result img')

                const quiz = slides?.[index]?.data
                const quizScore = quiz?.options?.score?.passing_requirements?.value;

                const totalPointQuestions = quiz?.questions?.reduce((initPoint, question) => {
                    const questionScore = question.feedback?.correct?.score;
                    if (question.qtype === 'grade') {
                        return initPoint + +questionScore;
                    } else {
                        return initPoint;
                    }
                }, 0);

                let totalScore = quizScore;
                let percentagePointsPassing = 100;
                let passing = false

                if (quizScore > totalPointQuestions) {
                    totalScore = totalPointQuestions;
                } else {
                    if (quiz.options.score.passing_requirements?.type === 'percent') {
                        percentagePointsPassing = (totalPointQuestions / 100) * quizScore;
                    } else {
                        percentagePointsPassing = (quizScore / totalPointQuestions) * 100;
                    }
                }
                let pointPassing = 0;
                let passingScoreNumber = 0;

                if (quiz.options.score.passing_requirements?.type === 'percent') {
                    const passingScore = (totalScore / 100) * quiz.options.score.passing_requirements.value;
                    pointPassing = passingScore;
                    passingScoreNumber = passingScore;
                    percentagePointsPassing = quiz.options.score.passing_requirements.value;
                } else {
                    pointPassing = totalScore;
                    passingScoreNumber = totalScore;
                }

                if (+point >= pointPassing) {
                    passing = true
                }


                let percentagePoints = 0;
                if (quiz.options.score.passing_requirements?.type === 'percent') {
                    percentagePoints = Math.round((100 / totalScore) * point);
                } else {
                    percentagePoints = Math.round((100 / totalPointQuestions) * point);
                }

                if (passing) {
                    resultFeedback.innerText = quiz.options.passing.value
                    imageFeedback.src = 'data:image/png;base64,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'
                } else {
                    resultFeedback.innerText = quiz.options.failed.value
                    imageFeedback.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAB2AAAAdgB+lymcgAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAiOSURBVHic3VtdbBTXFf7OnZmdXbxm7cU/2DteIERtwYAaoA8NIUG0tih9SJDSqFAVkGlpKtSEUqr0IarUJi+U/ND2iVRKcSIBhaQ8JEEKREhR1PQnIBoFN4CT1t41dte1za7XxvbaO6cP3jG2d3Z3dmZ2Tfs9eefee875Pt97Z+659xJKjM/q6+sUWX5YMDcz0ZcAfAFE1WCuAuDPVBsBURzMt0F0g3T9OoTomJic/OD+WKy/lPFRKYxGmpq+Al3fCaAFQLMDPwygA8AFCHEqHI1editGA64J0BkMLla93v0gagOwyi27c0D0D+j6732p1PHagYGkKyadGohqWlAHnibmHwGodiEmK7jNRL+BEL9eFoncdmLItgAMUCQU+i4BLwCodRKEAwwx0S/DPT2/JUC3Y8CWAFFNux/M7Qw8aKd9CfAnCLEnHI1+XmxDUWyDqKbtYOaP7iHyALCJdf1qpLHx28U2tCwAAyISCr3MzH8EUFWso1KDgEoQnYqEQi9yEbwsDYGO5mZPZSJxAsw77YdYRjCf7G9o2LvxypXJQlULCtDR3Ozxx+PnCNjuTnTlAQHvxJYu3VFIhLxdhQGqjMd/979GHgAY+GZdLNZeaDjkLYyGQi8B2O1qZOUE886oph3JVyXnEOgOhb5FwBn3o1oAMO8K9/aeMisyFSDS1LQSun4FQKCkgZUPCZak9csikX/OL8gaAgwQ6fpr+P8hDwAB0vUTbPIPzxKgR9P23WMfOe6AeXMkFMqaz+YoEtW0IDPfAFBTtsDKCAb6dUX54oqurrjxbE4PYOaDsEnes24dal55BTXt7fBu2eIsUhNI9fUIHj2K2lOn4N+7F6DilzEE1Mmp1FPznk2jMxhcrPp8XbCxpJUaG9Fw6RLIn0nwMGPomWcwevJk0UGaQV62DHVvvAGpoWHmWc/hw+DTp+2YG/JNTCw38gkzPUD1evfD5nre+9BDd8kDABGCR46gYtcuO+bmwIw8APi3b8dg0lZOJDimqt83ftwdAkR77AY51dOT/dAFEXKRB4CJ7m6Mjo/bE4Fon/GnADI5PGCN3UAnPvwQd86dM3NkW4R85FN9fYg89xwA2BOBeXVXY+MDgNEDphOYjjB48GBeEfx7rHcwuakJtadPm5OPxXBt2zakbt2aeWZHBCHELsAQgLm1qNZmSKfzilD9/POWRJCbmlB75gzkpqasslQshmutrRi7fj2rrFgRmPnrAECf1dfXeWT533ArQyxJWHLsGBbt2GHmFbeffRYj7e2mTe2Sn40KrxdLKiutRMoyc530k6qqbxDwhJUWlsCMsQsXoCxfDmXVvOw4EXxbt0IfGkLq44/nFLlBHgAmp6YwpetYpKqFqhIL8Vfpx4HAEwRsKWi5GBQpglvkDRQhQod0qLLyB3DwBsgJiyLoQ0OukjdgRQRm7qWIpl0G84aiPVhFgTlBj8chqrO/v5yQn40Cc8JHgphLu/Ap8HYoJXmgwNuBqEYwYGnKdIR8IsyDm+QN5BSBuVLg7hZ1aZERYezdd3NXGR52nbyBHCJUFr0z5ARyQwOU5uac5VJlJapKsJQ2YCaCADBSMo+zIGsaas+ehaxpuSsR4b5jx9Dw5JMli2OeCElBgCv77PkwQ97kVZeFcopAlBRMNFAyT8hPfrK/H0Pnz2c3KpcIicQiAeBmqZwUIn+ttRXXH38c/zHL7JRBhLSuj0mH/P41INritnEr5O98+ul0+uytt+BduRIVa+Z9kBKhets2TA0MYOSy68eD4PF4rkiHAoEauLkYQhHkDSyQCIqinJUO+HyDkhCH4dJyuGjyBhZAhMWStE9kzuF1uGHQNvkMOJ1GZ1tbWeYEWZLGVyWTN40PoYuODTokb6BcInhk+e+AkRITwlECnyoqci9p+/rwydatlsgb4HQanfv2YeDNN02cTYtQ3eosi6cIcQzICJA5gXnNrjFfSwvkcDjreaqvD9daWjDW2Vm0TZ6aws3du3OK0HDggJ1QAQCSJE2sTST+AMzeF2A2T9RZAKdSWc+ckJ+xm0cE3cSnVaiy/I7x94wAvlTqOABbpy7HL15E6urVmd8T3d2OyRswRJg9J6RHRnDr6FFb9oiIVV2f6T5zXn3dmvYLYv65LcuyjMlNmzClKBh6+22k7W1b5UXgkUfgXbEC8ffew4TZbpQFLFLVS+uTya8Zv+cKEA5XUzp9AzaPvjIz+hMJTEwWPJ22IJCIdJ/fH/7y4ODMrsqcfMCySOQ2mH9m1wERoTYQgFdRnMRZMng9nldnkwdMvv4YoGgo9AGATXYd3Ys9QZXl+MY7d5bMP1SdlREigCHEHgAJu87utZ5ARKx6PI+ZnSg3TYmFo9HPGfieE6ciI4J6D4jg93pfWBePv29WlncBFAmFXgRwyIlznRkDiQTGF2g4+FT1LxuSya/mKs8rQGY+eBXAXidBLNSc4FWU7g2joysJSOeqkzcrTAD3L126nwGTvJV1LMScoCpKDIHA6nzkAYs5AAbkqKYdB3Obk6DK1RO8itKFQKB5Y2/vnUJ1LSdBGKCopv0KzIedBFfqOcGnqn9en0xuLvSfN1DMzQoO9/T8FMw7YHPNAEy/HWpKMBwEEfu93pc2JJMPWiUP2EyDdYfD95GunwDzZjvtAXeHg0dREl5FeTTXqy4fHF+bA3CUgDo7NpwOB5lI96nq6+uGh9vKem1uNv61fHmVnEo9xURPAwgW296OCEII9sry+/B6v7N+YKC3WJ+z4drV2f7aWv+4x7MfzG0gyr0DagKrIiiSNKF6POelqakfrh0djTkKOIOSXJ7uamx8QAixC8wtANbCwmSbSwRFksYUWf7EQ/TymuFhW4eD86EkAsxGb2NjTVqIh5l5NZhXYfr6fBDTdw/vXp8H4rquxweTyQoSokci+hvJ8mvrBgfdPywwC/8FkscTl44fC6UAAAAASUVORK5CYII='
                }
                resultYourScorePercent.innerText = `${percentagePoints}% (${point} điểm)`
                resultScorePassing.innerText = `${percentagePointsPassing}% (${passingScoreNumber} điểm)`
            }
        }

        const renderStartQuiz = () => {
            const quiz = slides?.[index]?.data;
            questions.innerHTML = `
                                                <div class="start-quiz">
                                                        <div class="title-start-quiz">
                                                            <div class="total-question-title">Tổng số câu hỏi có trong bài: ${quiz.questions?.length || 0}</div>
                                                            ${quiz.options ? `
                                                            <div class="quiz-score">Yêu cầu đạt</div>
                                                            <div class="quiz-passing">${quiz.options.score.passing_requirements.value}${quiz.options.score.passing_requirements.type === 'percent' ? '%' : ' điểm'}</div>
                                                            ` : ''}

                                                        </div>
                                                        <div class="list-question">
                                                            ${quiz.questions?.length ? '<div class="start-question">Bắt đầu</div>' : ''}
                                                            <div class="cancel-question">Bỏ qua bài tập</div>
                                                        </div>
                                                        `;

            if (document.readyState === "complete") {
                const cancelQuestion = document.querySelector('.cancel-question');
                const nextQuestion = document.querySelector('.start-question');
                questionImage.style.display = 'none';
                submitQuestion.style.display = 'none';

                cancelQuestion.onclick = () => {
                    if (index + 1 === slides?.length) {
                        resetPlay();
                        questionWrapper.style.display = 'none';
                        playerControl.style.visibility = 'visible'
                    } else {
                        if (index + 1 === maxSlide) {
                            goToSlide(index + 1)
                            playCurrentScene();
                            questionWrapper.style.display = 'none';
                            playerControl.style.visibility = 'visible'
                        } else {
                            goToSlide(index + 1)
                            pauseCurrentScene();
                            questionWrapper.style.display = 'block';
                            playerControl.style.visibility = 'hidden'
                        }
                    }
                };

                if (nextQuestion) {
                    nextQuestion.onclick = () => {
                        questionImage.style.display = 'block';
                        submitQuestion.style.display = 'block';
                        renderQuestion();
                    }
                }
            }
        }

        // if(isStart){
        renderStartQuiz()
        // }else{
        //     renderQuestion()
        // }
        document.onreadystatechange = () => {
            if (document.readyState === "complete") {
                renderStartQuiz()
            }
        };

        nextQuestion.onclick = () => {
            questionIndex = questionIndex + 1;
            if (questionIndex > slides?.[index]?.data?.questions?.length) {
                questionWrapper.style.display = 'none'
                playerControl.style.visibility = 'visible'
                nextQuestion.style.display = 'none',
                    feedback.style.display = 'none';
                Object.assign(submitQuestion.style, {
                    display: 'block',
                    backgroundColor: '#c3c3c3',
                    cursor: 'no-drop',
                });

                if (currentSlide + 1 === slides?.length) {
                    resetPlay()
                } else {
                    goToSlide(currentSlide + 1)
                    playCurrentScene();
                }

                return
            }
            if (questionIndex === slides?.[index]?.data?.questions?.length) {
                feedback.style.display = 'none';
                questionImage.style.display = 'none';
                renderResult();
            } else {
                renderQuestion()
                nextQuestion.style.display = 'none',
                    feedback.style.display = 'none';
                const currentQuestion = slides?.[index]?.data?.questions?.[questionIndex];
                if (currentQuestion.type !== 'fill_in_blank' && currentQuestion.type !== 'select_from_list') {
                    Object.assign(submitQuestion.style, {
                        display: 'block',
                        backgroundColor: '#c3c3c3',
                        cursor: 'no-drop',
                    })
                } else {
                    Object.assign(submitQuestion.style, {
                        display: 'block',
                        backgroundColor: '#1976d2',
                        cursor: 'pointer'
                    })
                }
            }

        }
    } else {
        var playerObject = jQuery("#svgObject");
        playerObject.show(600);
        // Click chuyển trang
        if (true) {
            var svgObject = document.getElementById("svgObject");
            if (referObjectUrl) {
                svgObject.setAttribute('data', referObjectUrl);
                //playerObject.attr('data', referObjectUrl);
                // playerObject.load(referObjectUrl);
                // playerObject.css({"pointer-events": "none"});
                var timeInterval = setInterval(function () {
                    if (playerObject.hasClass('loaded')) {
                        if (init) {
                            showPlay();
                        }
                        clearInterval(timeInterval);
                    }
                }, 100);
            } else {
                svgObject.setAttribute('data', "https://thv2-api.dlow.vn/files/presents/6491a414827cdf58cc0fec44/64927e9b5e065.svg");
                var timeInterval = setInterval(function () {
                    if (playerObject.hasClass('loaded')) {
                        if (init) {
                            showPlay();
                        }
                        //svgObject.contentWindow.dispatchEffects(1);
                        //svgObject.contentWindow.switchSlide(currentSlide);
                        svgObject.contentWindow.aSlideShow.displaySlide(index); // Nhảy đến luôn slide đó
                        //
                        clearInterval(timeInterval);
                    }
                }, 100);
            }
            //
        }
    }
}

function setAudio(srcUrl, offset = 0, play = true) {
    setTimeout(function () {
        var audio = document.getElementById('myAudio');
        var source = document.getElementById('audioSource');
        if (source && source.getAttribute('src')) {
            audio.pause();
        }
        source.setAttribute('src', srcUrl);
        if (srcUrl) {
            audio.load();
            if (!play) {
                audio.pause();
            }
        }
    }, offset);
}

function playAudio() {
    var x = document.getElementById("myAudio");
    //x.load();
    x.autoplay = true;
    var source = document.getElementById('audioSource');
    if (source && source.getAttribute('src')) {
        x.play();
    }
}

function pauseAudio() {
    var x = document.getElementById("myAudio");
    //x.load();
    var source = document.getElementById('audioSource');
    if (source && source.getAttribute('src')) {
        x.pause();
    }
}

function resetAudio() {
    var audio = document.getElementById("myAudio");
    audio.currentTime = 0;
    var source = document.getElementById('audioSource');
    if (source && source.getAttribute('src')) {
        audio.pause();
        source.setAttribute('src', '');
        audio.load();
    }
}

function setBackgroundAudio(srcUrl, volume = 1) {
    var audio = document.getElementById('backgroundAudio');
    var source = document.getElementById('backgroundAudioSource');
    source.setAttribute('src', srcUrl);
    //
    audio.volume = volume;
    //
    audio.load();
}

function playBackgroundAudio() {
    var audio = document.getElementById('backgroundAudio');
    var source = document.getElementById('backgroundAudioSource');
    //audio.load();
    audio.autoplay = true;
    if (source && source.getAttribute('src')) {
        audio.play();
    }
}

function pauseBackgroundAudio() {
    var audio = document.getElementById('backgroundAudio');
    var source = document.getElementById('backgroundAudioSource');
    //audio.load();
    if (source && source.getAttribute('src')) {
        audio.pause();
    }
}

function showPlay() {
    var action = jQuery("#playSlide").attr('action');

    if (!isRecoding) {
        jQuery("#playerControls").show();
    }
    jQuery('#playSlide').show();
    jQuery('#loading').hide();
    jQuery('#playSlide img').css({ "animation": "shake 2s", "animation-iteration-count": "infinite" });
    if (jQuery(window).height() > 100) {
        jQuery("#svgObject").height(jQuery(window).height() - 25);
    }
    jQuery("#slideTimeLine").css({
        "top": (jQuery("#progress").position().top) + "px",
        "left": jQuery("#progress").position().left + "px"
    });
    jQuery("#slideTimeLine").width(jQuery("#progress").width());
}

//
jQuery(function () {
    var action = jQuery("#playSlide").attr('action');

    // jQuery('.objectBox').height(jQuery(window).height() - 30);
    jQuery('.objectBox .playerObject').on('load', function () {
        jQuery(this).addClass('loaded');
    });
    jQuery('#videoObject').on('loadeddata', function () {
        jQuery(this).addClass('loaded');
    });

    jQuery('#playSlide').on('click', function () {
        var action = jQuery(this).attr('action');
        if (action == 'pause') {
            playCurrentScene();
        } else {
            pauseCurrentScene();
            clearInterval(timeInter);
        }
    });
});


///////////////////////////////////////


jQuery(function () {
    jQuery("body").on('mouseover', function () {
        var action = jQuery("#playSlide").attr('action');

        if (!isRecoding) {
            jQuery('#playerControls').show();
        }
    });
    jQuery("body").on('mouseout', function () {
        jQuery('#playerControls').hide();
    });
    initPlay();
    jQuery('#play').on('click', function () {
        var action = jQuery(this).attr('action');
        if (action == 'pause') {
            playCurrentScene();
        } else {
            pauseCurrentScene();
        }
    });
    jQuery("#progress").on("click", function (e) {
        var $this = jQuery(this);

        // to get part of width of progress bar clicked
        var widthclicked = e.pageX - $this.offset().left;
        var totalWidth = $this.width(); // can also be cached somewhere in the app if it doesn't change
        if (widthclicked > totalWidth) {
            return false;
        }
        // do calculation of the seconds clicked
        var calc = (widthclicked / totalWidth * totalTime); // get the percent of bar clicked and multiply in by the duration
        var slideInd = detectSlideFromTime(calc);
        goToSlide(slideInd.index, slideInd.time * 1000);
    });
    jQuery("#progress").on('mousemove', function (e) {
        var $this = jQuery(this);
        // to get part of width of progress bar clicked
        var widthclicked = e.pageX - $this.offset().left;
        var totalWidth = $this.width(); // can also be cached somewhere in the app if it doesn't change

        // do calculation of the seconds clicked
        var calc = (widthclicked / totalWidth * totalTime); // get the percent of bar clicked and multiply in by the duration
        var slideInd = detectSlideFromTime(calc);
        jQuery('#slideTimeLine ul li .slideTimeLinePreview').hide();
        jQuery('#slideTimeLineItem' + slideInd.index + ' .slideTimeLinePreview').show();
    });
    jQuery("#progress").on('mouseout', function () {
        jQuery('#slideTimeLine ul li .slideTimeLinePreview').hide();
    });
    const recoding = jQuery('.recoding')
    recoding.on('click', function () {
        playCurrentScene();
    })
    if (!isRecoding) {
        recoding.css({ display: 'none' })
    }
});


function goToSlide(index = 0, fromTime = 0) {
    if (index >= maxSlide) {
        jQuery("#playSlide").attr('action', 'pause');
        resetPlay();
        return false;
    }
    currentTimeLine = fromTime;
    currentSlide = index;
    //
    if (!currentTimeLine) {
        var offsetTime = getTimeOffsetOfSlide(currentSlide);
        if (offsetTime) {
            currentTimeLine = offsetTime.time * 1000;
        }
    }

    resetAudio();
    var action = jQuery("#playSlide").attr('action');
    var initPlay = true;
    if (action == 'play') {
        initPlay = false;
    }
    setSlide(index, initPlay);
    var currentTimeLineTemp = roundNumber(currentTimeLine / 1000, 0);
    if (currentTimeLineTemp > totalTime) {
        currentTimeLineTemp = totalTime;
    }
    jQuery('#timeLine .time').text(currentTimeLineTemp);
    jQuery('#progress').attr('value', currentTimeLineTemp / totalTime * 100);
}

//
function getTimeOffsetOfSlide(slideIndex = 0) {
    slideIndex = parseInt(slideIndex);
    if (slideIndex > slides.length) {
        slideIndex = slides.length;
    }
    var offsetTimeLine = 0;
    for (i = 0; i < slideIndex; i++) {
        offsetTimeLine = offsetTimeLine + slides[i]['duration'];
    }
    return { "time": offsetTimeLine + 0.01 };
}

//
function detectSlideFromTime(time = 0) {
    var slideIndex = 0;
    var curTimeLine = 0;
    for (i = 0; i < slides.length; i++) {
        if (time > curTimeLine && time <= (curTimeLine + slides[i]['duration'])) {
            slideIndex = i;
            break;
        }
        curTimeLine = curTimeLine + slides[i]['duration'];
    }
    return { "index": slideIndex, "time": curTimeLine };
}

function convert_time(seconds) {
    var s = seconds,
        h = Math.floor(s / 3600);
    s -= h * 3600;
    var m = Math.floor(s / 60);
    s -= m * 60;

    if (seconds >= "3600") {
        return "0" + h + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    } else {
        return (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
    }
}

/**
 *
 */
let stopRecording;
async function playCurrentScene() {
    if (isRecoding) {
        stopRecording = await recordScreen();
        if (stopRecording) {
            jQuery('.recoding').css({ display: 'none' })
        }
    }
    if ((isRecoding && stopRecording) || !isRecoding) {
        jQuery("#playSlide").text("❙❙");
        jQuery("#playSlide").attr('action', 'play');
        play();
        playAudio();
        playBackgroundAudio();
        currentSlideData = getCurrentSlide();
        var referObjectType = currentSlideData['refer_object_type'] ? currentSlideData['refer_object_type'] : "";
        if (referObjectType === 'video') {
            jQuery("#videoObject").trigger("play");
        }
    }
}

function pauseCurrentScene() {
    if (stopRecording) {
        stopRecording()
        jQuery('.recoding').css({ display: 'block' })
    }
    jQuery("#playSlide").attr('action', 'pause');
    jQuery("#playSlide").text("►");
    pauseAudio();
    pauseBackgroundAudio();
    clearInterval(timeInter);
    currentSlideData = getCurrentSlide();
    var referObjectType = currentSlideData['refer_object_type'] ? currentSlideData['refer_object_type'] : "";
    if (referObjectType === 'video') {
        jQuery("#videoObject").trigger("pause");
    }
}

async function recordScreen() {
    try {
        const displayStream = await navigator.mediaDevices?.getDisplayMedia?.({
            video: { displaySurface: 'browser' },
            audio: true,
            selfBrowserSurface: 'include',
            surfaceSwitching: 'exclude',
            preferCurrentTab: true
        });

        const audioTracks = displayStream.getAudioTracks();

        let dest = null;
        if (audioTracks.length > 0) {
            const audioContext = new AudioContext();
            const audioSource = audioContext.createMediaStreamSource(new MediaStream(audioTracks));
            dest = audioContext.createMediaStreamDestination();
            audioSource.connect(dest);
        }
        const [videoTrack] = displayStream.getVideoTracks();

        let combinedStream = null;
        if (audioTracks.length > 0) {
            combinedStream = new MediaStream([videoTrack, dest.stream.getTracks()[0]]);
        } else {
            combinedStream = new MediaStream([videoTrack]);
        }

        const mime = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
            ? "video/webm; codecs=vp9"
            : "video/webm"

        const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: mime });
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

        videoTrack.addEventListener('ended', () => {
            pauseCurrentScene()
        });

        const currentTimeSatmp = new Date().getTime();
        const pathName = `VV_${currentTimeSatmp}.mp4`;

        mediaRecorder.onstop = () => {
            var tracks = displayStream.getTracks();
            tracks.forEach((track) => track.stop());

            const blob = new Blob(chunks, { type: chunks[0].type });
            const url = URL.createObjectURL(blob);

            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                // for IE
                window.navigator.msSaveOrOpenBlob(url, pathName);
            } else {
                // for Chrome
                const link = document.createElement('a');
                link.href = url;
                link.download = pathName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            trunks = [];
            URL.revokeObjectURL(blob)
        };

        mediaRecorder.start(200);
        return () => mediaRecorder.stop();

    } catch (error) {
        console.log(error);
    }

}