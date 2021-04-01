/* global describe:false, it:false, beforeEach:false, expect:false, elementResizeDetectorMaker:false, _:false, $:false, jasmine:false */

"use strict";

function ensureMapEqual(before, after, ignore) {
    const beforeKeys = _.keys(before);
    const afterKeys = _.keys(after);

    const unionKeys = _.union(beforeKeys, afterKeys);

    const diffValueKeys = _.filter(unionKeys, function (key) {
        const beforeValue = before[key];
        const afterValue = after[key];
        return !ignore(key, beforeValue, afterValue) && beforeValue !== afterValue;
    });

    if (diffValueKeys.length) {
        const beforeDiffObject = {};
        const afterDiffObject = {};

        _.forEach(diffValueKeys, function (key) {
            beforeDiffObject[key] = before[key];
            afterDiffObject[key] = after[key];
        });

        expect(afterDiffObject).toEqual(beforeDiffObject);
    }
}

function getStyle(element) {
    function clone(styleObject) {
        const clonedTarget = {};
        _.forEach(styleObject.cssText.split(";").slice(0, -1), function (declaration) {
            const colonPos = declaration.indexOf(":");
            const attr = declaration.slice(0, colonPos).trim();
            if (attr.indexOf("-") === -1) { // Remove attributes like "background-image", leaving "backgroundImage"
                clonedTarget[attr] = declaration.slice(colonPos + 2);
            }
        });
        return clonedTarget;
    }

    const style = getComputedStyle(element);
    return clone(style);
}

function getAttributes(element) {
    const attrs = {};
    _.forEach(element.attributes, function (attr) {
        attrs[attr.nodeName] = attr.value;
    });
    return attrs;
}

const ensureAttributes = ensureMapEqual;

const reporter = {
    log() {
        throw new Error("Reporter.log should not be called");
    },
    warn() {
        throw new Error("Reporter.warn should not be called");
    },
    error() {
        throw new Error("Reporter.error should not be called");
    }
};

$("body").prepend("<div id=fixtures></div>");

function listenToTest(strategy) {
    describe("[" + strategy + "] listenTo", function () {
        it("should be able to attach a listener to an element", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener = jasmine.createSpy("listener");

            erd.listenTo($("#test")[0], listener);

            setTimeout(function () {
                $("#test").width(300);
            }, 200);

            setTimeout(function () {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 400);
        });

        it("should throw on invalid parameters", function () {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            expect(erd.listenTo).toThrow();

            expect(_.partial(erd.listenTo, $("#test")[0])).toThrow();
        });

        describe("option.onReady", function () {
            it("should be called when installing a listener to an element", function (done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy
                });

                const listener = jasmine.createSpy("listener");

                erd.listenTo({
                    onReady() {
                        $("#test").width(200);
                        setTimeout(function () {
                            expect(listener).toHaveBeenCalledWith($("#test")[0]);
                            done();
                        }, 200);
                    }
                }, $("#test")[0], listener);
            });

            it("should be called when all elements are ready", function (done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy
                });

                const listener = jasmine.createSpy("listener");

                erd.listenTo({
                    onReady() {
                        $("#test").width(200);
                        $("#test2").width(300);
                        setTimeout(function () {
                            expect(listener).toHaveBeenCalledWith($("#test")[0]);
                            expect(listener).toHaveBeenCalledWith($("#test2")[0]);
                            done();
                        }, 200);
                    }
                }, $("#test, #test2"), listener);
            });

            it("should be able to handle listeners for the same element but different calls", function (done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy
                });

                const onReady1 = jasmine.createSpy("listener");
                const onReady2 = jasmine.createSpy("listener");

                erd.listenTo({
                    onReady: onReady1
                }, $("#test"), function noop() {
                });
                erd.listenTo({
                    onReady: onReady2
                }, $("#test"), function noop() {
                });

                setTimeout(function () {
                    expect(onReady1.calls.count()).toBe(1);
                    expect(onReady2.calls.count()).toBe(1);
                    done();
                }, 300);
            });

            it("should be able to handle when elements occur multiple times in the same call (and other calls)", function (done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy
                });

                const onReady1 = jasmine.createSpy("listener");
                const onReady2 = jasmine.createSpy("listener");

                erd.listenTo({
                    onReady: onReady1
                }, [$("#test")[0], $("#test")[0]], function noop() {
                });
                erd.listenTo({
                    onReady: onReady2
                }, $("#test"), function noop() {
                });

                setTimeout(function () {
                    expect(onReady1.calls.count()).toBe(1);
                    expect(onReady2.calls.count()).toBe(1);
                    done();
                }, 300);
            });
        });

        it("should be able to attach multiple listeners to an element", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener1 = jasmine.createSpy("listener1");
            const listener2 = jasmine.createSpy("listener2");

            erd.listenTo($("#test")[0], listener1);
            erd.listenTo($("#test")[0], listener2);

            setTimeout(function () {
                $("#test").width(300);
            }, 200);

            setTimeout(function () {
                expect(listener1).toHaveBeenCalledWith($("#test")[0]);
                expect(listener2).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 400);
        });

        it("should be able to attach a listener to an element multiple times within the same call", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener1 = jasmine.createSpy("listener1");

            erd.listenTo([$("#test")[0], $("#test")[0]], listener1);

            setTimeout(function () {
                $("#test").width(300);
            }, 200);

            setTimeout(function () {
                expect(listener1).toHaveBeenCalledWith($("#test")[0]);
                expect(listener1.calls.count()).toBe(2);
                done();
            }, 400);
        });

        it("should be able to attach listeners to multiple elements", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener1 = jasmine.createSpy("listener1");

            erd.listenTo($("#test, #test2"), listener1);

            setTimeout(function () {
                $("#test").width(200);
            }, 200);

            setTimeout(function () {
                expect(listener1).toHaveBeenCalledWith($("#test")[0]);
            }, 400);

            setTimeout(function () {
                $("#test2").width(500);
            }, 600);

            setTimeout(function () {
                expect(listener1).toHaveBeenCalledWith($("#test2")[0]);
                done();
            }, 800);
        });

        //Only run this test if the browser actually is able to get the computed style of an element.
        //Only IE8 is lacking the getComputedStyle method.
        if (window.getComputedStyle) {
            it("should keep the style of the element intact", function (done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy
                });

                function ignoreStyleChange(key, before, after) {
                    return (key === "position" && before === "static" && after === "relative") ||
                        (/^(top|right|bottom|left)$/.test(key) && before === "auto" && after === "0px");
                }

                const beforeComputedStyle = getStyle($("#test")[0]);
                erd.listenTo($("#test")[0], _.noop);
                const afterComputedStyle = getStyle($("#test")[0]);
                ensureMapEqual(beforeComputedStyle, afterComputedStyle, ignoreStyleChange);

                //Test styles async since making an element listenable is async.
                setTimeout(function () {
                    const afterComputedStyleAsync = getStyle($("#test")[0]);
                    ensureMapEqual(beforeComputedStyle, afterComputedStyleAsync, ignoreStyleChange);
                    expect(true).toEqual(true); // Needed so that jasmine does not warn about no expects in the test (the actual expects are in the ensureMapEqual).
                    done();
                }, 200);
            });
        }

        describe("options.callOnAdd", function () {
            it("should be true default and call all functions when listenTo succeeds", function (done) {
                const erd = elementResizeDetectorMaker({
                    reporter,
                    strategy
                });

                const listener = jasmine.createSpy("listener");
                const listener2 = jasmine.createSpy("listener2");

                erd.listenTo($("#test")[0], listener);
                erd.listenTo($("#test")[0], listener2);

                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith($("#test")[0]);
                    expect(listener2).toHaveBeenCalledWith($("#test")[0]);
                    listener.calls.reset();
                    listener2.calls.reset();
                    $("#test").width(300);
                }, 200);

                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith($("#test")[0]);
                    expect(listener2).toHaveBeenCalledWith($("#test")[0]);
                    done();
                }, 400);
            });

            it("should call listener multiple times when listening to multiple elements", function (done) {
                const erd = elementResizeDetectorMaker({
                    reporter,
                    strategy
                });

                const listener1 = jasmine.createSpy("listener1");
                erd.listenTo($("#test, #test2"), listener1);

                setTimeout(function () {
                    expect(listener1).toHaveBeenCalledWith($("#test")[0]);
                    expect(listener1).toHaveBeenCalledWith($("#test2")[0]);
                    done();
                }, 200);
            });
        });

        it("should call listener if the element is changed synchronously after listenTo", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener1 = jasmine.createSpy("listener1");
            erd.listenTo($("#test"), listener1);
            $("#test").width(200);

            setTimeout(function () {
                expect(listener1).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 200);
        });

        it("should not emit resize when listenTo is called", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener1 = jasmine.createSpy("listener1");
            erd.listenTo($("#test"), listener1);

            setTimeout(function () {
                expect(listener1).not.toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 200);
        });

        it("should not emit resize event even though the element is back to its start size", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener = jasmine.createSpy("listener1");
            $("#test").width(200);
            erd.listenTo($("#test"), listener);

            setTimeout(function () {
                expect(listener).not.toHaveBeenCalledWith($("#test")[0]);
                listener.calls.reset();
                $("#test").width(100);
            }, 200);

            setTimeout(function () {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                listener.calls.reset();
                $("#test").width(200);
            }, 400);

            setTimeout(function () {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 600);
        });

        it("should use the option.idHandler if present", function (done) {
            const ID_ATTR = "some-fancy-id-attr";

            const idHandler = {
                get(element, readonly) {
                    if (element[ID_ATTR] === undefined) {
                        if (readonly) {
                            return null;
                        }

                        this.set(element);
                    }

                    return $(element).attr(ID_ATTR);
                },
                set(element) {
                    let id;

                    if ($(element).attr("id") === "test") {
                        id = "test+1";
                    } else if ($(element).attr("id") === "test2") {
                        id = "test2+2";
                    }

                    $(element).attr(ID_ATTR, id);

                    return id;
                }
            };

            const erd = elementResizeDetectorMaker({
                idHandler,
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener1 = jasmine.createSpy("listener1");
            const listener2 = jasmine.createSpy("listener1");

            const attrsBeforeTest = getAttributes($("#test")[0]);
            const attrsBeforeTest2 = getAttributes($("#test2")[0]);

            erd.listenTo($("#test"), listener1);
            erd.listenTo($("#test, #test2"), listener2);

            const attrsAfterTest = getAttributes($("#test")[0]);
            const attrsAfterTest2 = getAttributes($("#test2")[0]);

            const ignoreValidIdAttrAndStyle = function (key) {
                return key === ID_ATTR || key === "style";
            };

            ensureAttributes(attrsBeforeTest, attrsAfterTest, ignoreValidIdAttrAndStyle);
            ensureAttributes(attrsBeforeTest2, attrsAfterTest2, ignoreValidIdAttrAndStyle);

            expect($("#test").attr(ID_ATTR)).toEqual("test+1");
            expect($("#test2").attr(ID_ATTR)).toEqual("test2+2");

            setTimeout(function () {
                $("#test").width(300);
                $("#test2").width(500);
            }, 200);

            setTimeout(function () {
                expect(listener1).toHaveBeenCalledWith($("#test")[0]);
                expect(listener2).toHaveBeenCalledWith($("#test")[0]);
                expect(listener2).toHaveBeenCalledWith($("#test2")[0]);
                done();
            }, 600);
        });

        it("should be able to install into elements that are detached from the DOM", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener1 = jasmine.createSpy("listener1");
            const div = document.createElement("div");
            div.style.width = "100%";
            div.style.height = "100%";
            erd.listenTo(div, listener1);

            setTimeout(function () {
                $("#test")[0].appendChild(div);
            }, 200);

            setTimeout(function () {
                $("#test").width(200);
            }, 400);

            setTimeout(function () {
                expect(listener1).toHaveBeenCalledWith(div);
                done();
            }, 600);
        });

        it("should handle iframes, by using initDocument", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy,
                reporter
            });

            const listener1 = jasmine.createSpy("listener1");
            const iframe = document.createElement("iframe");
            $("#test")[0].appendChild(iframe);
            erd.initDocument(iframe.contentDocument);
            const div = iframe.contentDocument.createElement("div");

            div.style.width = "100%";
            div.style.height = "100%";
            div.id = "target";
            erd.listenTo(div, listener1);

            setTimeout(function () {
                // FireFox triggers the onload state of the iframe and wipes its content.
                iframe.contentDocument.body.appendChild(div);
                erd.initDocument(iframe.contentDocument);
            }, 10);

            setTimeout(function () {
                div.style.width = "100px";
            }, 200);

            setTimeout(function () {
                expect(listener1).toHaveBeenCalledWith(div);
                done();
            }, 400);
        });

        it("should detect resizes caused by padding and font-size changes", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener = jasmine.createSpy("listener");
            $("#test").html("test");
            $("#test").css("padding", "0px");
            $("#test").css("font-size", "16px");

            erd.listenTo($("#test"), listener);

            $("#test").css("padding", "10px");

            setTimeout(function () {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                listener.calls.reset();
                $("#test").css("font-size", "20px");
            }, 200);

            setTimeout(function () {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 400);
        });

        describe("should handle unrendered elements correctly", function () {
            it("when installing", function (done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy
                });

                $("#test").html("<div id=\"inner\"></div>");
                $("#test").css("display", "none");

                const listener = jasmine.createSpy("listener");
                erd.listenTo($("#inner"), listener);

                setTimeout(function () {
                    expect(listener).not.toHaveBeenCalled();
                    $("#test").css("display", "");
                }, 200);

                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith($("#inner")[0]);
                    listener.calls.reset();
                    $("#inner").width("300px");
                }, 400);

                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith($("#inner")[0]);
                    listener.calls.reset();
                    done();
                }, 600);
            });

            it("when element gets unrendered after installation", function (done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy
                });

                // The div is rendered to begin with.
                $("#test").html("<div id=\"inner\"></div>");

                const listener = jasmine.createSpy("listener");
                erd.listenTo($("#inner"), listener);

                // The it gets unrendered, and it changes width.
                setTimeout(function () {
                    expect(listener).not.toHaveBeenCalled();
                    $("#test").css("display", "none");
                    $("#inner").width("300px");
                }, 100);

                // Render the element again.
                setTimeout(function () {
                    expect(listener).not.toHaveBeenCalled();
                    $("#test").css("display", "");
                }, 200);

                // ERD should detect that the element has changed size as soon as it gets rendered again.
                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith($("#inner")[0]);
                    done();
                }, 300);
            });
        });

        describe("inline elements", function () {
            it("should be listenable", function (done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy
                });

                $("#test").html("<span id=\"inner\">test</span>");

                const listener = jasmine.createSpy("listener");
                erd.listenTo($("#inner"), listener);

                setTimeout(function () {
                    expect(listener).not.toHaveBeenCalled();
                    $("#inner").append("testing testing");
                }, 100);

                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith($("#inner")[0]);
                    done();
                }, 200);
            });

            it("should not get altered dimensions", function (done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy
                });

                $("#test").html("<span id=\"inner\"></span>");

                const widthBefore = $("#inner").width();
                const heightBefore = $("#inner").height();

                const listener = jasmine.createSpy("listener");
                erd.listenTo($("#inner"), listener);

                setTimeout(function () {
                    expect($("#inner").width()).toEqual(widthBefore);
                    expect($("#inner").height()).toEqual(heightBefore);
                    done();
                }, 100);
            });
        });

        it("should handle dir=rtl correctly", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                reporter,
                strategy
            });

            const listener = jasmine.createSpy("listener");

            $("#test")[0].dir = "rtl";
            erd.listenTo($("#test")[0], listener);

            setTimeout(function () {
                $("#test").width(300);
            }, 200);

            setTimeout(function () {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 400);
        });

        it("should handle fast consecutive resizes", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy,
                reporter
            });

            const listener = jasmine.createSpy("listener");

            $("#test").width(100);
            erd.listenTo($("#test")[0], listener);

            setTimeout(function () {
                $("#test").width(300);
            }, 50);

            setTimeout(function () {
                expect(listener.calls.count()).toEqual(1);
                $("#test").width(500);
                setTimeout(function () {
                    $("#test").width(300);
                }, 0);
            }, 100);

            // Some browsers skip the 300 -> 500 -> 300 resize, and some actually processes it.
            // So the resize events may be 1 or 3 at this point.

            setTimeout(function () {
                const count = listener.calls.count();
                expect(count === 1 || count === 3).toEqual(true);
            }, 150);


            setTimeout(function () {
                const count = listener.calls.count();
                expect(count === 1 || count === 3).toEqual(true);
                $("#test").width(800);
            }, 200);

            setTimeout(function () {
                const count = listener.calls.count();
                expect(count === 2 || count === 4).toEqual(true);
                done();
            }, 250);
        });

    });
}

function removalTest(strategy) {
    describe("[" + strategy + "] resizeDetector.removeListener", function () {
        it("should remove listener from element", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy
            });

            const $testElem = $("#test");

            const listenerCall = jasmine.createSpy("listener");
            const listenerNotCall = jasmine.createSpy("listener");

            erd.listenTo($testElem[0], listenerCall);
            erd.listenTo($testElem[0], listenerNotCall);

            setTimeout(function () {
                erd.removeListener($testElem[0], listenerNotCall);
                $testElem.width(300);
            }, 200);

            setTimeout(function () {
                expect(listenerCall).toHaveBeenCalled();
                expect(listenerNotCall).not.toHaveBeenCalled();
                done();
            }, 400);
        });
    });

    describe("[" + strategy + "] resizeDetector.removeAllListeners", function () {
        it("should remove all listeners from element", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy
            });

            const $testElem = $("#test");

            const listener1 = jasmine.createSpy("listener");
            const listener2 = jasmine.createSpy("listener");

            erd.listenTo($testElem[0], listener1);
            erd.listenTo($testElem[0], listener2);

            setTimeout(function () {
                erd.removeAllListeners($testElem[0]);
                $testElem.width(300);
            }, 200);

            setTimeout(function () {
                expect(listener1).not.toHaveBeenCalled();
                expect(listener2).not.toHaveBeenCalled();
                done();
            }, 400);
        });

        it("should work for elements that don't have the detector installed", function () {
            const erd = elementResizeDetectorMaker({
                strategy
            });
            const $testElem = $("#test");
            expect(erd.removeAllListeners.bind(erd, $testElem[0])).not.toThrow();
        });
    });

    describe("[scroll] Specific scenarios", function () {
        it("should be able to call uninstall in the middle of a resize", function (done) {
            const erd = elementResizeDetectorMaker({
                strategy: "scroll"
            });

            const $testElem = $("#test");
            const testElem = $testElem[0];
            const listener = jasmine.createSpy("listener");

            erd.listenTo(testElem, listener);
            setTimeout(function () {
                // We want the uninstall to happen exactly when a scroll event occured before the delayed batched is going to be processed.
                // So we intercept the erd shrink/expand functions in the state so that we may call uninstall after the handling of the event.
                let uninstalled = false;

                function wrapOnScrollEvent(oldFn) {
                    return function () {
                        oldFn();
                        if (!uninstalled) {
                            expect(erd.uninstall.bind(erd, testElem)).not.toThrow();
                            uninstalled = true;
                            done();
                        }
                    };
                }

                const state = testElem._erd;
                state.onExpand = wrapOnScrollEvent(state.onExpand);
                state.onShrink = wrapOnScrollEvent(state.onShrink);
                $("#test").width(300);
            }, 50);
        });

        it("should be able to call uninstall and then install in the middle of a resize (issue #61)", function (done) {
            const erd = elementResizeDetectorMaker({
                strategy: "scroll",
                reporter
            });

            const $testElem = $("#test");
            const testElem = $testElem[0];
            const listener = jasmine.createSpy("listener");

            erd.listenTo(testElem, listener);
            setTimeout(function () {
                // We want the uninstall to happen exactly when a scroll event occured before the delayed batched is going to be processed.
                // So we intercept the erd shrink/expand functions in the state so that we may call uninstall after the handling of the event.
                let uninstalled = false;

                function wrapOnScrollEvent(oldFn) {
                    return function () {
                        oldFn();
                        if (!uninstalled) {
                            expect(erd.uninstall.bind(erd, testElem)).not.toThrow();
                            uninstalled = true;
                            const listener2 = jasmine.createSpy("listener");
                            expect(erd.listenTo.bind(erd, testElem, listener2)).not.toThrow();
                            setTimeout(function () {
                                done();
                            }, 0);
                        }
                    };
                }

                const state = testElem._erd;
                state.onExpand = wrapOnScrollEvent(state.onExpand);
                state.onShrink = wrapOnScrollEvent(state.onShrink);
                $("#test").width(300);
            }, 50);
        });

        // Only run this shadow DOM test for browsers that support the feature
        if (!!HTMLElement.prototype.attachShadow) {
            it("should work for elements within an open shadow root (issue #127)", function(done) {
                const erd = elementResizeDetectorMaker({
                    callOnAdd: false,
                    reporter,
                    strategy: "scroll"
                });

                const listener = jasmine.createSpy("listener");

                // Setup shadow root with a child div
                const shadow = $("#shadowtest")[0].attachShadow({mode: "open"});
                const shadowChild = document.createElement("div");
                shadow.appendChild(shadowChild);

                erd.listenTo(shadowChild, listener);

                setTimeout(function () {
                    $(shadowChild).width(300);
                }, 200);

                setTimeout(function () {
                    expect(listener).toHaveBeenCalledWith(shadowChild);
                    done();
                }, 400);
            });
        }
    });

    describe("[" + strategy + "] resizeDetector.uninstall", function () {
        it("should completely remove detector from element", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy
            });

            const $testElem = $("#test");

            const listener = jasmine.createSpy("listener");

            erd.listenTo($testElem[0], listener);

            setTimeout(function () {
                erd.uninstall($testElem[0]);
                // detector element should be removed
                expect($testElem[0].childNodes.length).toBe(0);
                $testElem.width(300);
            }, 200);

            setTimeout(function () {
                expect(listener).not.toHaveBeenCalled();
                done();
            }, 400);
        });

        it("should completely remove detector from multiple elements", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy
            });

            const listener = jasmine.createSpy("listener");

            erd.listenTo($("#test, #test2"), listener);

            setTimeout(function () {
                erd.uninstall($("#test, #test2"));
                // detector element should be removed
                expect($("#test")[0].childNodes.length).toBe(0);
                expect($("#test2")[0].childNodes.length).toBe(0);
                $("#test, #test2").width(300);
            }, 200);

            setTimeout(function () {
                expect(listener).not.toHaveBeenCalled();
                done();
            }, 400);
        });

        it("should be able to call uninstall directly after listenTo", function () {
            const erd = elementResizeDetectorMaker({
                strategy
            });

            const $testElem = $("#test");
            const listener = jasmine.createSpy("listener");

            erd.listenTo($testElem[0], listener);
            expect(erd.uninstall.bind(erd, $testElem[0])).not.toThrow();
        });

        it("should be able to call uninstall directly async after listenTo", function (done) {
            const erd = elementResizeDetectorMaker({
                strategy
            });

            const $testElem = $("#test");
            const listener = jasmine.createSpy("listener");

            erd.listenTo($testElem[0], listener);
            setTimeout(function () {
                expect(erd.uninstall.bind(erd, $testElem[0])).not.toThrow();
                done();
            }, 0);
        });

        it("should be able to call uninstall in callOnAdd callback", function (done) {
            let error = false;

            // Ugly hack to catch async errors.
            window.onerror = function () {
                error = true;
            };

            const erd = elementResizeDetectorMaker({
                strategy,
                callOnAdd: true
            });

            erd.listenTo($("#test"), function () {
                expect(erd.uninstall.bind(null, ($("#test")))).not.toThrow();
            });

            setTimeout(function () {
                expect(error).toBe(false);
                done();
                window.error = null;
            }, 50);
        });

        it("should be able to call uninstall in callOnAdd callback with multiple elements", function (done) {
            let error = false;

            // Ugly hack to catch async errors.
            window.onerror = function () {
                error = true;
            };

            const erd = elementResizeDetectorMaker({
                strategy,
                callOnAdd: true
            });

            const listener = jasmine.createSpy("listener");

            erd.listenTo($("#test, #test2"), function () {
                expect(erd.uninstall.bind(null, ($("#test, #test2")))).not.toThrow();
                listener();
            });

            setTimeout(function () {
                expect(listener.calls.count()).toBe(1);
                expect(error).toBe(false);
                done();
                window.error = null;
            }, 50);
        });

        it("should be able to call uninstall on non-erd elements", function () {
            const erd = elementResizeDetectorMaker({
                strategy
            });

            const $testElem = $("#test");

            expect(erd.uninstall.bind(erd, $testElem[0])).not.toThrow();

            const listener = jasmine.createSpy("listener");
            erd.listenTo($testElem[0], listener);
            expect(erd.uninstall.bind(erd, $testElem[0])).not.toThrow();
            expect(erd.uninstall.bind(erd, $testElem[0])).not.toThrow();
        });
    });
}

function importantRuleTest(strategy) {
    describe("[" + strategy + "] resizeDetector.important", function () {
        it("should add all rules with important", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: true,
                strategy,
                important: true
            });

            const testElem = $("#test");
            const listenerCall = jasmine.createSpy("listener");

            erd.listenTo(testElem[0], listenerCall);

            setTimeout(function () {
                if (strategy === "scroll") {
                    expect(testElem[0].style.cssText).toMatch(/!important;$/);
                }

                testElem.find("*").toArray().forEach(function (element) {
                    const rules = element.style.cssText.split(";").filter(function (rule) {
                        return !!rule;
                    });

                    rules.forEach(function (rule) {
                        expect(rule).toMatch(/!important$/);
                    });
                });

                done();
            }, 50);
        });

        it("Overrides important CSS", function (done) {
            const erd = elementResizeDetectorMaker({
                callOnAdd: false,
                strategy,
                important: true
            });

            const listener = jasmine.createSpy("listener");
            const testElem = $("#test");
            const style = document.createElement("style");
            style.appendChild(document.createTextNode("#test { position: static !important; }"));
            document.head.appendChild(style);

            erd.listenTo(testElem[0], listener);

            setTimeout(function () {
                $("#test").width(300);
            }, 100);

            setTimeout(function () {
                expect(listener).toHaveBeenCalledWith($("#test")[0]);
                done();
            }, 200);
        });
    });
}

describe("element-resize-detector", function () {
    beforeEach(function () {
        //This messed with tests in IE8.
        //TODO: Investigate why, because it would be nice to have instead of the current solution.
        //loadFixtures("element-resize-detector_fixture.html");
        $("#fixtures").html("<div id=test></div><div id=test2></div><div id=shadowtest></div>");
    });

    describe("elementResizeDetectorMaker", function () {
        it("should be globally defined", function () {
            expect(elementResizeDetectorMaker).toBeDefined();
        });

        it("should create an element-resize-detector instance", function () {
            const erd = elementResizeDetectorMaker();

            expect(erd).toBeDefined();
            expect(erd.listenTo).toBeDefined();
        });
    });

    // listenToTest("object");
    // removalTest("object");
    // importantRuleTest("object");
    listenToTest("scroll");
    removalTest("scroll");
    importantRuleTest("scroll");
});
